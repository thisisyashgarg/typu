import { NextResponse } from "next/server"
import { toJsonString } from "curlconverter"
import { lookup } from "dns/promises"
import { BlockList, isIP } from "net"
import { FILE_MARKER } from "@/utils"

export const runtime = "nodejs"

const MAX_BYTES = 5 * 1024 * 1024
const MAX_REDIRECTS = 5
const TIMEOUT_MS = 15_000

interface ParsedCurl {
  raw_url: string
  method: string
  headers?: Record<string, string | null>
  data?: unknown
  files?: Record<string, string>
  auth?: { user: string; password: string }
}

const privateRanges = new BlockList()
for (const [net, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.168.0.0", 16],
] as const)
  privateRanges.addSubnet(net, prefix, "ipv4")
for (const [net, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
] as const)
  privateRanges.addSubnet(net, prefix, "ipv6")

const assertPublicHost = async (url: URL) => {
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("Only http and https URLs are supported.")
  if (process.env.NODE_ENV !== "production") return
  const host = url.hostname.replace(/^\[|\]$/g, "")
  const addresses = isIP(host)
    ? [{ address: host, family: isIP(host) }]
    : await lookup(host, { all: true })
  for (const { address, family } of addresses) {
    const v4Mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)?.[1]
    if (
      v4Mapped
        ? privateRanges.check(v4Mapped, "ipv4")
        : privateRanges.check(address, family === 6 ? "ipv6" : "ipv4")
    )
      throw new Error("Requests to private network addresses are blocked.")
  }
}

const encodeBody = (parsed: ParsedCurl, headers: Headers) => {
  const { data } = parsed
  if (data === undefined) return undefined
  if (typeof data === "string") return data
  if (/json/i.test(headers.get("content-type") ?? ""))
    return JSON.stringify(data)
  return new URLSearchParams(data as Record<string, string>).toString()
}

const send = async (parsed: ParsedCurl) => {
  if (parsed.files || (typeof parsed.data === "string" && parsed.data.startsWith("@")))
    throw new Error("Request reads a local file, so it can't be sent from here.")

  const headers = new Headers()
  for (const [k, v] of Object.entries(parsed.headers ?? {}))
    if (v !== null) headers.set(k, v)
  if (parsed.auth)
    headers.set(
      "authorization",
      `Basic ${Buffer.from(`${parsed.auth.user}:${parsed.auth.password}`).toString("base64")}`
    )

  const method = parsed.method.toUpperCase()
  const body = encodeBody(parsed, headers)
  let url = new URL(parsed.raw_url)
  const started = Date.now()

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url)
    const res = await fetch(url, {
      method,
      headers,
      body: ["GET", "HEAD"].includes(method) ? undefined : body,
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    const location = res.headers.get("location")
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url)
      continue
    }

    if (Number(res.headers.get("content-length")) > MAX_BYTES)
      throw new Error("Response is larger than 5 MB.")
    const buffer = await res.arrayBuffer()
    if (buffer.byteLength > MAX_BYTES)
      throw new Error("Response is larger than 5 MB.")

    const contentType = res.headers.get("content-type") ?? ""
    const isText =
      !contentType || /^text\/|json|xml|javascript|graphql/i.test(contentType)
    return {
      status: res.status,
      contentType,
      durationMs: Date.now() - started,
      binary: !isText,
      body: isText ? new TextDecoder().decode(buffer) : "",
    }
  }
  throw new Error("Too many redirects.")
}

export async function POST(req: Request) {
  const { curl } = await req.json().catch(() => ({}))
  if (!curl || typeof curl !== "string")
    return NextResponse.json(
      { error: "Missing `curl` command in request body." },
      { status: 400 }
    )

  let parsed: ParsedCurl
  try {
    parsed = JSON.parse(toJsonString(curl.trim()))
  } catch (error) {
    return NextResponse.json(
      {
        error: `Couldn't parse cURL command: ${error instanceof Error ? error.message.split("\n")[0] : "unknown error"}`,
      },
      { status: 400 }
    )
  }

  const files = Object.fromEntries(
    Object.keys(parsed.files ?? {}).map((k) => [k, FILE_MARKER])
  )
  const requestBody =
    parsed.files && (parsed.data === undefined || typeof parsed.data === "object")
      ? { ...(parsed.data as object), ...files }
      : parsed.data

  const request = { method: parsed.method.toUpperCase(), url: parsed.raw_url, body: requestBody }

  try {
    return NextResponse.json({ request, response: await send(parsed) })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === "TimeoutError"
          ? "Request timed out after 15s."
          : (error.cause as Error)?.message ?? error.message
        : "Request failed."
    return NextResponse.json({ request, responseError: message })
  }
}
