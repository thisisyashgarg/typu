export const extractRequestBody = (curlCommand: string): any => {
  // Match the body data (supports single quotes, double quotes, or no quotes)
  const bodyMatch = curlCommand.match(
    /(?:--data-raw|-d|--data)\s+(["'])([\s\S]*?)\1|(?:--data-raw|-d|--data)\s+(\{[\s\S]*\})/
  )

  let body = {}

  if (bodyMatch) {
    const rawBody = bodyMatch[2] || bodyMatch[3]

    try {
      // Attempt to parse the body as JSON
      body = JSON.parse(rawBody)
    } catch (error) {
      console.warn("Body is not valid JSON, returning as a string")
      body = rawBody
    }
  }

  return body
}

export const extractType = (data: any, parentKey = "Root"): string => {
  const interfaceStack: string[] = []
  const interfaceMap = new Map<string, string>()
  const rootInterface = `I${capitalizeFirstLetter(parentKey)}`
  const pendingInterfaces: Array<{
    key: string
    value: any
    interfaceName: string
  }> = [{ key: parentKey, value: data, interfaceName: rootInterface }]

  while (pendingInterfaces.length > 0) {
    const { key, value, interfaceName } = pendingInterfaces.pop()!

    if (typeof value !== "object" || value === null) continue

    const lines: string[] = [`export interface ${interfaceName} {`]

    for (const k in value) {
      if (value.hasOwnProperty(k)) {
        const v = value[k]

        if (v === null) {
          lines.push(`  ${k}: null;`)
        } else if (v === undefined) {
          lines.push(`  ${k}: undefined;`)
        } else if (Array.isArray(v)) {
          if (v.length > 0) {
            if (typeof v[0] === "object") {
              const nestedInterfaceName = `I${capitalizeFirstLetter(k)}`
              lines.push(`  ${k}: ${nestedInterfaceName}[];`)
              pendingInterfaces.push({
                key: k,
                value: v[0],
                interfaceName: nestedInterfaceName,
              })
            } else {
              lines.push(`  ${k}: ${typeof v[0]}[];`)
            }
          } else {
            lines.push(`  ${k}: any[];`)
          }
        } else if (typeof v === "object") {
          const nestedInterfaceName = `I${capitalizeFirstLetter(k)}`
          lines.push(`  ${k}: ${nestedInterfaceName};`)
          pendingInterfaces.push({
            key: k,
            value: v,
            interfaceName: nestedInterfaceName,
          })
        } else {
          lines.push(`  ${k}: ${typeof v};`)
        }
      }
    }

    lines.push("}")
    interfaceMap.set(interfaceName, lines.join("\n"))
  }

  interfaceStack.push(...Array.from(interfaceMap.values()).reverse())
  return interfaceStack.join("\n\n")
}

const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
