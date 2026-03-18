// netlify/functions/watch-later.js
// Placeholder for YouTube Watch Later integration
// TODO: Set up YouTube OAuth flow:
//   1. Create OAuth2 credentials in Google Cloud Console
//   2. Store YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN in env
//   3. Exchange refresh token for access token
//   4. Call YouTube Data API v3: POST /youtube/v3/playlistItems
//      with playlistId = "WL" (Watch Later) and videoId from request body

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const { videoId } = await req.json()

    if (!videoId) {
      return new Response(
        JSON.stringify({ message: "videoId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    // TODO: Implement YouTube API integration once OAuth is configured
    return new Response(
      JSON.stringify({
        success: true,
        message: "YouTube OAuth not yet configured",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("Error in watch-later:", error)
    return new Response(
      JSON.stringify({ message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
