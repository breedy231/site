// netlify/functions/lib/soundtrack.js
// Reading soundtrack: book -> description -> Claude picks instrumental albums.
// Pure helpers (slug, album matching, vocal filter) are exported for tests.

import Anthropic from "@anthropic-ai/sdk"

const UA = { "User-Agent": "brendanreed-site/1.0 (reading-soundtrack)" }
const MODEL = "claude-haiku-4-5"

// Track titles that usually mean vocals — dropped even from "instrumental" albums.
export const VOCAL_HINTS =
  /\b(feat\.?|ft\.|featuring|vocal|lyric|sung)(\b|\s|$)/i

export const slugify = s =>
  String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

/** Cache key for a book (+ optional scene) playlist. */
export const soundtrackKey = (title, chapter) =>
  [slugify(title), chapter ? slugify(chapter).slice(0, 40) : ""]
    .filter(Boolean)
    .join("--")

/** Lowercase alnum only, with (…)/[…] qualifiers like '(Original Soundtrack)' removed. */
const norm = s =>
  String(s)
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .split(/ - (?=.*(soundtrack|score|music from|remaster|edition))/i)[0]
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]/g, "")

/** Does a Spotify album search result match the model's artist + album pick? */
export function albumMatches(artist, album, item) {
  const wantArtist = norm(artist)
  const wantAlbum = norm(album)
  const gotAlbum = norm(item.name)
  if (!wantArtist || !wantAlbum || !gotAlbum) return false
  const artistOk = item.artists
    .map(a => norm(a.name))
    .some(
      a =>
        a === wantArtist ||
        (Math.min(a.length, wantArtist.length) >= 4 &&
          (a.includes(wantArtist) || wantArtist.includes(a))),
    )
  const albumOk = gotAlbum.includes(wantAlbum) || wantAlbum.includes(gotAlbum)
  return artistOk && albumOk
}

/** Keep tracks that read as instrumental and aren't tiny cues (<60s). */
export function filterTracks(tracks, perAlbum) {
  const clean = tracks.filter(t => !VOCAL_HINTS.test(t.name))
  const long = clean.filter(t => t.duration_ms >= 60_000)
  return (long.length ? long : clean).slice(0, perAlbum)
}

const SECTION_CUT =
  /\n==+ ?(Reception|Critical reception|Awards|Accolades|References|See also|External links|Notes)/

/**
 * Plain-text description of the book so the model isn't guessing from the title.
 * Wikipedia first (best plot/setting detail, keyless), Open Library subjects as fallback.
 */
export async function bookInfo(title, author) {
  try {
    const q = `${title} ${author || ""} novel`.trim()
    const search = await fetch(
      "https://en.wikipedia.org/w/api.php?" +
        new URLSearchParams({
          action: "query",
          list: "search",
          srsearch: q,
          srlimit: "3",
          format: "json",
        }),
      { headers: UA },
    ).then(r => r.json())
    const hit = search?.query?.search?.find(h =>
      slugify(h.title).includes(slugify(title)),
    )
    if (hit) {
      const pages = await fetch(
        "https://en.wikipedia.org/w/api.php?" +
          new URLSearchParams({
            action: "query",
            prop: "extracts",
            explaintext: "1",
            titles: hit.title,
            redirects: "1",
            format: "json",
          }),
        { headers: UA },
      ).then(r => r.json())
      const text = Object.values(pages?.query?.pages || {})[0]?.extract || ""
      const body = text.split(SECTION_CUT)[0].trim()
      if (body) return `(from Wikipedia: ${hit.title})\n${body.slice(0, 2500)}`
    }
  } catch (err) {
    console.error("Wikipedia lookup failed:", err)
  }

  try {
    const params = {
      title,
      fields: "title,subject,first_publish_year",
      limit: "1",
    }
    if (author) params.author = author
    const ol = await fetch(
      "https://openlibrary.org/search.json?" + new URLSearchParams(params),
      { headers: UA },
    ).then(r => r.json())
    const d = ol?.docs?.[0]
    if (d?.subject?.length) {
      return `(from Open Library) ${d.title} (${d.first_publish_year}). Subjects: ${d.subject.slice(0, 25).join(", ")}`
    }
  } catch (err) {
    console.error("Open Library lookup failed:", err)
  }
  return null
}

const SYSTEM = `You are a music supervisor choosing background music for someone READING a book.
Hard rules:
- Instrumental ONLY. No lyrics, no sung text, no choral works with words. Wordless drones are fine.
- Real, commercially released albums that are on Spotify (film/TV/game scores, ambient, modern classical, post-rock without vocals). Use exact artist and album names as Spotify lists them.
- Never pick generic "music for reading/study/sleep" filler artists.
- Music must stay in the background: avoid loud action cues and heavy beats.
- Base picks on the book description, not the title alone. Match its setting, era, mood and themes.
- Order picks from quieter/establishing to most intense.`

const PICKS_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "One sentence on the book's atmosphere",
    },
    mood_tags: { type: "array", items: { type: "string" } },
    picks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          artist: { type: "string" },
          album: { type: "string" },
          why: { type: "string" },
        },
        required: ["artist", "album", "why"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "mood_tags", "picks"],
  additionalProperties: false,
}

/** Ask Claude for ~n instrumental album picks. Returns {summary, mood_tags, picks}. */
export async function pickAlbums({ title, author, chapter, about, n = 10 }) {
  const client = new Anthropic({ timeout: 25_000, maxRetries: 1 })
  const lines = [`Book: ${title}${author ? ` by ${author}` : ""}`]
  lines.push(
    about
      ? `About the book:\n${about}`
      : "(No description found. Say so in the summary.)",
  )
  if (chapter) lines.push(`Current chapter/scene: ${chapter}`)
  lines.push(`Give ${n} picks, plus 5-8 short mood tags.`)

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: "user", content: lines.join("\n\n") }],
    output_config: { format: { type: "json_schema", schema: PICKS_SCHEMA } },
  })

  if (response.stop_reason === "refusal") {
    throw new Error("Claude declined to pick albums for this book")
  }
  const text = response.content.find(b => b.type === "text")?.text
  if (!text) throw new Error("Claude returned no picks")
  const data = JSON.parse(text)
  data.picks = data.picks.slice(0, 15)
  return data
}
