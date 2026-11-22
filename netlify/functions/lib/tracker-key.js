// netlify/functions/lib/tracker-key.js
// Shared write-auth: X-Tracker-Key header must match a secret env var
// (TRACKER_KEY by default; the game tracker passes its own, GAME_TRACKER_KEY).

import { timingSafeEqual } from "node:crypto"

export function isAuthedForWrite(req, envName = "TRACKER_KEY") {
  const expected = process.env[envName]
  if (!expected) return { ok: false, configured: false }

  const provided = req.headers.get("x-tracker-key") || ""
  const expectedBuf = Buffer.from(expected)
  const providedBuf = Buffer.from(provided)
  if (expectedBuf.length !== providedBuf.length) {
    return { ok: false, configured: true }
  }
  return { ok: timingSafeEqual(expectedBuf, providedBuf), configured: true }
}
