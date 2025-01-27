export const handler = async event => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ message: "Method not allowed" }),
    }
  }

  let code
  try {
    const body = JSON.parse(event.body)
    code = body.code
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Invalid request body" }),
    }
  }

  if (!code) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Authorization code is required" }),
    }
  }

  try {
    const formData = new URLSearchParams()
    formData.append("code", code)
    formData.append("client_id", process.env.GATSBY_TRAKT_CLIENT_ID)
    formData.append("client_secret", process.env.GATSBY_TRAKT_CLIENT_SECRET)
    formData.append(
      "redirect_uri",
      `${process.env.GATSBY_SITE_URL || "http://localhost:8000"}/callback`
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
      return {
        statusCode: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(data),
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(data),
    }
  } catch (error) {
    console.error("Token exchange error:", error)
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Internal server error" }),
    }
  }
}
