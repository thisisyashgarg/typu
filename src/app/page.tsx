"use client"
import { useState } from "react"
import { generateTypes, parseMaybeJson } from "@/utils"

const SAMPLE = `curl https://jsonplaceholder.typicode.com/posts \\
  -H 'Content-Type: application/json' \\
  -d '{"title": "Hello", "body": "World", "userId": 1}'`

interface Panel {
  title: string
  code?: string
  meta?: string
  error?: string
}

const Home = () => {
  const [input, setInput] = useState("")
  const [typeName, setTypeName] = useState("")
  const [panels, setPanels] = useState<Panel[]>([])
  const [copied, setCopied] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const generate = async () => {
    const text = input.trim()
    if (!text || loading) return
    setLoading(true)
    setError("")
    setPanels([])
    try {
      if (/^[[{]/.test(text)) {
        let value: unknown
        try {
          value = JSON.parse(text)
        } catch (e) {
          throw new Error(`Invalid JSON: ${(e as Error).message}`)
        }
        const [code] = generateTypes([{ name: typeName || "Root", value }])
        setPanels([{ title: "Type", code }])
        return
      }

      const res = await fetch("/api/curl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curl: text }),
      })
      const json = await res.json().catch(() => ({ error: "Server error." }))
      if (!res.ok) throw new Error(json.error)

      const { request, response, responseError } = json
      const requestName = `${typeName}Request`
      const responseName = `${typeName}Response`
      const roots: Array<{ name: string; value: unknown }> = []
      if (request.body !== undefined)
        roots.push({
          name: requestName,
          value:
            typeof request.body === "string"
              ? parseMaybeJson(request.body)
              : request.body,
        })
      const responseIsTyped = response && !response.binary && response.body
      if (responseIsTyped)
        roots.push({ name: responseName, value: parseMaybeJson(response.body) })
      const generated = generateTypes(roots)

      const next: Panel[] = []
      if (request.body !== undefined)
        next.push({ title: "Request body", code: generated.shift() })
      next.push({
        title: "Response",
        meta: response
          ? `${response.status} · ${response.durationMs} ms${response.contentType ? ` · ${response.contentType.split(";")[0]}` : ""}`
          : undefined,
        error: responseError,
        code: responseIsTyped
          ? generated.shift()
          : response?.binary
            ? `export type I${responseName} = Blob;`
            : response
              ? `export type I${responseName} = void;`
              : undefined,
      })
      setPanels(next)
    } catch (e) {
      setError((e as Error).message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const copy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(index)
      setTimeout(() => setCopied((c) => (c === index ? null : c)), 1500)
    } catch {
      setError("Couldn't access the clipboard.")
    }
  }

  return (
    <div className="min-h-screen bg-[#16181b] text-[#E9ECEF] flex flex-col">
      <header className="px-6 pt-10 pb-6 max-w-6xl w-full mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">
          typu<span className="text-[#7c9cff]">.</span>
        </h1>
        <p className="text-[#9aa1a9] mt-1">
          Paste a cURL command or JSON, get TypeScript types.
        </p>
      </header>

      <main className="flex-1 px-6 pb-10 max-w-6xl w-full mx-auto grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label htmlFor="input" className="text-sm font-semibold text-[#c9ced4]">
              Input
            </label>
            <button
              type="button"
              onClick={() => setInput(SAMPLE)}
              className="text-sm text-[#7c9cff] hover:underline"
            >
              Try a sample
            </button>
          </div>
          <textarea
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate()
            }}
            spellCheck={false}
            rows={14}
            className="w-full p-4 rounded-lg bg-[#0f1113] border border-[#2a2e33] font-mono text-sm leading-relaxed resize-y focus:outline-none focus:border-[#7c9cff]"
            placeholder={"curl https://api.example.com/users/1\n\nor\n\n{ \"id\": 1, \"name\": \"Ada\" }"}
          />
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="type-name" className="text-xs text-[#9aa1a9]">
                Type name
              </label>
              <input
                id="type-name"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value.replace(/[^A-Za-z0-9_]/g, ""))}
                placeholder="User"
                className="w-40 px-3 py-2 rounded-md bg-[#0f1113] border border-[#2a2e33] font-mono text-sm focus:outline-none focus:border-[#7c9cff]"
              />
            </div>
            <button
              type="button"
              onClick={generate}
              disabled={loading || !input.trim()}
              className="ml-auto flex items-center gap-2 bg-[#7c9cff] hover:bg-[#93adff] disabled:opacity-50 disabled:cursor-not-allowed text-[#0f1113] font-semibold py-2 px-4 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {loading && (
                <span className="h-4 w-4 rounded-full border-2 border-[#0f1113]/30 border-t-[#0f1113] animate-spin" />
              )}
              Generate types
              <kbd className="hidden sm:inline text-xs opacity-60 font-sans">⌘↵</kbd>
            </button>
          </div>
          {error && (
            <p role="alert" className="text-sm text-[#ff6b7a]">
              {error}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-4 min-w-0" aria-live="polite">
          {panels.length === 0 && (
            <div className="h-full min-h-48 rounded-lg border border-dashed border-[#2a2e33] flex items-center justify-center text-sm text-[#6c737a]">
              {loading ? "Sending request…" : "Types appear here"}
            </div>
          )}
          {panels.map((panel, i) => (
            <div key={panel.title} className="rounded-lg border border-[#2a2e33] bg-[#0f1113] min-w-0">
              <div className="flex items-center gap-3 px-4 py-2 border-b border-[#2a2e33]">
                <h2 className="text-sm font-semibold text-[#c9ced4]">{panel.title}</h2>
                {panel.meta && (
                  <span className="text-xs font-mono text-[#9aa1a9] truncate">{panel.meta}</span>
                )}
                {panel.code && (
                  <button
                    type="button"
                    onClick={() => copy(panel.code!, i)}
                    className="ml-auto text-xs px-2 py-1 rounded bg-[#2a2e33] hover:bg-[#3a3f45]"
                  >
                    {copied === i ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              {panel.error && <p className="px-4 pt-3 text-sm text-[#ff6b7a]">{panel.error}</p>}
              {panel.code && (
                <pre className="p-4 overflow-x-auto font-mono text-sm leading-relaxed text-[#b8e0a8]">
                  {panel.code}
                </pre>
              )}
            </div>
          ))}
        </section>
      </main>

      <footer className="pb-8 text-center text-sm flex gap-2 justify-center text-[#6c737a]">
        <a
          href="https://github.com/thisisyashgarg/typu/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Report a bug
        </a>
        •
        <a
          href="https://github.com/thisisyashgarg/typu"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          GitHub
        </a>
      </footer>
    </div>
  )
}

export default Home
