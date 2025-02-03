// src/pages/callback/trakt.js
import React, { useEffect, useState } from "react"
import { navigate } from "gatsby"

const TraktCallback = () => {
  const [status, setStatus] = useState("Processing...")
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get("code")

      if (!code) {
        setStatus("Error: No authorization code received")
        return
      }

      try {
        console.log("Sending token exchange request...") // Debug log
        const response = await fetch("/api/trakt-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ code }),
        })

        console.log("Response status:", response.status) // Debug log

        const contentType = response.headers.get("content-type")
        let data
        if (contentType && contentType.includes("application/json")) {
          data = await response.json()
        } else {
          const text = await response.text()
          console.error("Unexpected response type:", contentType, text)
          throw new Error("Invalid response format from server")
        }

        if (!response.ok) {
          throw new Error(data.error || "Failed to exchange code for token")
        }

        // Display tokens (in development only)
        if (process.env.NODE_ENV === "development") {
          setStatus(`
Authentication successful! Add these to your .env.development file:

GATSBY_TRAKT_ACCESS_TOKEN=${data.access_token}
GATSBY_TRAKT_REFRESH_TOKEN=${data.refresh_token}

You can now restart your Gatsby development server.`)
        } else {
          navigate("/now")
        }
      } catch (error) {
        console.error("Error during OAuth callback:", error)
        setError(error.message)
        setStatus("Authentication failed")
      }
    }

    handleCallback()
  }, [])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-xl rounded-lg bg-white p-6 shadow-md">
          <h1 className="mb-4 text-2xl font-bold text-red-600">
            Authentication Error
          </h1>
          <div className="rounded border border-red-200 bg-red-50 p-4">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-xl rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-bold">Trakt Authentication</h1>
        <pre className="whitespace-pre-wrap rounded bg-gray-100 p-4">
          {status}
        </pre>
      </div>
    </div>
  )
}

export default TraktCallback
