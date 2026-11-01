// netlify/functions/spotify-auth.js
// One-time Spotify connect for the reading soundtrack.
//
//   POST /api/spotify-auth   (X-Tracker-Key)  -> { url }  Spotify authorize URL
//   GET  /api/spotify-auth?code=&state=       -> Spotify redirects here; saves
//                                               tokens, then redirects to /pages-per-day/

import { randomBytes, timingSafeEqual } from "node:crypto"
import { authorizeUrl, exchangeCode, store } from "./lib/spotify.js"
import { isAuthedForWrite } from "./lib/tracker-key.js"

const STATE_KEY = "oauth-state"
const STATE_TTL_MS = 10 * 60 * 1000

const json = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

const backToPage = (req, result) =>
  Response.redirect(
    `${new URL(req.url).origin}/pages-per-day/?spotify=${result}`,
    302,
  )

const sameString = (a, b) => {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

export default async function handler(req) {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    return json(
      { error: "SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET not configured" },
      503,
    )
  }

  if (req.method === "POST") {
    const auth = isAuthedForWrite(req)
    if (!auth.configured)
      return json({ error: "TRACKER_KEY not configured" }, 503)
    if (!auth.ok) return json({ error: "Unauthorized" }, 401)

    const state = randomBytes(16).toString("hex")
    await store().setJSON(STATE_KEY, {
      state,
      expires_at: Date.now() + STATE_TTL_MS,
    })
    return json({ url: authorizeUrl(req, state) }, 200)
  }

  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405)

  const params = new URL(req.url).searchParams
  if (params.get("error")) return backToPage(req, "denied")

  const code = params.get("code")
  const state = params.get("state") || ""
  const saved = await store().get(STATE_KEY, { type: "json" })
  if (
    !code ||
    !saved ||
    Date.now() > saved.expires_at ||
    !sameString(state, saved.state)
  ) {
    return backToPage(req, "bad-state")
  }
  await store().delete(STATE_KEY)

  try {
    await exchangeCode(req, code)
    return backToPage(req, "connected")
  } catch (err) {
    console.error("Spotify code exchange failed:", err)
    return backToPage(req, "failed")
  }
}
