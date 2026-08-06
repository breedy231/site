// Tracks which "Now Trending" words a player has already seen, so repeat
// plays surface fresher words. Stored as { word: lastSeenTimestamp } under
// one localStorage key; entries older than 30 days are dropped on load.
const STORAGE_KEY = "headsupTrendingSeen"
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export function loadSeenWords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}
    const parsed = JSON.parse(stored)
    if (!parsed || typeof parsed !== "object") return {}
    const now = Date.now()
    const fresh = {}
    for (const [word, seenAt] of Object.entries(parsed)) {
      if (typeof seenAt === "number" && now - seenAt < MAX_AGE_MS) {
        fresh[word] = seenAt
      }
    }
    return fresh
  } catch {
    return {}
  }
}

export function recordSeenWords(words) {
  if (!words || words.length === 0) return
  try {
    const seen = loadSeenWords()
    const now = Date.now()
    words.forEach(word => {
      if (word) seen[word] = now
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen))
  } catch {
    // storage unavailable — seen list just isn't persisted
  }
}

export function clearSeenWords() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
