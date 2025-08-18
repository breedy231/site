// netlify/functions/history.js

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

export default async function handler(req) {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  const token = req.headers.get("authorization")?.split("Bearer ")[1]

  if (!token) {
    return new Response(
      JSON.stringify({
        message: "No token provided",
        authRequired: true,
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    )
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
      return new Response(
        JSON.stringify({
          message: "Trakt access token has expired. Please re-authenticate.",
          authRequired: true,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      )
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

    return new Response(
      JSON.stringify({
        tv: enhancedEpisodes,
        movies: enhancedMovies,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error fetching history:", error)
    return new Response(
      JSON.stringify({
        message: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
