// netlify/functions/progress.js
// Cross-device sync for the language tracker, backed by Netlify Blobs.
// Guarded by the same signed cookie that auth.js issues.
//
//   GET  /api/progress -> { checked, start }   (default if nothing stored yet)
//   POST /api/progress  { checked, start }      -> 204

import { getStore } from "@netlify/blobs"
import { isAuthed } from "./lib/auth-cookie.js"

const STORE_NAME = "lang-plan"
const KEY = "progress"
const DEFAULT_STATE = { checked: {}, start: "2026-06-08" }

const json = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

// Accept only the shape the client owns; ignore anything else that's posted.
function sanitize(input) {
  const out = { checked: {}, start: DEFAULT_STATE.start }
  if (input && typeof input === "object") {
    if (typeof input.start === "string") out.start = input.start
    if (input.checked && typeof input.checked === "object") {
      for (const [id, v] of Object.entries(input.checked)) {
        if (v) out.checked[id] = 1
      }
    }
  }
  return out
}

export default async function handler(req) {
  if (!isAuthed(req)) return json({ error: "Unauthorized" }, 401)

  // Strong consistency so a write on one device is immediately visible on another.
  const store = getStore({ name: STORE_NAME, consistency: "strong" })

  if (req.method === "GET") {
    const data = await store.get(KEY, { type: "json" })
    return json(data ?? DEFAULT_STATE, 200)
  }

  if (req.method === "POST") {
    let body
    try {
      body = await req.json()
    } catch {
      return json({ error: "Bad request" }, 400)
    }
    await store.setJSON(KEY, sanitize(body))
    return new Response(null, { status: 204 })
  }

  return json({ error: "Method Not Allowed" }, 405)
}
