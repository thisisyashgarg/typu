const IDENTIFIER = /^[A-Za-z_$][\w$]*$/
const DATE_KEY = /(_at|_on|_date|_time)$|(At|On|Date|Time)$|^(date|time|timestamp)$/

const pascal = (key: string): string =>
  key
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("") || "Item"

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

export const FILE_MARKER = "__typu_file__"

export const generateTypes = (
  roots: Array<{ name: string; value: unknown }>
): string[] => {
  const used = new Set<string>()
  const uniqueName = (key: string) => {
    const base = `I${pascal(key)}`
    let name = base
    for (let i = 2; used.has(name); i++) name = `${base}${i}`
    used.add(name)
    return name
  }

  return roots.map(({ name, value }) => {
    const declarations: string[] = []

    const objectType = (objects: Record<string, unknown>[], key: string) => {
      const interfaceName = uniqueName(key)
      const slot = declarations.push("") - 1
      const keys = Array.from(new Set(objects.flatMap(Object.keys)))
      const lines = keys.map((k) => {
        const samples = objects.filter((o) => k in o).map((o) => o[k])
        const optional = samples.length < objects.length ? "?" : ""
        const prop = IDENTIFIER.test(k) ? k : JSON.stringify(k)
        return `  ${prop}${optional}: ${typeOf(samples, k)};`
      })
      declarations[slot] = lines.length
        ? `export interface ${interfaceName} {\n${lines.join("\n")}\n}`
        : `export interface ${interfaceName} {}`
      return interfaceName
    }

    const typeOf = (samples: unknown[], key: string): string => {
      const parts = new Set<string>()
      const objects: Record<string, unknown>[] = []
      const arrays: unknown[][] = []
      let hasNull = false

      for (const s of samples) {
        if (s === null || s === undefined) hasNull = true
        else if (s === FILE_MARKER) parts.add("File")
        else if (Array.isArray(s)) arrays.push(s)
        else if (isPlainObject(s)) objects.push(s)
        else parts.add(typeof s)
      }

      if (arrays.length) {
        const inner = typeOf(arrays.flat(), `${key}Item`)
        parts.add(inner.includes(" ") ? `(${inner})[]` : `${inner}[]`)
      }
      if (objects.length) parts.add(objectType(objects, key))
      if (hasNull) {
        if (!parts.size) parts.add(DATE_KEY.test(key) ? "string" : "unknown")
        parts.add("null")
      }
      return parts.size ? Array.from(parts).join(" | ") : "unknown"
    }

    if (isPlainObject(value)) {
      objectType([value], name)
    } else {
      const typeName = uniqueName(name)
      const slot = declarations.push("") - 1
      declarations[slot] = `export type ${typeName} = ${typeOf([value], name)};`
    }
    return declarations.join("\n\n")
  })
}

export const parseMaybeJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
