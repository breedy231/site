// netlify/functions/progress.js
// Cross-device sync for the language tracker, backed by Netlify Blobs.
// Guarded by the same signed cookie that auth.js issues.
//
//   GET  /api/progress[?plan=<slug>] -> { checked, start }   (default if nothing stored yet)
//   POST /api/progress[?plan=<slug>]  { checked, start }      -> 204
//
// No `plan` param keeps the original behavior (key "progress", honeymoon
// default start) so the archived honeymoon page needs no changes.

import { getStore } from "@netlify/blobs"
import { isAuthed } from "./lib/auth-cookie.js"

const STORE_NAME = "lang-plan"

// Whitelist of known plans: query value -> { blob key, default start date }.
// `plan` omitted/absent maps to the legacy honeymoon plan for backward compat.
const PLANS = {
  default: { key: "progress", start: "2026-06-08" },
  spanish: { key: "spanish", start: "2026-11-02" },
}

const json = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

// Accept only the shape the client owns; ignore anything else that's posted.
function sanitize(input, defaultStart) {
  const out = { checked: {}, start: defaultStart }
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

  const url = new URL(req.url)
  const planParam = url.searchParams.get("plan")
  const plan = PLANS[planParam ?? "default"]
  if (!plan) return json({ error: "Unknown plan" }, 400)

  // Strong consistency so a write on one device is immediately visible on another.
  const store = getStore({ name: STORE_NAME, consistency: "strong" })
  const defaultState = { checked: {}, start: plan.start }

  if (req.method === "GET") {
    const data = await store.get(plan.key, { type: "json" })
    return json(data ?? defaultState, 200)
  }

  if (req.method === "POST") {
    let body
    try {
      body = await req.json()
    } catch {
      return json({ error: "Bad request" }, 400)
    }
    await store.setJSON(plan.key, sanitize(body, plan.start))
    return new Response(null, { status: 204 })
  }

  return json({ error: "Method Not Allowed" }, 405)
}
