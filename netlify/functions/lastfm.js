import fetch from "node-fetch"

export const handler = async event => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Method not allowed" }),
    }
  }

  const USERNAME = "breedy231"
  const API_KEY = process.env.GATSBY_LASTFM_API_KEY

  try {
    const [recentTracksRes, topTracksRes] = await Promise.all([
      fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=5`
      ),
      fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${USERNAME}&api_key=${API_KEY}&format=json&limit=3&period=7day`
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
        image: track.image?.[2]?.["#text"] || null, // Get medium-sized image
        isNowPlaying: track["@attr"]?.nowplaying === "true",
        timestamp: track.date?.uts ? parseInt(track.date.uts) * 1000 : null,
      })),
      topTracks: topTracks.toptracks.track.map(track => ({
        name: track.name,
        artist: track.artist.name,
        playcount: parseInt(track.playcount),
        url: track.url,
        image: track.image?.[2]?.["#text"] || null, // Get medium-sized image
      })),
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(response),
    }
  } catch (error) {
    console.error("Error fetching Last.fm data:", error)
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Failed to fetch Last.fm data",
        error: error.message,
      }),
    }
  }
}
