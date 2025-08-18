// netlify/functions/trakt-token.js

export default async function handler(req) {
  // Handle preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ message: `Method ${req.method} not allowed` }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  try {
    // Parse JSON body for modern Netlify functions
    const body = await req.json()
    const { code } = body

    if (!code) {
      console.log("Missing authorization code in request:", body)
      return new Response(
        JSON.stringify({ message: "Missing authorization code" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("Exchanging code for token...", code.substring(0, 10) + "...") // Debug log
    console.log("Environment NODE_ENV:", process.env.NODE_ENV) // Debug log

    // Get the current host from the request headers
    const host = req.headers.get("host")
    const protocol = req.headers.get("x-forwarded-proto") || "https"
    const currentOrigin = `${protocol}://${host}`

    const redirectUri =
      process.env.NODE_ENV === "development"
        ? "http://localhost:8000/callback/trakt"
        : `${currentOrigin}/callback/trakt`

    console.log("Using redirect URI:", redirectUri) // Debug log
    console.log(
      "Using client ID:",
      process.env.GATSBY_TRAKT_CLIENT_ID?.substring(0, 10) + "...",
    ) // Debug log
    console.log(
      "Client secret exists:",
      !!process.env.GATSBY_TRAKT_CLIENT_SECRET,
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
          `HTTP ${response.status}: Failed to exchange token`,
      )
    }

    console.log("Token exchange successful") // Debug log
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Token exchange error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
