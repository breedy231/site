// netlify/functions/history.js
// Simplified Trakt history fetcher using free OAuth API

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
        message: "No authentication token provided",
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

  // Helper to fetch TMDB poster images
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
    // Fetch recent watch history for episodes and movies
    const [episodesRes, moviesRes] = await Promise.all([
      fetch(
        "https://api.trakt.tv/users/me/history/episodes?limit=3&extended=full",
        { headers },
      ),
      fetch(
        "https://api.trakt.tv/users/me/history/movies?limit=3&extended=full",
        { headers },
      ),
    ])

    // Check for authentication errors
    if (episodesRes.status === 401 || moviesRes.status === 401) {
      console.log("Trakt token expired - re-authentication required")
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

    // Check for other errors
    if (!episodesRes.ok || !moviesRes.ok) {
      const errorText = !episodesRes.ok
        ? await episodesRes.text()
        : await moviesRes.text()
      throw new Error(`Failed to fetch history: ${errorText}`)
    }

    // Parse the responses
    const [episodes, movies] = await Promise.all([
      episodesRes.json(),
      moviesRes.json(),
    ])

    // Enhance with TMDB poster images
    let enhancedEpisodes = [...episodes]
    let enhancedMovies = [...movies]

    if (TMDB_API_KEY) {
      const [showImages, movieImages] = await Promise.all([
        Promise.all(
          episodes.map(episode => getTMDBImage("tv", episode.show?.ids?.tmdb)),
        ),
        Promise.all(
          movies.map(movie => getTMDBImage("movie", movie.movie?.ids?.tmdb)),
        ),
      ])

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
