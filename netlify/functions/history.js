// netlify/functions/history.js
// Trakt watch history with automatic token refresh via Netlify Blobs

import { getTokens, refreshTokens } from "./lib/trakt-tokens.js"

const TMDB_API_KEY = process.env.GATSBY_TMDB_API_KEY

function traktHeaders(accessToken) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "trakt-api-version": "2",
    "trakt-api-key": process.env.GATSBY_TRAKT_CLIENT_ID,
  }
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

async function fetchHistory(accessToken) {
  const headers = traktHeaders(accessToken)

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

  if (episodesRes.status === 401 || moviesRes.status === 401) {
    return { authFailed: true }
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

  return { authFailed: false, episodes, movies }
}

async function enrichWithPosters(episodes, movies) {
  if (!TMDB_API_KEY) return { episodes, movies }

  const [showImages, movieImages] = await Promise.all([
    Promise.all(episodes.map(ep => getTMDBImage("tv", ep.show?.ids?.tmdb))),
    Promise.all(movies.map(mv => getTMDBImage("movie", mv.movie?.ids?.tmdb))),
  ])

  return {
    episodes: episodes.map((ep, i) => ({ ...ep, image: showImages[i] })),
    movies: movies.map((mv, i) => ({ ...mv, image: movieImages[i] })),
  }
}

export default async function handler(req) {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  const tokens = await getTokens()

  if (!tokens) {
    return new Response(
      JSON.stringify({
        message: "No Trakt tokens configured",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  // Admin-only: skip initial fetch and go straight to refresh to test the flow
  const url = new URL(req.url)
  const forceRefresh = url.searchParams.get("force-refresh") === "true"

  try {
    let result

    if (forceRefresh) {
      console.log("force-refresh: skipping initial fetch, refreshing tokens")
      result = { authFailed: true }
    } else {
      result = await fetchHistory(tokens.access_token)
    }

    // Auto-refresh on 401 and retry once
    if (result.authFailed) {
      console.log("Trakt token expired or force-refresh — attempting refresh")
      try {
        const newTokens = await refreshTokens(tokens.refresh_token)
        console.log("Token refresh succeeded, retrying fetch")
        result = await fetchHistory(newTokens.access_token)

        if (result.authFailed) {
          return new Response(
            JSON.stringify({
              message:
                "Auth still failing after token refresh. Manual re-auth required.",
              authRequired: true,
            }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            },
          )
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError)
        return new Response(
          JSON.stringify({
            message: `Token refresh failed: ${refreshError.message}. Manual re-auth required.`,
            authRequired: true,
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        )
      }
    }

    const enriched = await enrichWithPosters(result.episodes, result.movies)

    return new Response(
      JSON.stringify({
        tv: enriched.episodes,
        movies: enriched.movies,
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
