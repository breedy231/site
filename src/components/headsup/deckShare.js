// Share a custom deck between phones with no backend: the deck rides in the
// URL fragment (#deck=…), which browsers never send to the server.
//
// Payload format: "<version><codec>.<data>", e.g. "1z.q1ZKLc…"
//   version — integer, bumped on any incompatible format change
//   codec   — "z": deflate-raw compressed (CompressionStream)
//             "j": plain, for browsers without CompressionStream or when
//                  compression doesn't shrink a tiny deck
//   data    — base64url of UTF-8 JSON {"t": title, "w": [words]}
import { MAX_TITLE_LENGTH, MIN_DECK_WORDS } from "./customDecks"

export const SHARE_VERSION = 1
export const MAX_SHARE_WORDS = 500
// Caps on untrusted input: the payload in the URL, and the JSON it inflates
// to (so a short link can't expand into megabytes).
export const MAX_PAYLOAD_CHARS = 16384
export const MAX_JSON_BYTES = 65536

const PAYLOAD_PATTERN = /^([1-9]\d*)([a-z])\.([A-Za-z0-9_-]+)$/

// code: "malformed" | "version" (shared from a newer format) |
//       "unsupported" (browser can't decompress) | "too-large"
export class DeckShareError extends Error {
  constructor(code, message) {
    super(message)
    this.name = "DeckShareError"
    this.code = code
  }
}

const malformed = message => new DeckShareError("malformed", message)

// Trims, drops empties, dedupes case-insensitively (same rules as the create
// screen) and enforces the limits both ends of a share agree on.
function normalizeSharedDeck(title, words) {
  if (typeof title !== "string") throw malformed("Deck title is missing")
  const cleanTitle = title.trim()
  if (!cleanTitle || cleanTitle.length > MAX_TITLE_LENGTH) {
    throw malformed("Deck title is empty or too long")
  }
  if (!Array.isArray(words)) throw malformed("Deck words are missing")
  const seen = new Set()
  const cleanWords = []
  for (const word of words) {
    if (typeof word !== "string") throw malformed("Deck words must be text")
    const clean = word.trim()
    const key = clean.toLowerCase()
    if (!clean || seen.has(key)) continue
    seen.add(key)
    cleanWords.push(clean)
  }
  if (cleanWords.length < MIN_DECK_WORDS) {
    throw malformed(`A deck needs at least ${MIN_DECK_WORDS} words`)
  }
  if (cleanWords.length > MAX_SHARE_WORDS) {
    throw new DeckShareError(
      "too-large",
      `A shared deck can have at most ${MAX_SHARE_WORDS} words`,
    )
  }
  return { title: cleanTitle, words: cleanWords }
}

function toBase64Url(bytes) {
  let binary = ""
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(text) {
  if (text.length % 4 === 1) throw malformed("Share link is truncated")
  const base64 =
    text.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((text.length + 3) % 4)
  let binary
  try {
    binary = atob(base64)
  } catch {
    throw malformed("Share link is not valid base64")
  }
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

// Resolves to null when the browser can't compress, so the caller falls
// back to plain JSON.
async function compress(bytes) {
  if (typeof CompressionStream === "undefined") return null
  try {
    const stream = new Blob([bytes])
      .stream()
      .pipeThrough(new CompressionStream("deflate-raw"))
    return new Uint8Array(await new Response(stream).arrayBuffer())
  } catch {
    return null
  }
}

async function decompress(bytes) {
  let stream
  try {
    stream = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream("deflate-raw"))
  } catch {
    throw new DeckShareError(
      "unsupported",
      "This browser can't open compressed deck links",
    )
  }
  const reader = stream.getReader()
  const chunks = []
  let total = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.length
      if (total > MAX_JSON_BYTES) {
        reader.cancel().catch(() => {})
        throw new DeckShareError("too-large", "Shared deck is too large")
      }
      chunks.push(value)
    }
  } catch (err) {
    if (err instanceof DeckShareError) throw err
    throw malformed("Share link is corrupted")
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

// deck: { title, words } → payload string for the #deck= fragment.
export async function encodeDeck(deck) {
  const { title, words } = normalizeSharedDeck(deck.title, deck.words)
  const json = new TextEncoder().encode(JSON.stringify({ t: title, w: words }))
  let payload = `${SHARE_VERSION}j.${toBase64Url(json)}`
  const compressed = await compress(json)
  if (compressed) {
    const zipped = `${SHARE_VERSION}z.${toBase64Url(compressed)}`
    if (zipped.length < payload.length) payload = zipped
  }
  if (payload.length > MAX_PAYLOAD_CHARS) {
    throw new DeckShareError("too-large", "Deck is too large to share")
  }
  return payload
}

// payload string → { title, words }. Rejects with a DeckShareError.
export async function decodeDeck(payload) {
  if (typeof payload !== "string" || !payload) {
    throw malformed("Share link is empty")
  }
  if (payload.length > MAX_PAYLOAD_CHARS) {
    throw new DeckShareError("too-large", "Share link is too long")
  }
  const match = PAYLOAD_PATTERN.exec(payload)
  if (!match) throw malformed("Share link is not a Heads Up deck")
  const [, versionText, codec, data] = match
  if (Number(versionText) > SHARE_VERSION) {
    throw new DeckShareError(
      "version",
      "Deck was shared from a newer version of the game",
    )
  }
  if (Number(versionText) !== SHARE_VERSION || !"zj".includes(codec)) {
    throw malformed("Share link format is not recognized")
  }

  const bytes = fromBase64Url(data)
  if (codec === "z" && typeof DecompressionStream === "undefined") {
    throw new DeckShareError(
      "unsupported",
      "This browser can't open compressed deck links",
    )
  }
  const jsonBytes = codec === "z" ? await decompress(bytes) : bytes
  let parsed
  try {
    parsed = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(jsonBytes),
    )
  } catch {
    throw malformed("Share link is corrupted")
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw malformed("Share link is not a Heads Up deck")
  }
  return normalizeSharedDeck(parsed.t, parsed.w)
}

// location.hash → the #deck= payload, or null when the URL isn't a share.
export function readSharePayload(hash) {
  if (!hash) return null
  return new URLSearchParams(hash.replace(/^#/, "")).get("deck")
}

// location: anything with origin + pathname (window.location, a URL).
export function buildShareUrl(payload, location) {
  return `${location.origin}${location.pathname}#deck=${payload}`
}
