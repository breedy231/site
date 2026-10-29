// netlify/functions/reading-soundtrack.js
// Lyrics-free Spotify playlist that matches the book I'm reading.
// Public reads, key-gated writes (X-Tracker-Key). Generation is split into two
// calls so each stays well inside the sync function timeout:
//
//   GET  /api/reading-soundtrack?title=&chapter=  -> { result | null, spotifyConnected }
//        (title optional: without it, just reports whether Spotify is connected)
//   POST /api/reading-soundtrack?step=picks  { title, author?, chapter? }
//        -> { summary, mood_tags, picks, about }       (Wikipedia + Claude)
//   POST /api/reading-soundtrack?step=build  { title, author?, chapter?, picks, summary? }
//        -> result (playlist url, albums found/missing) (Spotify), cached in Blobs

import { accessToken, Spotify, store } from "./lib/spotify.js"
import { bookInfo, pickAlbums, soundtrackKey } from "./lib/soundtrack.js"
import { isAuthedForWrite } from "./lib/tracker-key.js"

const MAX_BODY_BYTES = 32 * 1024
const RESULT_PREFIX = "result:"

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })

const str = (v, max) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null

function sanitizePicks(picks) {
  if (!Array.isArray(picks)) return []
  return picks
    .filter(p => p && typeof p === "object")
    .map(p => ({
      artist: str(p.artist, 120),
      album: str(p.album, 200),
      why: str(p.why, 300) || "",
    }))
    .filter(p => p.artist && p.album)
    .slice(0, 15)
}

async function readBody(req) {
  const raw = await req.text()
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES)
    throw new Error("too large")
  return JSON.parse(raw)
}

async function handlePicks(book) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: "ANTHROPIC_API_KEY not configured" }, 503)
  }
  const about = await bookInfo(book.title, book.author)
  const data = await pickAlbums({ ...book, about })
  return json({
    ...data,
    picks: sanitizePicks(data.picks),
    about: about?.slice(0, 300) ?? null,
  })
}

async function handleBuild(book, body) {
  const picks = sanitizePicks(body.picks)
  if (!picks.length) return json({ error: "No picks" }, 400)

  const token = await accessToken()
  if (!token) return json({ error: "spotify_not_connected" }, 409)

  const spotify = new Spotify(token)
  const { uris, durationMs, albums } = await spotify.buildTracklist(picks)
  if (!uris.length) {
    return json(
      { error: "None of the picked albums were found on Spotify", albums },
      422,
    )
  }

  const name =
    `Reading: ${book.title}` +
    (book.chapter ? ` (${book.chapter.slice(0, 40)})` : "")
  const summary = str(body.summary, 250) || ""
  const playlist = await spotify.upsertPlaylist(
    name,
    `Lyrics-free reading soundtrack. ${summary}`,
    uris,
  )

  const result = {
    ...book,
    name,
    summary,
    mood_tags: Array.isArray(body.mood_tags)
      ? body.mood_tags
          .filter(t => typeof t === "string")
          .slice(0, 8)
          .map(t => t.slice(0, 30))
      : [],
    playlistUrl: playlist.url,
    trackCount: uris.length,
    durationMin: Math.round(durationMs / 60_000),
    albums,
    builtAt: new Date().toISOString(),
  }
  await store().setJSON(
    RESULT_PREFIX + soundtrackKey(book.title, book.chapter),
    result,
  )
  return json(result)
}

export default async function handler(req) {
  const url = new URL(req.url)

  if (req.method === "GET") {
    const title = str(url.searchParams.get("title"), 200)
    const chapter = str(url.searchParams.get("chapter"), 120)
    const [result, tokens] = await Promise.all([
      title
        ? store().get(RESULT_PREFIX + soundtrackKey(title, chapter), {
            type: "json",
          })
        : null,
      store().getMetadata("spotify-tokens"),
    ])
    return json({ result: result ?? null, spotifyConnected: Boolean(tokens) })
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)

  const auth = isAuthedForWrite(req)
  if (!auth.configured)
    return json({ error: "TRACKER_KEY not configured" }, 503)
  if (!auth.ok) return json({ error: "Unauthorized" }, 401)

  let body
  try {
    body = await readBody(req)
  } catch {
    return json({ error: "Bad request" }, 400)
  }
  const book = {
    title: str(body.title, 200),
    author: str(body.author, 120),
    chapter: str(body.chapter, 120),
  }
  if (!book.title) return json({ error: "title required" }, 400)

  try {
    const step = url.searchParams.get("step")
    if (step === "picks") return await handlePicks(book)
    if (step === "build") return await handleBuild(book, body)
    return json({ error: "step must be picks or build" }, 400)
  } catch (err) {
    console.error("reading-soundtrack failed:", err)
    return json({ error: err.message || "Failed" }, 502)
  }
}
