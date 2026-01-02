// src/pages/callback/trakt.js
import React, { useEffect, useState } from "react"

const TraktCallback = () => {
  const [status, setStatus] = useState("Processing...")
  const [error, setError] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const handleCallback = async () => {
      try {
        console.log("Callback page loaded, checking for code...")
        const params = new URLSearchParams(window.location.search)
        const code = params.get("code")
        console.log("Authorization code found:", code ? "yes" : "no")

        if (!code) {
          setStatus("Error: No authorization code received")
          setError("No code parameter found in URL")
          return
        }

        console.log("Sending token exchange request...") // Debug log
        const apiUrl =
          process.env.NODE_ENV === "development"
            ? "/api/trakt-token"
            : "/.netlify/functions/trakt-token"
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ code }),
        })

        console.log("Response status:", response.status) // Debug log
        console.log("Response headers:", Object.fromEntries(response.headers)) // Debug log

        const contentType = response.headers.get("content-type")
        let data
        if (contentType && contentType.includes("application/json")) {
          data = await response.json()
          console.log("Response data:", data) // Debug log
        } else {
          const text = await response.text()
          console.error("Unexpected response type:", contentType, text)
          throw new Error("Invalid response format from server")
        }

        if (!response.ok) {
          throw new Error(data.error || "Failed to exchange code for token")
        }

        // Display tokens for admin users
        if (process.env.NODE_ENV === "development") {
          setStatus(`
Authentication successful! Add these to your .env.development file:

GATSBY_TRAKT_ACCESS_TOKEN=${data.access_token}
GATSBY_TRAKT_REFRESH_TOKEN=${data.refresh_token}

You can now restart your Gatsby development server.`)
        } else {
          // In production, show tokens to admin for manual environment variable update
          setStatus(`
Authentication successful! 

⚠️  ADMIN ACTION REQUIRED ⚠️

Add these environment variables to your Netlify site settings:

GATSBY_TRAKT_ACCESS_TOKEN=${data.access_token}
GATSBY_TRAKT_REFRESH_TOKEN=${data.refresh_token}

Steps:
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Update the above variables with these new values
3. Trigger a new deployment

After updating environment variables, the "Now" page will show your Trakt data.`)
        }
      } catch (error) {
        console.error("Error during OAuth callback:", error)
        setError(error.message)
        setStatus("Authentication failed")
      }
    }

    handleCallback().catch(error => {
      console.error("Unhandled error in callback:", error)
      setError(error.message)
      setStatus("Unexpected error occurred")
    })
  }, [mounted])

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-xl rounded-lg bg-white p-6 shadow-md">
          <h1 className="mb-4 text-2xl font-bold">Loading...</h1>
          <p>Initializing Trakt authentication...</p>
        </div>
      </div>
    )
  }

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
          <div className="mt-4">
            <button
              onClick={() => (window.location.href = "/now")}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Return to Now Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-xl rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-bold">Trakt Authentication</h1>
        <pre className="rounded bg-gray-100 p-4 whitespace-pre-wrap">
          {status}
        </pre>
      </div>
    </div>
  )
}

export default TraktCallback
