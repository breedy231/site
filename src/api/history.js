// src/api/history.js
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const token = req.headers.authorization?.split("Bearer ")[1]

  if (!token) {
    return res.status(401).json({ message: "No token provided" })
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "trakt-api-version": "2",
    "trakt-api-key": process.env.GATSBY_TRAKT_CLIENT_ID,
  }

  try {
    // Fetch both histories concurrently
    const [episodesResponse, moviesResponse] = await Promise.all([
      fetch("https://api.trakt.tv/users/me/history/episodes?limit=3", {
        headers,
      }),
      fetch("https://api.trakt.tv/users/me/history/movies?limit=3", {
        headers,
      }),
    ])

    if (!episodesResponse.ok || !moviesResponse.ok) {
      throw new Error("Failed to fetch history")
    }

    const [episodes, movies] = await Promise.all([
      episodesResponse.json(),
      moviesResponse.json(),
    ])

    return res.status(200).json({
      tv: episodes,
      movies: movies,
    })
  } catch (error) {
    console.error("Error fetching history:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
