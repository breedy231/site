export const handler = async event => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    }
  }

  try {
    const { code } = JSON.parse(event.body)

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Authorization code is required" }),
      }
    }

    // Use window.location.origin from the client, or construct from headers
    const origin =
      event.headers.origin || process.env.URL || process.env.DEPLOY_PRIME_URL
    const redirectUri = `${origin}/callback`.replace(/\/$/, "")

    console.log("Debug info:", {
      origin,
      redirectUri,
      hasClientId: !!process.env.GATSBY_TRAKT_CLIENT_ID,
      hasClientSecret: !!process.env.GATSBY_TRAKT_CLIENT_SECRET,
    })

    const formData = new URLSearchParams()
    formData.append("code", code)
    formData.append("client_id", process.env.GATSBY_TRAKT_CLIENT_ID)
    formData.append("client_secret", process.env.GATSBY_TRAKT_CLIENT_SECRET)
    formData.append("redirect_uri", redirectUri)
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

    return {
      statusCode: response.status,
      body: JSON.stringify(data),
    }
  } catch (error) {
    console.error("Token exchange error:", error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        error: error.message,
      }),
    }
  }
}
