export const handler = async event => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    }
  }

  try {
    const { code } = JSON.parse(event.body)

    if (!code) {
      return {
        statusCode: 400,
        body: "Authorization code is required",
      }
    }

    const response = await fetch("https://api.trakt.tv/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        client_id: process.env.GATSBY_TRAKT_CLIENT_ID,
        client_secret: process.env.GATSBY_TRAKT_CLIENT_SECRET,
        redirect_uri: `${process.env.URL}/callback`,
        grant_type: "authorization_code",
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Trakt API error:", data)
      return {
        statusCode: response.status,
        body: JSON.stringify(data),
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    }
  } catch (error) {
    console.error("Token exchange error:", error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    }
  }
}
