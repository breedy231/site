// src/api/trakt-token.js
import fetch from "node-fetch"

export default async function handler(req, res) {
  // Add CORS headers for development
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  // Handle preflight request
  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  if (req.method !== "POST") {
    res.status(405).json({ message: `Method ${req.method} not allowed` })
    return
  }

  try {
    // Gatsby already parses JSON bodies, so no need to parse req.body
    const { code } = req.body

    if (!code) {
      res.status(400).json({ message: "Missing authorization code" })
      return
    }

    console.log("Exchanging code for token...") // Debug log

    const response = await fetch("https://api.trakt.tv/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        client_id: process.env.GATSBY_TRAKT_CLIENT_ID,
        client_secret: process.env.GATSBY_TRAKT_CLIENT_SECRET,
        redirect_uri: "http://localhost:8000/callback/trakt",
        grant_type: "authorization_code",
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Trakt API error:", data) // Debug log
      throw new Error(data.error || "Failed to exchange token")
    }

    console.log("Token exchange successful") // Debug log
    res.status(200).json(data)
  } catch (error) {
    console.error("Token exchange error:", error)
    res.status(500).json({ error: error.message })
  }
}
