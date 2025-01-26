// src/pages/callback.js
import React, { useEffect, useState } from "react"
import { navigate } from "gatsby"

const CallbackPage = () => {
  const [status, setStatus] = useState("Processing...")

  useEffect(() => {
    const exchangeCodeForToken = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get("code")
      const error = params.get("error")

      console.log("URL params:", {
        code: code ? "present" : "missing",
        error: error || "none",
      })

      if (error) {
        console.error("Trakt auth error:", error)
        setStatus(`Auth error: ${error}`)
        return
      }

      if (!code) {
        console.error("No authorization code found in URL")
        setStatus("No authorization code found")
        return
      }

      try {
        setStatus("Exchanging code for token...")

        const tokenRequest = {
          code,
          client_id: process.env.GATSBY_TRAKT_CLIENT_ID,
          client_secret: process.env.GATSBY_TRAKT_CLIENT_SECRET,
          redirect_uri: `${window.location.origin}/callback`,
          grant_type: "authorization_code",
        }

        console.log("Request details:", {
          url: "https://api.trakt.tv/oauth/token",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            ...tokenRequest,
            client_secret: "[REDACTED]",
          },
        })

        const response = await fetch("/api/exchange-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        })

        const responseText = await response.text()
        console.log("Response details:", {
          status: response.status,
          headers: Object.fromEntries([...response.headers]),
          body: responseText,
        })

        if (!response.ok) {
          setStatus(
            `Token exchange failed: ${response.status} - ${responseText}`
          )
          return
        }

        let data
        try {
          data = JSON.parse(responseText)
        } catch (e) {
          console.error("Failed to parse response as JSON:", e)
          setStatus("Failed to parse response")
          return
        }

        if (data.access_token) {
          // In a real application, you'd want to store this securely
          // For development, we'll use localStorage
          localStorage.setItem("trakt_token", data.access_token)
          localStorage.setItem("trakt_refresh_token", data.refresh_token)
          localStorage.setItem(
            "trakt_token_expiry",
            new Date(Date.now() + data.expires_in * 1000).toISOString()
          )

          setStatus("Successfully authenticated!")
          setTimeout(() => navigate("/"), 1500)
        } else {
          setStatus("No access token in response")
        }
      } catch (error) {
        console.error("Authentication error:", error)
        setStatus(`Authentication failed: ${error.message}`)
      }
    }

    exchangeCodeForToken()
  }, [])

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <h1>{status}</h1>
      <pre style={{ maxWidth: "80%", overflow: "auto" }}>
        Check browser console for debug info
      </pre>
    </div>
  )
}

export default CallbackPage
