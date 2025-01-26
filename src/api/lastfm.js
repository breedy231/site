// src/api/lastfm.js
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const USERNAME = "breedy231"
  const API_KEY = process.env.GATSBY_LASTFM_API_KEY

  try {
    // Fetch recent tracks and top tracks concurrently
    const [recentTracksRes, topTracksRes] = await Promise.all([
      fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=5`,
      ),
      fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=3&period=7day`,
      ),
    ])

    if (!recentTracksRes.ok || !topTracksRes.ok) {
      throw new Error("Failed to fetch Last.fm data")
    }

    const [recentTracks, topTracks] = await Promise.all([
      recentTracksRes.json(),
      topTracksRes.json(),
    ])

    // Format the response
    const response = {
      recentTracks: recentTracks.recenttracks.track.map(track => ({
        name: track.name,
        artist: track.artist["#text"],
        album: track.album["#text"],
        url: track.url,
        isNowPlaying: track["@attr"]?.nowplaying === "true",
        timestamp: track.date?.uts ? parseInt(track.date.uts) * 1000 : null,
      })),
      topTracks: topTracks.toptracks.track.map(track => ({
        name: track.name,
        artist: track.artist.name,
        playcount: parseInt(track.playcount),
        url: track.url,
      })),
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error("Error fetching Last.fm data:", error)
    return res.status(500).json({ message: "Failed to fetch Last.fm data" })
  }
}
