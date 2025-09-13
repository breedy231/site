// netlify/functions/history.js

// Helper function to send notification when tokens need attention
async function notifyAdminOfTokenIssue(error, context = "token_expired") {
  // Only send notifications in production to avoid spam during development
  if (process.env.NODE_ENV === "development") {
    console.log("Would notify admin:", error)
    return
  }

  try {
    console.error("ADMIN ALERT: Trakt token issue:", error)

    // Send notification via multiple channels
    await Promise.allSettled([
      // Method 1: Netlify Forms (built-in email notifications)
      sendNetlifyFormAlert(error, context),

      // Method 2: Webhook (if configured)
      sendWebhookAlert(error, context),

      // Method 3: Direct email (if configured)
      sendEmailAlert(error, context),
    ])
  } catch (err) {
    console.error("Notification error:", err)
  }
}

// Send alert via Netlify Forms (triggers email notifications)
async function sendNetlifyFormAlert(error, context) {
  if (!process.env.NETLIFY_URL) return

  try {
    const formData = new FormData()
    formData.append("form-name", "trakt-token-alert")
    formData.append("error", error)
    formData.append("context", context)
    formData.append("timestamp", new Date().toISOString())
    formData.append("action_url", `${process.env.NETLIFY_URL}/now?admin`)

    await fetch(`${process.env.NETLIFY_URL}/`, {
      method: "POST",
      body: formData,
    })

    console.log("Netlify form alert sent successfully")
  } catch (err) {
    console.error("Netlify form alert failed:", err)
  }
}

// Send alert via webhook (Slack, Discord, etc.)
async function sendWebhookAlert(error, context) {
  const webhookUrl = process.env.ADMIN_ALERT_WEBHOOK_URL
  if (!webhookUrl) return

  try {
    const message =
      context === "token_refreshed"
        ? `🔄 **Trakt Tokens Auto-Refreshed** 
        
📋 **Action Required:** Update environment variables in Netlify Dashboard
🔗 **Link:** ${process.env.NETLIFY_URL}/now?admin
📅 **Time:** ${new Date().toISOString()}

⚡ The system successfully refreshed expired tokens, but manual environment variable updates are needed to persist the new tokens.`
        : `🚨 **Trakt Token Issue**
        
❌ **Error:** ${error}
🔗 **Fix:** ${process.env.NETLIFY_URL}/now?admin
📅 **Time:** ${new Date().toISOString()}

🛠️ Please re-authenticate or check token configuration.`

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: message,
        username: "Trakt Monitor",
        icon_emoji:
          context === "token_refreshed"
            ? ":arrows_counterclockwise:"
            : ":warning:",
      }),
    })

    console.log("Webhook alert sent successfully")
  } catch (err) {
    console.error("Webhook alert failed:", err)
  }
}

// Send direct email alert (if email service configured)
async function sendEmailAlert(error, context) {
  const emailService = process.env.EMAIL_SERVICE_URL
  const emailApiKey = process.env.EMAIL_API_KEY
  const adminEmail = process.env.ADMIN_EMAIL

  if (!emailService || !emailApiKey || !adminEmail) return

  try {
    const subject =
      context === "token_refreshed"
        ? "🔄 Trakt Tokens Auto-Refreshed - Action Required"
        : "🚨 Trakt Token Issue - brendantreed.com"

    const body =
      context === "token_refreshed"
        ? `The Trakt integration successfully auto-refreshed expired tokens.

ACTION REQUIRED:
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Update the tokens logged in the function logs
3. Trigger a new deployment

Check the admin panel: ${process.env.NETLIFY_URL}/now?admin

This ensures the new tokens are persisted in your environment variables.`
        : `Trakt token issue detected: ${error}

Please visit the admin panel to re-authenticate:
${process.env.NETLIFY_URL}/now?admin`

    await fetch(emailService, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${emailApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: adminEmail,
        subject: subject,
        text: body,
      }),
    })

    console.log("Email alert sent successfully")
  } catch (err) {
    console.error("Email alert failed:", err)
  }
}

