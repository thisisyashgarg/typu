"use client"
import { useState } from "react"
import { extractRequestBody, extractType, isHtml } from "../utils"
import axios from "axios"

const Home = () => {
  const [curlCommand, setCurlCommand] = useState<string>("")
  const [requestType, setRequestType] = useState<any>(null)
  const [responseType, setResponseType] = useState<any>(null)
  const [requestCopyStatus, setRequestCopyStatus] = useState<string>("Copy")
  const [responseCopyStatus, setResponseCopyStatus] = useState<string>("Copy")
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>("")

  const handleCurlSubmit = async () => {
    try {
      setLoading(true)
      setErrorMessage("")
      const requestBody = extractRequestBody(curlCommand)
      setRequestType(extractType(requestBody))
      const response = await axios.post("/api/curl", { curl: curlCommand })
      if (isHtml(response.data.data)) {
        setResponseType(`export type IRoot = string; // HTML response`)
        return
      }
      const data = JSON.parse(response.data.data)
      setResponseType(extractType(data))
    } catch (error) {
      console.error("Error processing cURL command:", error)
      setErrorMessage(
        "Invalid cURL command or API request failed. Please check and try again."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (text: string, type: "request" | "response") => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === "request") {
        setRequestCopyStatus("Copied!")
        setTimeout(() => setRequestCopyStatus("Copy"), 2000)
      } else {
        setResponseCopyStatus("Copied!")
        setTimeout(() => setResponseCopyStatus("Copy"), 2000)
      }
    } catch (error) {
      console.error("Failed to copy text:", error)
    }
  }

  return (
    <div className="min-h-screen bg-[#212529] flex flex-col items-center justify-center p-4 font-roboto-mono text-[#E9ECEF]">
      <div className="bg-[#343A40] shadow-md rounded-lg p-6 max-w-4xl w-full md:w-11/12 sm:w-full">
        <h1 className="text-3xl font-semibold text-[#F8F9FA] mb-4 text-center">
          Typu
        </h1>
        <p className="text-lg text-[#F8F9FA] mb-6 text-center">
          A simple tool to generate TypeScript types from cURL commands.
        </p>

        <textarea
          value={curlCommand}
          onChange={(e) => setCurlCommand(e.target.value)}
          rows={5}
          className="w-full p-3 border border-[#495057] bg-[#212529] rounded-md focus:outline-none focus:ring-2 focus:ring-[#495057] text-[#F8F9FA]"
          placeholder="Paste your cURL command here"
        />
        <div className="flex justify-center mt-4">
          <button
            onClick={handleCurlSubmit}
            type="button"
            className="bg-[#495057] hover:bg-[#6C757D] text-[#F8F9FA] font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ADB5BD]"
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-[#F8F9FA]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
            ) : (
              "Generate Types"
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 text-[#DE3545] text-center">{errorMessage}</div>
        )}
        {requestType && (
          <div className="mt-6 relative">
            <h2 className="text-xl font-semibold text-[#F8F9FA] mb-2">
              Request Type
            </h2>
            <pre className="bg-[#212529] p-4 rounded-md text-[#ADB5BD] overflow-x-auto">
              {requestType}
            </pre>
            <button
              onClick={() => handleCopy(requestType, "request")}
              className="absolute top-0 right-0 mt-2 mr-2 bg-[#495057] hover:bg-[#6C757D] text-[#F8F9FA] font-bold py-1 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ADB5BD]"
            >
              {requestCopyStatus}
            </button>
          </div>
        )}
        {responseType && (
          <div className="mt-6 relative">
            <h2 className="text-xl font-semibold text-[#F8F9FA] mb-2">
              Response Type
            </h2>
            <pre className="bg-[#212529] p-4 rounded-md text-[#ADB5BD] overflow-x-auto">
              {responseType}
            </pre>
            <button
              onClick={() => handleCopy(responseType, "response")}
              className="absolute top-0 right-0 mt-2 mr-2 bg-[#495057] hover:bg-[#6C757D] text-[#F8F9FA] font-bold py-1 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ADB5BD]"
            >
              {responseCopyStatus}
            </button>
          </div>
        )}
      </div>
      <footer className="mt-8 text-center flex gap-2 text-[#ADB5BD]">
        <a
          href="https://github.com/thisisyashgarg/typu/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Report a Bug
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
