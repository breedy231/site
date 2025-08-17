// src/api/history.js

// Helper function to send notification when tokens need attention
async function notifyAdminOfTokenIssue(error) {
  // Only send notifications in production to avoid spam during development
  if (process.env.NODE_ENV === "development") {
    console.log("Would notify admin:", error)
    return
  }

  try {
    // Simple console log for now - could be enhanced with actual email/webhook
    console.error("ADMIN ALERT: Trakt token issue:", error)
  } catch (err) {
    console.error("Notification error:", err)
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const token = req.headers.authorization?.split("Bearer ")[1]

  if (!token) {
    return res.status(401).json({
      message: "No token provided",
      authRequired: true,
    })
  }

  const TMDB_API_KEY = process.env.GATSBY_TMDB_API_KEY
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "trakt-api-version": "2",
    "trakt-api-key": process.env.GATSBY_TRAKT_CLIENT_ID,
  }

  async function getTMDBImage(type, id) {
    if (!id || !TMDB_API_KEY) return null

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}`,
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
    // Fetch episodes and movies history
    const [episodesRes, moviesRes] = await Promise.all([
      fetch(
        "https://api.trakt.tv/users/me/history/episodes?limit=3&extended=full",
        {
          headers,
        },
      ),
      fetch(
        "https://api.trakt.tv/users/me/history/movies?limit=3&extended=full",
        {
          headers,
        },
      ),
    ])

    // Check for authentication errors
    if (episodesRes.status === 401 || moviesRes.status === 401) {
      await notifyAdminOfTokenIssue("Trakt access token has expired")
      return res.status(401).json({
        message: "Trakt access token has expired. Please re-authenticate.",
        authRequired: true,
      })
    }

    if (!episodesRes.ok || !moviesRes.ok) {
      const errorText = !episodesRes.ok
        ? await episodesRes.text()
        : await moviesRes.text()
      throw new Error(`Failed to fetch history: ${errorText}`)
    }

    const [episodes, movies] = await Promise.all([
      episodesRes.json(),
      moviesRes.json(),
    ])

    // Fetch TMDB images if we have a TMDB API key
    let enhancedEpisodes = [...episodes]
    let enhancedMovies = [...movies]

    if (TMDB_API_KEY) {
      // Fetch images for shows and movies
      const [showImages, movieImages] = await Promise.all([
        Promise.all(
          episodes.map(episode => getTMDBImage("tv", episode.show?.ids?.tmdb)),
        ),
        Promise.all(
          movies.map(movie => getTMDBImage("movie", movie.movie?.ids?.tmdb)),
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

    return res.status(200).json({
      tv: enhancedEpisodes,
      movies: enhancedMovies,
    })
  } catch (error) {
    console.error("Error fetching history:", error)
    return res.status(500).json({
      message: error.message || "Internal server error",
    })
  }
}
