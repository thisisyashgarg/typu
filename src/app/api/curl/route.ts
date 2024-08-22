import { NextResponse } from "next/server"
import { exec } from "child_process"

// Wrap exec in a promise for async/await usage
const execPromise = (command: string) => {
  return new Promise<string>((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}`)
      } else {
        resolve(stdout)
      }
    })
  })
}

export async function POST(req: Request) {
  try {
    console.log("api hit")

    const body = await req.json()
    const { curl } = body

    if (!curl || typeof curl !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing `curl` command in request body." },
        { status: 400 }
      )
    }

    const result = await execPromise(curl)
    console.log(result, "result")

    return NextResponse.json({ data: result }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
