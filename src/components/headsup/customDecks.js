// Custom decks the player creates in-session, persisted to localStorage.
// Deck shape matches built-in decks plus a `custom: true` marker:
// { id: "custom-<timestamp>", title, emoji: "✏️", words, custom: true }
const STORAGE_KEY = "headsupCustomDecks"

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
