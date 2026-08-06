import { useEffect, useState } from "react"
import {
  loadCustomDecks,
  createCustomDeck,
  deleteCustomDeck,
} from "./customDecks"
import { loadSeenWords, clearSeenWords } from "./trendingSeen"
import CreateDeckScreen from "./CreateDeckScreen"

const MIN_TRENDING_WORDS = 10

const CategoryPicker = ({ decks, onSelect }) => {
  const [customDecks, setCustomDecks] = useState([])
  const [creating, setCreating] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [trendingLoading, setTrendingLoading] = useState(false)
  const [trendingError, setTrendingError] = useState(null)

  useEffect(() => {
    setCustomDecks(loadCustomDecks())
  }, [])

  const handleSaveDeck = (title, words) => {
    createCustomDeck(title, words)
    setCustomDecks(loadCustomDecks())
    setCreating(false)
  }

  const handleDeleteDeck = id => {
    setCustomDecks(deleteCustomDeck(id))
    setConfirmDeleteId(null)
  }

  const handleTrendingSelect = async () => {
    if (trendingLoading) return
    setTrendingLoading(true)
    setTrendingError(null)
    try {
      const res = await fetch("/.netlify/functions/trending")
      if (!res.ok) throw new Error("Request failed")
      const data = await res.json()
      const fetched = Array.isArray(data.words) ? data.words : []
      const seen = loadSeenWords()
      let words = fetched.filter(word => !seen[word])
      if (words.length < MIN_TRENDING_WORDS) {
        clearSeenWords()
        words = fetched
      }
      setTrendingLoading(false)
      onSelect({ id: "trending", title: "Now Trending", emoji: "🔥", words })
    } catch {
      setTrendingLoading(false)
      setTrendingError("Couldn't load — try again")
    }
  }

  if (creating) {
    return (
      <CreateDeckScreen
        onSave={handleSaveDeck}
        onCancel={() => setCreating(false)}
      />
    )
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <div className="mx-auto w-full max-w-md space-y-4 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Heads Up!
        </h1>
        <h2 className="text-xl text-gray-600 dark:text-gray-300">
          Choose a deck
        </h2>
        <div className="grid gap-4">
          <button
            onClick={handleTrendingSelect}
            disabled={trendingLoading}
            className="flex w-full transform items-center justify-between rounded-lg bg-orange-500 p-4 text-xl text-white shadow transition-colors hover:scale-105 hover:bg-orange-600 disabled:cursor-wait disabled:opacity-80"
          >
            <span>🔥 Now Trending</span>
            <span className="text-sm opacity-75">
              {trendingLoading
                ? "Loading…"
                : trendingError
                  ? trendingError
                  : "last 2 weeks"}
            </span>
          </button>

          {decks.map(deck => (
            <button
              key={deck.id}
              onClick={() => onSelect(deck)}
              className="flex w-full transform items-center justify-between rounded-lg bg-blue-500 p-4 text-xl text-white shadow transition-colors hover:scale-105 hover:bg-blue-600"
            >
              <span>
                {deck.emoji} {deck.title}
              </span>
              <span className="text-sm opacity-75">
                {deck.words.length} words
              </span>
            </button>
          ))}

          {customDecks.map(deck => (
            <div key={deck.id} className="flex w-full items-center gap-2">
              <button
                onClick={() => onSelect(deck)}
                className="flex flex-1 transform items-center justify-between rounded-lg bg-purple-500 p-4 text-xl text-white shadow transition-colors hover:scale-105 hover:bg-purple-600"
              >
                <span>
                  {deck.emoji} {deck.title}
                </span>
                <span className="text-sm opacity-75">
                  {deck.words.length} words
                </span>
              </button>
              {confirmDeleteId === deck.id ? (
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    onClick={() => handleDeleteDeck(deck.id)}
                    className="rounded-lg bg-red-500 px-2 py-1 text-xs text-white shadow hover:bg-red-600"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="rounded-lg bg-gray-200 px-2 py-1 text-xs text-gray-700 shadow hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(deck.id)}
                  aria-label={`Delete ${deck.title}`}
                  className="shrink-0 rounded-lg bg-gray-200 p-3 text-lg shadow hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                >
                  🗑
                </button>
              )}
            </div>
          ))}

          <button
            onClick={() => setCreating(true)}
            className="w-full rounded-lg border-2 border-dashed border-gray-400 p-4 text-xl text-gray-600 transition-colors hover:border-gray-500 hover:text-gray-800 dark:border-gray-500 dark:text-gray-300 dark:hover:border-gray-400 dark:hover:text-gray-100"
          >
            ＋ Create your own deck
          </button>
        </div>
        <a
          href="/"
          className="inline-block pt-4 text-sm text-gray-500 no-underline hover:underline dark:text-gray-400"
        >
          ← back to brendanreed.me
        </a>
      </div>
    </div>
  )
}

export default CategoryPicker
