export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const { code } = req.body

  if (!code) {
    return res.status(400).json({ message: "Authorization code is required" })
  }

  try {
    const formData = new URLSearchParams()
    formData.append("code", code)
    formData.append("client_id", process.env.GATSBY_TRAKT_CLIENT_ID)
    formData.append("client_secret", process.env.GATSBY_TRAKT_CLIENT_SECRET)
    formData.append(
      "redirect_uri",
      `${process.env.GATSBY_SITE_URL || "http://localhost:8000"}/callback`,
    )
    formData.append("grant_type", "authorization_code")

    const response = await fetch("https://api.trakt.tv/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "trakt-api-version": "2",
        "trakt-api-key": process.env.GATSBY_TRAKT_CLIENT_ID,
      },
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    return res.status(200).json(data)
  } catch (error) {
    console.error("Token exchange error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
