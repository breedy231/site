// src/api/refresh-token.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const { refresh_token } = req.body

  if (!refresh_token) {
    return res.status(400).json({ message: "Refresh token is required" })
  }

  try {
    const response = await fetch("https://api.trakt.tv/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "trakt-api-version": "2",
        "trakt-api-key": process.env.GATSBY_TRAKT_CLIENT_ID,
      },
      body: JSON.stringify({
        refresh_token,
        client_id: process.env.GATSBY_TRAKT_CLIENT_ID,
        client_secret: process.env.GATSBY_TRAKT_CLIENT_SECRET,
        grant_type: "refresh_token",
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to refresh token")
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error("Error refreshing token:", error)
    return res.status(500).json({ message: "Failed to refresh token" })
  }
}
