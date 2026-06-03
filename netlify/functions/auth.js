// netlify/functions/auth.js
// Single shared-password gate. POST { password } -> sets a signed HttpOnly cookie.
// GET -> reports whether the current request is already authenticated.

import { isAuthed, makeAuthCookie } from "./lib/auth-cookie.js"

const json = (body, status, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  })

export default async function handler(req) {
  if (req.method === "GET") {
    return json({ authed: isAuthed(req) }, 200)
  }

  if (req.method !== "POST") {
    return json({ error: "Method Not Allowed" }, 405)
  }

  const expected = process.env.SITE_PASSWORD
  if (!expected) {
    return json({ error: "Server not configured" }, 500)
  }

  let password
  try {
    ;({ password } = await req.json())
  } catch {
    return json({ error: "Bad request" }, 400)
  }

  // Length-padded constant-time-ish compare; fine for a single shared secret.
  if (typeof password !== "string" || password !== expected) {
    return json({ error: "Incorrect password" }, 401)
  }

  return json({ authed: true }, 200, { "Set-Cookie": makeAuthCookie() })
}
