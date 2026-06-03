// netlify/functions/lib/auth-cookie.js
// Shared helpers for the single-password gate: a signed, HttpOnly cookie.
//
// The cookie value is `<expiry>.<hmac>` where hmac = HMAC-SHA256(expiry, secret).
// No user data lives in the cookie — it just proves "someone knew SITE_PASSWORD
// before <expiry>". Verification recomputes the HMAC and checks it hasn't expired.

import crypto from "node:crypto"

export const COOKIE_NAME = "lang_auth"
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

function getSecret() {
  const secret = process.env.SITE_AUTH_SECRET
  if (!secret) throw new Error("SITE_AUTH_SECRET is not set")
  return secret
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex")
}

// Build the Set-Cookie header value for a freshly authenticated session.
export function makeAuthCookie() {
  const expiry = String(Date.now() + MAX_AGE_SECONDS * 1000)
  const token = `${expiry}.${sign(expiry)}`
  return (
    `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; ` +
    `Path=/; Max-Age=${MAX_AGE_SECONDS}`
  )
}

// Expire the cookie (used if we ever want a logout).
export function clearAuthCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
}

function parseCookies(req) {
  const header = req.headers.get("cookie") || ""
  const out = {}
  for (const part of header.split(";")) {
    const i = part.indexOf("=")
    if (i === -1) continue
    out[part.slice(0, i).trim()] = part.slice(i + 1).trim()
  }
  return out
}

// True if the request carries a valid, unexpired auth cookie.
export function isAuthed(req) {
  try {
    const token = parseCookies(req)[COOKIE_NAME]
    if (!token) return false
    const dot = token.lastIndexOf(".")
    if (dot === -1) return false
    const expiry = token.slice(0, dot)
    const mac = token.slice(dot + 1)
    const expected = sign(expiry)
    // Constant-time compare; lengths must match for timingSafeEqual.
    if (mac.length !== expected.length) return false
    if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected)))
      return false
    return Number(expiry) > Date.now()
  } catch {
    return false
  }
}
