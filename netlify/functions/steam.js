// netlify/functions/steam.js
// Read-only Steam bridge for the game checklist tracker.
// Returns unlocked achievements + playtime for one appid, cached in Netlify
// Blobs for 10 minutes so the tracker can poll cheaply.
//
//   GET /api/steam?appid=1245620            -> cached-or-fresh payload
//   GET /api/steam?appid=1245620&refresh=1  -> bypass the cache
//
// Needs STEAM_API_KEY and STEAM_ID. Private profiles are not an error: the
// payload comes back with empty achievements and a `warning` string.

import { getStore } from "@netlify/blobs"

const STORE_NAME = "game-tracker"
const CACHE_TTL_MS = 10 * 60 * 1000
const TIMEOUT_MS = 8000
const APPID_RE = /^\d{1,10}$/

const json = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  })

async function getJson(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "User-Agent": "brendanreed-site/1.0" },
  })
  return {
    status: res.status,
    ok: res.ok,
    body: res.ok ? await res.json() : null,
  }
}

// Unlocked achievements only, keyed by apiname -> unlock timestamp.
async function fetchAchievements(key, steamId, appid, warnings) {
  const url =
    "https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/" +
    `?key=${key}&steamid=${steamId}&appid=${appid}`
  const { status, ok, body } = await getJson(url)

  // Steam answers 403 when the profile (or its game details) are private.
  if (status === 403 || status === 401) {
    warnings.push("Steam profile game details are private")
    return {}
  }
  if (!ok) throw new Error(`GetPlayerAchievements HTTP ${status}`)

  const stats = body?.playerstats
  if (!stats || stats.success === false) {
    warnings.push(stats?.error || "Steam returned no achievement data")
    return {}
  }

  const out = {}
  for (const entry of stats.achievements || []) {
    if (entry?.achieved === 1 && entry.apiname) {
      out[entry.apiname] = entry.unlocktime ?? 0
    }
  }
  return out
}

async function fetchPlaytime(key, steamId, appid, warnings) {
  const result = {
    playtime2w: null,
    playtimeForever: null,
    lastPlayed: null,
  }

  const recentUrl =
    "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/" +
    `?key=${key}&steamid=${steamId}`
  const recent = await getJson(recentUrl)
  if (!recent.ok)
    throw new Error(`GetRecentlyPlayedGames HTTP ${recent.status}`)

  const wanted = Number(appid)
  const recentGame = (recent.body?.response?.games || []).find(
    g => g.appid === wanted,
  )
  if (recentGame) {
    result.playtime2w = recentGame.playtime_2weeks ?? null
    result.playtimeForever = recentGame.playtime_forever ?? null
    result.lastPlayed = recentGame.rtime_last_played ?? null
  }

  // Recently-played never carries rtime_last_played, so fall back to the
  // owned-games list for it (and for total playtime on older games).
  if (result.lastPlayed == null || result.playtimeForever == null) {
    const ownedUrl =
      "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/" +
      `?key=${key}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1`
    const owned = await getJson(ownedUrl)
    if (!owned.ok) throw new Error(`GetOwnedGames HTTP ${owned.status}`)

    const response = owned.body?.response
    if (!response || Object.keys(response).length === 0) {
      warnings.push("Steam profile game details are private")
    } else {
      const ownedGame = (response.games || []).find(g => g.appid === wanted)
      if (ownedGame) {
        if (result.playtimeForever == null) {
          result.playtimeForever = ownedGame.playtime_forever ?? null
        }
        if (result.lastPlayed == null) {
          result.lastPlayed = ownedGame.rtime_last_played ?? null
        }
      }
    }
  }

  if (result.lastPlayed === 0) result.lastPlayed = null
  return result
}

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 })
  if (req.method !== "GET") return json({ error: "Method Not Allowed" }, 405)

  const url = new URL(req.url)
  const appid = url.searchParams.get("appid")
  if (!appid || !APPID_RE.test(appid)) {
    return json({ error: "Bad appid" }, 400)
  }

  const key = process.env.STEAM_API_KEY
  const steamId = process.env.STEAM_ID
  if (!key || !steamId) {
    return json({ error: "Steam not configured" }, 503)
  }

  const store = getStore({ name: STORE_NAME, consistency: "strong" })
  const cacheKey = `steam:${appid}`

  let cached = null
  try {
    cached = await store.get(cacheKey, { type: "json" })
  } catch {
    // A cache read failure should never block a live fetch.
  }

  const refresh = url.searchParams.get("refresh") === "1"
  if (
    !refresh &&
    cached?.fetchedAt &&
    Date.now() - cached.fetchedAt < CACHE_TTL_MS
  ) {
    return json(cached, 200)
  }

  try {
    const warnings = []
    const [achievements, playtime] = await Promise.all([
      fetchAchievements(key, steamId, appid, warnings),
      fetchPlaytime(key, steamId, appid, warnings),
    ])

    const payload = {
      achievements,
      playtime2w: playtime.playtime2w,
      playtimeForever: playtime.playtimeForever,
      lastPlayed: playtime.lastPlayed,
      fetchedAt: Date.now(),
    }
    if (warnings.length > 0) payload.warning = [...new Set(warnings)].join("; ")

    try {
      await store.setJSON(cacheKey, payload)
    } catch {
      // Serving the fresh payload matters more than persisting it.
    }
    return json(payload, 200)
  } catch (err) {
    // Upstream is down or slow: stale data beats no data.
    if (cached) return json({ ...cached, stale: true }, 200)
    return json({ error: `Steam request failed: ${err.message}` }, 502)
  }
}
