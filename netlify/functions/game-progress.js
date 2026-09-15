// netlify/functions/game-progress.js
// Per-game progress store for the game checklist tracker, backed by Netlify Blobs.
// Public reads, key-gated writes (X-Tracker-Key header must match TRACKER_KEY).
//
//   GET  /api/game-progress?game=<slug>              -> stored JSON, or {}
//   PUT  /api/game-progress?game=<slug>  { ... }      -> 204
//   POST /api/game-progress?game=<slug>  { ... }      -> 204 (same as PUT)

import { timingSafeEqual } from "node:crypto"
import { getStore } from "@netlify/blobs"

const STORE_NAME = "game-tracker"
const MAX_BODY_BYTES = 64 * 1024

const SLUG_RE = /^[a-z0-9-]{1,40}$/
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/
const CUSTOM_KINDS = new Set(["boss", "item", "quest", "area"])

const json = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

function isAuthedForWrite(req) {
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

// Accept only the shape the client owns; ignore anything else that's sent.
function sanitize(input) {
  const out = {
    stats: {},
    done: {},
    notes: {},
    pin: null,
    custom: {},
    closed: {},
  }
  if (!input || typeof input !== "object") return out

  if (input.stats && typeof input.stats === "object") {
    for (const [key, v] of Object.entries(input.stats)) {
      if (!ID_RE.test(key)) continue
      out.stats[key] = String(v).slice(0, 16)
    }
  }

  if (input.done && typeof input.done === "object") {
    for (const [id, v] of Object.entries(input.done)) {
      if (!ID_RE.test(id)) continue
      if (v) out.done[id] = true
    }
  }

  if (input.notes && typeof input.notes === "object") {
    for (const [id, v] of Object.entries(input.notes)) {
      if (!ID_RE.test(id)) continue
      if (typeof v !== "string" || v.length === 0) continue
      out.notes[id] = v.slice(0, 2000)
    }
  }

  if (typeof input.pin === "string") out.pin = input.pin
  else out.pin = null

  if (input.custom && typeof input.custom === "object") {
    for (const [regionId, list] of Object.entries(input.custom)) {
      if (!ID_RE.test(regionId)) continue
      if (!Array.isArray(list)) continue
      const cleaned = []
      for (const entry of list.slice(0, 100)) {
        if (!entry || typeof entry !== "object") continue
        const { id, kind, name } = entry
        if (typeof id !== "string" || !ID_RE.test(id)) continue
        if (typeof kind !== "string" || !CUSTOM_KINDS.has(kind)) continue
        if (typeof name !== "string" || name.length === 0) continue
        cleaned.push({ id, kind, name: name.slice(0, 200) })
      }
      if (cleaned.length > 0) out.custom[regionId] = cleaned
    }
  }

  if (input.closed && typeof input.closed === "object") {
    for (const [regionId, v] of Object.entries(input.closed)) {
      if (!ID_RE.test(regionId)) continue
      if (v) out.closed[regionId] = true
    }
  }

  return out
}

async function handleWrite(req, game) {
  const auth = isAuthedForWrite(req)
  if (!auth.configured) {
    return json({ error: "TRACKER_KEY not configured" }, 503)
  }
  if (!auth.ok) return json({ error: "Unauthorized" }, 401)

  const rawText = await req.text()
  if (Buffer.byteLength(rawText, "utf8") > MAX_BODY_BYTES) {
    return json({ error: "Payload too large" }, 413)
  }

  let body
  try {
    body = JSON.parse(rawText)
  } catch {
    return json({ error: "Bad request" }, 400)
  }

  const store = getStore({ name: STORE_NAME, consistency: "strong" })
  await store.setJSON(game, sanitize(body))
  return new Response(null, { status: 204 })
}

export default async function handler(req) {
  const url = new URL(req.url)
  const game = url.searchParams.get("game")
  if (!game || !SLUG_RE.test(game)) {
    return json({ error: "Bad game slug" }, 400)
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 })
  }

  if (req.method === "GET") {
    const store = getStore({ name: STORE_NAME, consistency: "strong" })
    const data = await store.get(game, { type: "json" })
    return new Response(JSON.stringify(data ?? {}), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    })
  }

  if (req.method === "PUT" || req.method === "POST") {
    return handleWrite(req, game)
  }

  return json({ error: "Method Not Allowed" }, 405)
}
