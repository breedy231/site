// netlify/functions/lib/trakt-tokens.js
// Shared module for Trakt OAuth token storage and refresh via Netlify Blobs

import { getStore } from "@netlify/blobs"

const STORE_NAME = "trakt-auth"
const TOKEN_KEY = "tokens"

function getTokenStore() {
  return getStore(STORE_NAME, { consistency: "strong" })
}

/**
 * Retrieve current tokens.
 * Tries Blobs first, falls back to env vars and seeds Blobs on first use.
 */
export async function getTokens() {
  const store = getTokenStore()

  const stored = await store.get(TOKEN_KEY, { type: "json" })
  if (stored && stored.access_token) {
    return stored
  }

  // Fall back to env vars (initial seed)
  const accessToken = process.env.GATSBY_TRAKT_ACCESS_TOKEN
  const refreshToken = process.env.GATSBY_TRAKT_REFRESH_TOKEN

  if (accessToken && refreshToken) {
    const tokens = {
      access_token: accessToken,
      refresh_token: refreshToken,
      seeded_from_env: true,
      created_at: Math.floor(Date.now() / 1000),
    }
    await store.setJSON(TOKEN_KEY, tokens)
    return tokens
  }

  return null
}

/**
 * Refresh tokens using the refresh_token grant.
 * Persists new tokens to Blobs immediately (critical — old refresh token is invalidated).
 */
export async function refreshTokens(currentRefreshToken) {
  const response = await fetch("https://api.trakt.tv/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      refresh_token: currentRefreshToken,
      client_id: process.env.GATSBY_TRAKT_CLIENT_ID,
      client_secret: process.env.GATSBY_TRAKT_CLIENT_SECRET,
      redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
      grant_type: "refresh_token",
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token refresh failed (${response.status}): ${error}`)
  }

  const data = await response.json()
  const tokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    created_at: data.created_at,
    refreshed_at: new Date().toISOString(),
  }

  const store = getTokenStore()
  await store.setJSON(TOKEN_KEY, tokens)

  return tokens
}

/**
 * Save tokens to Blobs (used after OAuth code exchange).
 */
export async function saveTokens(tokenData) {
  const store = getTokenStore()
  await store.setJSON(TOKEN_KEY, {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_in: tokenData.expires_in,
    created_at: tokenData.created_at,
    saved_at: new Date().toISOString(),
  })
}
