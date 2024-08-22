import { CurlDetails } from "./types"

export const extractCurlDetails = (curlCommand: string): CurlDetails | null => {
  const urlMatch = curlCommand.match(/(https?:\/\/[^\s]+)/)
  const methodMatch = curlCommand.match(/-X\s+(\w+)/)
  const headerMatches = [...curlCommand.matchAll(/-H\s+"([^:]+):\s*([^"]+)"/g)]
  const bodyMatch = curlCommand.match(/-d\s*'(.+?)'/)

  if (!urlMatch || !methodMatch) return null

  const url = urlMatch[0]
  const method = methodMatch[1]
  const headers: Record<string, string> = {}

  headerMatches.forEach(([_, key, value]) => {
    headers[key] = value
  })

  let body
  if (bodyMatch) {
    try {
      body = JSON.parse(bodyMatch[1])
    } catch (error) {
      console.error("Invalid JSON in the request body:", error)
      body = undefined
    }
  }

  return { url, method, headers, body }
}

export const extractType = (data: any): { [key: string]: string } | null => {
  if (typeof data !== "object") return null
  const typeObj: { [key: string]: string } = {}
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      typeObj[key] = typeof data[key]
    }
  }
  return typeObj
}

export const sendRequest = async (details: CurlDetails): Promise<any> => {
  const { url, method, headers, body } = details

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const contentType = response.headers.get("Content-Type")

  if (contentType && contentType.includes("application/json")) {
    return await response.json()
  } else {
    return await response.text()
  }
}

export const formatTypeOutput = (typeObj: Record<string, string>): string => {
  return JSON.stringify(typeObj, null, 2)
    .replace(/\"([^(\")"]+)\":/g, "$1:") // Remove quotes around keys
    .replace(/\"(string|number|boolean|object|undefined|null)\"/g, "$1") // Remove quotes around types
}
