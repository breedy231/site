// Custom decks the player creates in-session, persisted to localStorage.
// Deck shape matches built-in decks plus a `custom: true` marker:
// { id: "custom-<timestamp>", title, emoji: "✏️", words, custom: true }
const STORAGE_KEY = "headsupCustomDecks"

export const MIN_DECK_WORDS = 5
export const MAX_TITLE_LENGTH = 40

export function loadCustomDecks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveCustomDecks(decks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks))
  } catch {
    // storage unavailable — deck just isn't persisted
  }
}

// title: string, words: array of already-trimmed, deduped word strings
export function createCustomDeck(title, words) {
  const deck = {
    id: "custom-" + Date.now(),
    title,
    emoji: "✏️",
    words,
    custom: true,
  }
  const decks = [...loadCustomDecks(), deck]
  saveCustomDecks(decks)
  return deck
}

export function deleteCustomDeck(id) {
  const decks = loadCustomDecks().filter(deck => deck.id !== id)
  saveCustomDecks(decks)
  return decks
}

// Picks a title that doesn't clash (case-insensitively) with any deck in
// `decks`: "Pub Quiz" → "Pub Quiz (2)" → "Pub Quiz (3)"…, trimming the base
// so the suffixed title still fits MAX_TITLE_LENGTH.
export function uniqueDeckTitle(title, decks) {
  const taken = new Set(decks.map(deck => deck.title.toLowerCase()))
  if (!taken.has(title.toLowerCase())) return title
  for (let n = 2; ; n++) {
    const suffix = ` (${n})`
    const base = title.slice(0, MAX_TITLE_LENGTH - suffix.length).trimEnd()
    const candidate = base + suffix
    if (!taken.has(candidate.toLowerCase())) return candidate
  }
}

// Saves a deck received via a share link. Re-opening the same link doesn't
// pile up copies: an identical deck (same title and words) is returned as-is.
export function importCustomDeck(title, words) {
  const decks = loadCustomDecks()
  const existing = decks.find(
    deck =>
      deck.title.toLowerCase() === title.toLowerCase() &&
      deck.words.length === words.length &&
      deck.words.every((word, index) => word === words[index]),
  )
  if (existing) return { deck: existing, alreadySaved: true }
  const deck = createCustomDeck(uniqueDeckTitle(title, decks), words)
  return { deck, alreadySaved: false }
}
