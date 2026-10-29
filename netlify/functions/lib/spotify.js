// netlify/functions/lib/spotify.js
// Spotify Web API client for the reading soundtrack. Tokens live in Netlify Blobs
// (store "reading-soundtrack", key "spotify-tokens") and refresh automatically.
//
// Feb 2026 dev-mode API: search limit max 10, playlists created via
// POST /me/playlists, items via /playlists/{id}/items.

import { getStore } from "@netlify/blobs"
import { albumMatches, filterTracks } from "./soundtrack.js"

export const STORE_NAME = "reading-soundtrack"
const TOKEN_KEY = "spotify-tokens"
const API = "https://api.spotify.com/v1"
const SCOPES =
  "playlist-read-private playlist-modify-private playlist-modify-public"

export const store = () => getStore(STORE_NAME, { consistency: "strong" })

/** Redirect URI registered on the Spotify app. Override for branch deploys / dev. */
export function redirectUri(req) {
  if (process.env.SPOTIFY_REDIRECT_URI) return process.env.SPOTIFY_REDIRECT_URI
  const url = new URL(req.url)
  return `${url.origin}/api/spotify-auth`
}

export function authorizeUrl(req, state) {
  return (
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      client_id: process.env.SPOTIFY_CLIENT_ID,
      response_type: "code",
      redirect_uri: redirectUri(req),
      scope: SCOPES,
      state,
    })
  )
}

async function tokenRequest(params) {
  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64")
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  })
  if (!res.ok) {
    throw new Error(
      `Spotify token request failed (${res.status}): ${await res.text()}`,
    )
  }
  return res.json()
}

async function saveTokens(data, previousRefresh) {
  const tokens = {
    access_token: data.access_token,
    // Spotify doesn't always rotate the refresh token; keep the old one if absent.
    refresh_token: data.refresh_token || previousRefresh,
    expires_at: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000,
    saved_at: new Date().toISOString(),
  }
  await store().setJSON(TOKEN_KEY, tokens)
  return tokens
}

export async function exchangeCode(req, code) {
  const data = await tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(req),
  })
  return saveTokens(data)
}

/** Current access token, refreshing if needed. Null when Spotify was never connected. */
export async function accessToken({ force = false } = {}) {
  const tokens = await store().get(TOKEN_KEY, { type: "json" })
  if (!tokens?.refresh_token) return null
  if (!force && Date.now() < tokens.expires_at) return tokens.access_token
  const data = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: tokens.refresh_token,
  })
  return (await saveTokens(data, tokens.refresh_token)).access_token
}

export class Spotify {
  constructor(token) {
    this.token = token
  }

  async call(method, path, body, retried = false, attempt = 0) {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (res.status === 401 && !retried) {
      this.token = await accessToken({ force: true })
      return this.call(method, path, body, true, attempt)
    }
    if (res.status === 429 && attempt < 2) {
      const wait = Math.min(Number(res.headers.get("retry-after")) || 1, 3)
      await new Promise(r => setTimeout(r, wait * 1000))
      return this.call(method, path, body, retried, attempt + 1)
    }
    if (!res.ok) {
      throw new Error(
        `Spotify ${method} ${path.split("?")[0]} failed (${res.status}): ${await res.text()}`,
      )
    }
    const text = await res.text()
    return text ? JSON.parse(text) : {}
  }

  get(path, params) {
    return this.call(
      "GET",
      params ? `${path}?${new URLSearchParams(params)}` : path,
    )
  }

  async findAlbum(artist, album) {
    for (const q of [
      `album:"${album}" artist:"${artist}"`,
      `${album} ${artist}`,
    ]) {
      const data = await this.get("/search", { q, type: "album", limit: "10" })
      const hit = (data.albums?.items || []).find(
        it => it && albumMatches(artist, album, it),
      )
      if (hit) return hit
    }
    return null
  }

  /** Resolve picks to track URIs. Albums are looked up in parallel. */
  async buildTracklist(picks, perAlbum = 6) {
    const results = await Promise.all(
      picks.map(async p => {
        try {
          const album = await this.findAlbum(p.artist, p.album)
          if (!album) return { ...p, found: false, tracks: [] }
          const data = await this.get(`/albums/${album.id}/tracks`, {
            limit: "50",
          })
          const tracks = filterTracks(data.items || [], perAlbum)
          return {
            ...p,
            found: true,
            matched: `${album.artists[0]?.name} — ${album.name}`,
            image: album.images?.[album.images.length > 1 ? 1 : 0]?.url ?? null,
            tracks,
          }
        } catch (err) {
          console.error(`Lookup failed for ${p.artist} — ${p.album}:`, err)
          return { ...p, found: false, tracks: [] }
        }
      }),
    )
    const allTracks = results.flatMap(r => r.tracks)
    return {
      uris: allTracks.map(t => t.uri),
      durationMs: allTracks.reduce((sum, t) => sum + t.duration_ms, 0),
      albums: results.map(({ tracks, ...rest }) => ({
        ...rest,
        trackCount: tracks.length,
      })),
    }
  }

  /** Create the named private playlist, or replace its tracks if it exists. */
  async upsertPlaylist(name, description, uris) {
    let id = null
    for (let offset = 0; !id; offset += 50) {
      const page = await this.get("/me/playlists", {
        limit: "50",
        offset: String(offset),
      })
      id = page.items?.find(p => p?.name === name)?.id ?? null
      if (!page.next) break
    }
    const desc = description.slice(0, 300)
    if (id) {
      await this.call("PUT", `/playlists/${id}`, { description: desc })
    } else {
      id = (
        await this.call("POST", "/me/playlists", {
          name,
          description: desc,
          public: false,
        })
      ).id
    }
    // PUT replaces the first 100; POST appends the rest.
    await this.call("PUT", `/playlists/${id}/items`, {
      uris: uris.slice(0, 100),
    })
    for (let i = 100; i < uris.length; i += 100) {
      await this.call("POST", `/playlists/${id}/items`, {
        uris: uris.slice(i, i + 100),
      })
    }
    return { id, url: `https://open.spotify.com/playlist/${id}` }
  }
}
