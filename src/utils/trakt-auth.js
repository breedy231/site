// src/utils/trakt-auth.js
export const getStoredToken = () => {
  if (typeof window === "undefined") return null

  const token = localStorage.getItem("trakt_token")
  const expiry = localStorage.getItem("trakt_token_expiry")

  if (!token || !expiry) return null

  // Check if token is expired or will expire in the next 5 minutes
  const expiryDate = new Date(expiry)
  const now = new Date()
  const fiveMinutes = 5 * 60 * 1000

  if (expiryDate <= new Date(now.getTime() + fiveMinutes)) {
    return refreshAccessToken()
  }

  return token
}

export const refreshAccessToken = async () => {
  try {
    const refresh_token = localStorage.getItem("trakt_refresh_token")
    if (!refresh_token) {
      throw new Error("No refresh token available")
    }

    const apiUrl =
      process.env.NODE_ENV === "development"
        ? "/api/refresh-token"
        : "/.netlify/functions/refresh-token"

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token }),
    })

    if (!response.ok) {
      throw new Error("Failed to refresh token")
    }

    const data = await response.json()

    // Store new tokens
    localStorage.setItem("trakt_token", data.access_token)
    localStorage.setItem("trakt_refresh_token", data.refresh_token)
    localStorage.setItem(
      "trakt_token_expiry",
      new Date(Date.now() + data.expires_in * 1000).toISOString(),
    )

    return data.access_token
  } catch (error) {
    console.error("Error refreshing token:", error)
    // Clear stored tokens on refresh failure
    localStorage.removeItem("trakt_token")
    localStorage.removeItem("trakt_refresh_token")
    localStorage.removeItem("trakt_token_expiry")
    return null
  }
}
