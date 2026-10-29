// netlify/functions/lib/tracker-key.js
// Shared write-auth: X-Tracker-Key header must match the TRACKER_KEY env var.

import { timingSafeEqual } from "node:crypto"

export function isAuthedForWrite(req) {
  const expected = process.env.TRACKER_KEY
  if (!expected) return { ok: false, configured: false }

  const provided = req.headers.get("x-tracker-key") || ""
  const expectedBuf = Buffer.from(expected)
  const providedBuf = Buffer.from(provided)
  if (expectedBuf.length !== providedBuf.length) {
    return { ok: false, configured: true }
  }
  return { ok: timingSafeEqual(expectedBuf, providedBuf), configured: true }
}
