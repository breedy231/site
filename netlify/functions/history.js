// Helper function to refresh token if needed
async function refreshAccessToken() {
  const response = await fetch("https://api.trakt.tv/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: process.env.GATSBY_TRAKT_REFRESH_TOKEN,
      client_id: process.env.GATSBY_TRAKT_CLIENT_ID,
      client_secret: process.env.GATSBY_TRAKT_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to refresh token")
  }

  const data = await response.json()
  return data.access_token
}

// Helper function to make API requests with automatic token refresh
async function makeAuthorizedRequest(url, token, headers) {
  let currentToken = token
  let response = await fetch(url, {
    headers: {
      ...headers,
      Authorization: `Bearer ${currentToken}`,
    },
  })

  // If token is expired, refresh and retry
  if (response.status === 401) {
    try {
      currentToken = await refreshAccessToken()
      response = await fetch(url, {
        headers: {
          ...headers,
          Authorization: `Bearer ${currentToken}`,
        },
      })

      // If still failing after refresh, the refresh token is likely invalid
      if (response.status === 401) {
        throw new Error(
          "Token refresh failed: Both access and refresh tokens are invalid"
        )
      }
    } catch (error) {
      throw new Error("Token refresh failed: " + error.message)
    }
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const handler = async event => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization",
      },
      body: JSON.stringify({ message: "Method not allowed" }),
    }
  }

  const token = event.headers.authorization?.split("Bearer ")[1]

  if (!token) {
    return {
      statusCode: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "No token provided",
        authRequired: true,
      }),
    }
  }

  const TMDB_API_KEY = process.env.GATSBY_TMDB_API_KEY
  const headers = {
    "Content-Type": "application/json",
    "trakt-api-version": "2",
    "trakt-api-key": process.env.GATSBY_TRAKT_CLIENT_ID,
  }

  async function getTMDBImage(type, id) {
    if (!id || !TMDB_API_KEY) return null

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}`
      )
      if (!response.ok) return null

      const data = await response.json()
      return data.poster_path
        ? `https://image.tmdb.org/t/p/w300${data.poster_path}`
        : null
    } catch (error) {
      console.error(`Error fetching TMDB image for ${type} ${id}:`, error)
      return null
    }
  }

  try {
    // Fetch episodes and movies history with auto token refresh
    const [episodes, movies] = await Promise.all([
      makeAuthorizedRequest(
        "https://api.trakt.tv/users/me/history/episodes?limit=3&extended=full",
        token,
        headers
      ),
      makeAuthorizedRequest(
        "https://api.trakt.tv/users/me/history/movies?limit=3&extended=full",
        token,
        headers
      ),
    ])

    // Fetch TMDB images if we have a TMDB API key
    let enhancedEpisodes = [...episodes]
    let enhancedMovies = [...movies]

    if (TMDB_API_KEY) {
      // Fetch images for shows and movies
      const [showImages, movieImages] = await Promise.all([
        Promise.all(
          episodes.map(episode => getTMDBImage("tv", episode.show?.ids?.tmdb))
        ),
        Promise.all(
          movies.map(movie => getTMDBImage("movie", movie.movie?.ids?.tmdb))
        ),
      ])

      // Add images to the response data
      enhancedEpisodes = episodes.map((episode, index) => ({
        ...episode,
        image: showImages[index],
      }))

      enhancedMovies = movies.map((movie, index) => ({
        ...movie,
        image: movieImages[index],
      }))
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        tv: enhancedEpisodes,
        movies: enhancedMovies,
      }),
    }
  } catch (error) {
    console.error("Error fetching history:", error)

    // Check if it's an authentication error
    const isAuthError =
      error.message.includes("Token refresh failed") ||
      error.message.includes("Failed to refresh token") ||
      error.message.includes("HTTP error! status: 401")

    return {
      statusCode: isAuthError ? 401 : 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: isAuthError
          ? "Trakt access token has expired. Please re-authenticate."
          : error.message || "Internal server error",
        authRequired: isAuthError,
      }),
    }
  }
}
