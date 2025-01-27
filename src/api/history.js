// src/api/history.js
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const token = req.headers.authorization?.split("Bearer ")[1]
  const TMDB_API_KEY = process.env.GATSBY_TMDB_API_KEY

  if (!token) {
    return res.status(401).json({ message: "No token provided" })
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "trakt-api-version": "2",
    "trakt-api-key": process.env.GATSBY_TRAKT_CLIENT_ID,
  }

  async function getTMDBImage(type, id) {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}`
      )
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
    const [episodesResponse, moviesResponse] = await Promise.all([
      fetch(
        "https://api.trakt.tv/users/me/history/episodes?limit=3&extended=full",
        {
          headers,
        }
      ),
      fetch(
        "https://api.trakt.tv/users/me/history/movies?limit=3&extended=full",
        {
          headers,
        }
      ),
    ])

    if (!episodesResponse.ok || !moviesResponse.ok) {
      throw new Error("Failed to fetch history")
    }

    const [episodes, movies] = await Promise.all([
      episodesResponse.json(),
      moviesResponse.json(),
    ])

    // Fetch TMDB images for shows and movies
    const [showImages, movieImages] = await Promise.all([
      Promise.all(
        episodes.map(episode => getTMDBImage("tv", episode.show.ids.tmdb))
      ),
      Promise.all(
        movies.map(movie => getTMDBImage("movie", movie.movie.ids.tmdb))
      ),
    ])

    // Add images to the response data
    const enhancedEpisodes = episodes.map((episode, index) => ({
      ...episode,
      image: showImages[index],
    }))

    const enhancedMovies = movies.map((movie, index) => ({
      ...movie,
      image: movieImages[index],
    }))

    return res.status(200).json({
      tv: enhancedEpisodes,
      movies: enhancedMovies,
    })
  } catch (error) {
    console.error("Error fetching history:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
