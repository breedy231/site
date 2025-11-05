// src/api/trakt-token.js
import fetch from "node-fetch"

export default async function handler(req) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers })
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ message: `Method ${req.method} not allowed` }),
      { status: 405, headers }
    )
  }

  try {
    // Parse the request body
    const body = await req.json()
    const { code } = body

    if (!code) {
      console.log("Missing authorization code in request:", body)
      return new Response(
        JSON.stringify({ message: "Missing authorization code" }),
        { status: 400, headers }
      )
    }

    console.log("Exchanging code for token...", code.substring(0, 10) + "...") // Debug log

    const redirectUri =
      process.env.NODE_ENV === "development"
        ? "http://localhost:8000/callback/trakt"
        : "https://brendantreed.com/callback/trakt"

    console.log("Using redirect URI:", redirectUri) // Debug log
    console.log(
      "Using client ID:",
      process.env.GATSBY_TRAKT_CLIENT_ID?.substring(0, 10) + "..."
    ) // Debug log

    const response = await fetch("https://api.trakt.tv/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        client_id: process.env.GATSBY_TRAKT_CLIENT_ID,
        client_secret: process.env.GATSBY_TRAKT_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Trakt API error:", response.status, data) // Debug log
      throw new Error(
        data.error_description ||
          data.error ||
          `HTTP ${response.status}: Failed to exchange token`
      )
    }

    console.log("Token exchange successful") // Debug log
    return new Response(JSON.stringify(data), { status: 200, headers })
  } catch (error) {
    console.error("Token exchange error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers,
    })
  }
}
