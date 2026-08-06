// netlify/functions/trending.js
// "Now Trending" deck: aggregates Wikipedia's daily most-viewed articles over
// the last 14 complete days into a Heads Up-friendly word list.

const USER_AGENT = "brendanreed-site/1.0"
const DAYS_TO_FETCH = 14
const START_OFFSET_DAYS = 2 // skip the last 2 days — pageview data isn't final yet
const TOP_N = 80
const MAX_TITLE_LENGTH = 40

const NAMESPACE_RE =
  /^(Special|Wikipedia|Portal|File|Help|Template|Category|Talk|User|Draft|Module|MediaWiki|Book|TimedText):/i
const DEATHS_IN_RE = /^Deaths_in_/i
const BARE_YEAR_RE = /^\d{3,4}$/
const YEAR_IN_RE = /^\d{3,4}_in_/i
const LIST_OF_RE = /^List_of_/i
const DISAMBIGUATION_RE = /\(disambiguation\)/i
const MONTH_DAY_RE =
  /^(January|February|March|April|May|June|July|August|September|October|November|December)_\d{1,2}$/i

// Wikipedia's daily top-viewed list reliably contains a handful of
// sex-related articles; keep the deck family-friendly. Most terms are
// matched as word-start prefixes (to also catch "sexual", "pornographic",
// etc.); "anal" needs a trailing boundary too, or it would flag "analysis".
const BLOCKLIST_PREFIXES = [
  "sex",
  "porn",
  "xxx",
  "penis",
  "vagina",
  "erotic",
  "incest",
  "hentai",
  "nude",
  "naked",
  "onlyfans",
  "orgasm",
  "fetish",
  "masturbat",
  "prostitut",
  "cuckold",
  "bdsm",
]
const BLOCKLIST_RE = new RegExp(
  "\\banal\\b|\\b(?:" + BLOCKLIST_PREFIXES.join("|") + ")",
  "i",
)

function pad(n) {
  return String(n).padStart(2, "0")
}

function dateParts(daysAgo) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return {
    year: d.getUTCFullYear(),
    month: pad(d.getUTCMonth() + 1),
    day: pad(d.getUTCDate()),
  }
}

async function fetchDay(daysAgo) {
  const { year, month, day } = dateParts(daysAgo)
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${year}/${month}/${day}`
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data?.items?.[0]?.articles || []
  } catch (error) {
    console.error(
      `trending: failed to fetch pageviews for ${year}-${month}-${day}`,
      error,
    )
    return []
  }
}

function isGameFriendly(rawTitle) {
  if (!rawTitle) return false
  if (rawTitle === "Main_Page") return false
  if (NAMESPACE_RE.test(rawTitle)) return false
  if (DEATHS_IN_RE.test(rawTitle)) return false
  if (BARE_YEAR_RE.test(rawTitle)) return false
  if (YEAR_IN_RE.test(rawTitle)) return false
  if (LIST_OF_RE.test(rawTitle)) return false
  if (DISAMBIGUATION_RE.test(rawTitle)) return false
  if (MONTH_DAY_RE.test(rawTitle)) return false
  return true
}

function cleanTitle(rawTitle) {
  const withoutParenthetical = rawTitle.replace(/\s*\([^)]*\)\s*$/, "")
  return withoutParenthetical.replace(/_/g, " ").trim()
}

async function buildTrendingWords() {
  const offsets = Array.from(
    { length: DAYS_TO_FETCH },
    (_, i) => START_OFFSET_DAYS + i,
  )
  const days = await Promise.all(offsets.map(fetchDay))

  const totals = new Map() // rawTitle -> aggregate views
  for (const articles of days) {
    for (const { article, views } of articles) {
      if (!isGameFriendly(article)) continue
      const cleaned = cleanTitle(article)
      if (!cleaned || cleaned.length > MAX_TITLE_LENGTH) continue
      if (BLOCKLIST_RE.test(cleaned)) continue
      totals.set(cleaned, (totals.get(cleaned) || 0) + (views || 0))
    }
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N)
    .map(([title]) => title)
}

export default async function handler(req) {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const words = await buildTrendingWords()
    return new Response(
      JSON.stringify({ updated: new Date().toISOString(), words }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control":
            "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400",
        },
      },
    )
  } catch (error) {
    console.error("Error building trending deck:", error)
    return new Response(
      JSON.stringify({ message: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