// Helper function to notify when auto-refresh succeeds
async function notifyAdminOfSuccessfulRefresh(newTokenData) {
  if (process.env.NODE_ENV === "development") {
    console.log("Would notify admin of successful refresh")
    return
  }

  const message = `Auto-refresh successful! Update environment variables:
GATSBY_TRAKT_ACCESS_TOKEN=${newTokenData.access_token}
GATSBY_TRAKT_REFRESH_TOKEN=${newTokenData.refresh_token}`

  await notifyAdminOfTokenIssue(message, "token_refreshed")
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
      }
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
    // Fetch episodes and movies history
    const [episodesRes, moviesRes] = await Promise.all([
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

    // Check for authentication errors - attempt automatic token refresh
    if (episodesRes.status === 401 || moviesRes.status === 401) {
      console.log("Token expired, attempting automatic refresh...")

      // Try to refresh the token automatically
      const refreshToken = process.env.GATSBY_TRAKT_REFRESH_TOKEN
      if (refreshToken) {
        try {
          const host = req.headers.get("host")
          const protocol = req.headers.get("x-forwarded-proto") || "https"
          const baseUrl = `${protocol}://${host}`

          const refreshResponse = await fetch(
            `${baseUrl}/.netlify/functions/refresh-token`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refresh_token: refreshToken }),
            }
          )

          if (refreshResponse.ok) {
            const newTokenData = await refreshResponse.json()
            console.log(
              "Token refresh successful, retrying request with new token..."
            )

            // Retry the original requests with the new access token
            const newHeaders = {
              ...headers,
              Authorization: `Bearer ${newTokenData.access_token}`,
            }

            const [retryEpisodesRes, retryMoviesRes] = await Promise.all([
              fetch(
                "https://api.trakt.tv/users/me/history/episodes?limit=3&extended=full",
                { headers: newHeaders }
              ),
              fetch(
                "https://api.trakt.tv/users/me/history/movies?limit=3&extended=full",
                { headers: newHeaders }
              ),
            ])

            if (retryEpisodesRes.ok && retryMoviesRes.ok) {
              console.log("Request successful with refreshed token")

              // Log that environment variables need to be updated
              console.log(
                "SUCCESS: Auto-refresh worked! ADMIN ACTION REQUIRED:"
              )
              console.log(
                `Update GATSBY_TRAKT_ACCESS_TOKEN to: ${newTokenData.access_token}`
              )
              console.log(
                `Update GATSBY_TRAKT_REFRESH_TOKEN to: ${newTokenData.refresh_token}`
              )

              // Send automated alert about successful refresh
              await notifyAdminOfSuccessfulRefresh(newTokenData)

              // Continue with the successful response
              const [episodes, movies] = await Promise.all([
                retryEpisodesRes.json(),
                retryMoviesRes.json(),
              ])

              // Process the data as normal (skip to TMDB processing section)
              let enhancedEpisodes = [...episodes]
              let enhancedMovies = [...movies]

              const TMDB_API_KEY = process.env.GATSBY_TMDB_API_KEY
              if (TMDB_API_KEY) {
                const [showImages, movieImages] = await Promise.all([
                  Promise.all(
                    episodes.map(episode =>
                      getTMDBImage("tv", episode.show?.ids?.tmdb)
                    )
                  ),
                  Promise.all(
                    movies.map(movie =>
                      getTMDBImage("movie", movie.movie?.ids?.tmdb)
                    )
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
                  _refreshed: true, // Flag to indicate token was refreshed
                }),
                {
                  status: 200,
                  headers: { "Content-Type": "application/json" },
                }
              )
            }
          }
        } catch (refreshError) {
          console.error("Automatic token refresh failed:", refreshError)
        }
      }

      // If refresh failed or no refresh token, fall back to original behavior
      await notifyAdminOfTokenIssue("Trakt access token has expired")
      return new Response(
        JSON.stringify({
          message: "Trakt access token has expired. Please re-authenticate.",
          authRequired: true,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
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

    return new Response(
      JSON.stringify({
        tv: enhancedEpisodes,
        movies: enhancedMovies,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
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
      }
    )
  }
}
