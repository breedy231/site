import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  loadCustomDecks,
  createCustomDeck,
  deleteCustomDeck,
  importCustomDeck,
} from "./customDecks"
import {
  buildShareUrl,
  decodeDeck,
  encodeDeck,
  readSharePayload,
} from "./deckShare"
import { loadSeenWords, clearSeenWords } from "./trendingSeen"
import CreateDeckScreen from "./CreateDeckScreen"
import ImportDeckPrompt from "./ImportDeckPrompt"

const MIN_TRENDING_WORDS = 10
const TOAST_MS = 2200

const IMPORT_ERRORS = {
  version: "That deck is from a newer version — reload and try again",
  unsupported: "This browser can't open deck links — try updating it",
  "too-large": "That deck link is too big to import",
}
const IMPORT_ERROR_FALLBACK = "That deck link is broken or incomplete"

// Drop #deck=… from the address bar so a reload doesn't prompt again.
function clearShareHash() {
  const { pathname, search } = window.location
  history.replaceState(history.state, "", pathname + search)
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // no async clipboard (e.g. plain-http LAN dev) — try the legacy path
  }
  try {
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.setAttribute("readonly", "")
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand("copy")
    textarea.remove()
    return copied
  } catch {
    return false
  }
}

// Native share sheet where available, clipboard otherwise.
// Resolves to "shared" | "copied" | "cancelled" | "failed".
async function shareLink(url, title) {
  const data = {
    title: `Heads Up: ${title}`,
    text: `Play my "${title}" deck in Heads Up!`,
    url,
  }
  if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
    try {
      await navigator.share(data)
      return "shared"
    } catch (err) {
      if (err?.name === "AbortError") return "cancelled"
      // share sheet refused (e.g. NotAllowedError) — fall back to copying
    }
  }
  return (await copyText(url)) ? "copied" : "failed"
}

const CategoryPicker = ({ decks, onSelect }) => {
  const [customDecks, setCustomDecks] = useState([])
  const [creating, setCreating] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [trendingLoading, setTrendingLoading] = useState(false)
  const [trendingError, setTrendingError] = useState(null)
  const [shareUrls, setShareUrls] = useState({})
  const [pendingImport, setPendingImport] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = message => setToast({ message, key: Date.now() })

  useEffect(() => {
    setCustomDecks(loadCustomDecks())
  }, [])

  // Opened from a share link (or one pasted into this tab): decode the
  // #deck= payload and ask before saving it.
  useEffect(() => {
    let cancelled = false
    const checkHash = async () => {
      const payload = readSharePayload(window.location.hash)
      if (payload == null) return
      try {
        const shared = await decodeDeck(payload)
        if (!cancelled) setPendingImport(shared)
      } catch (err) {
        clearShareHash()
        if (!cancelled)
          showToast(IMPORT_ERRORS[err.code] || IMPORT_ERROR_FALLBACK)
      }
    }
    checkHash()
    window.addEventListener("hashchange", checkHash)
    return () => {
      cancelled = true
      window.removeEventListener("hashchange", checkHash)
    }
  }, [])

  // Encode share links ahead of the tap: navigator.share and clipboard
  // writes need the tap's user activation, which awaiting compression inside
  // the click handler can lose (notably in iOS Safari).
  useEffect(() => {
    let cancelled = false
    Promise.all(
      customDecks.map(deck =>
        encodeDeck(deck).then(
          payload => [deck.id, buildShareUrl(payload, window.location)],
          () => [deck.id, null],
        ),
      ),
    ).then(entries => {
      if (!cancelled) setShareUrls(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [customDecks])

  useEffect(() => {
    if (!toast) return
    const timeout = setTimeout(() => setToast(null), TOAST_MS)
    return () => clearTimeout(timeout)
  }, [toast])

  const handleSaveDeck = (title, words) => {
    createCustomDeck(title, words)
    setCustomDecks(loadCustomDecks())
    setCreating(false)
  }

  const handleDeleteDeck = id => {
    setCustomDecks(deleteCustomDeck(id))
    setConfirmDeleteId(null)
  }

  const handleShareDeck = async deck => {
    let url = shareUrls[deck.id]
    if (!url) {
      try {
        url = buildShareUrl(await encodeDeck(deck), window.location)
      } catch (err) {
        showToast(
          err.code === "too-large"
            ? "This deck is too big to share"
            : "Couldn't make a share link",
        )
        return
      }
    }
    const outcome = await shareLink(url, deck.title)
    if (outcome === "copied") showToast("Link copied")
    else if (outcome === "failed") showToast("Couldn't share — try again")
  }

  const handleImportDeck = () => {
    const { deck, alreadySaved } = importCustomDeck(
      pendingImport.title,
      pendingImport.words,
    )
    setCustomDecks(loadCustomDecks())
    setPendingImport(null)
    clearShareHash()
    showToast(
      alreadySaved
        ? `"${deck.title}" is already in your decks`
        : `Added "${deck.title}"`,
    )
  }

  const handleCancelImport = () => {
    setPendingImport(null)
    clearShareHash()
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
      if (fetched.length === 0) throw new Error("Empty word list")
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

  const overlays = (
    <>
      <AnimatePresence>
        {pendingImport && (
          <ImportDeckPrompt
            key="import"
            deck={pendingImport}
            onImport={handleImportDeck}
            onCancel={handleCancelImport}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            role="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)_+_1.5rem)] z-50 flex justify-center px-4"
          >
            <div className="rounded-lg bg-gray-900 px-4 py-3 text-center text-white shadow-lg dark:bg-white dark:text-gray-900">
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )

  if (creating) {
    return (
      <>
        <CreateDeckScreen
          onSave={handleSaveDeck}
          onCancel={() => setCreating(false)}
        />
        {overlays}
      </>
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
                <>
                  <button
                    onClick={() => handleShareDeck(deck)}
                    aria-label={`Share ${deck.title}`}
                    className="shrink-0 rounded-lg bg-gray-200 p-3 text-lg shadow hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                  >
                    📤
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(deck.id)}
                    aria-label={`Delete ${deck.title}`}
                    className="shrink-0 rounded-lg bg-gray-200 p-3 text-lg shadow hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                  >
                    🗑
                  </button>
                </>
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
      {overlays}
    </div>
  )
}

export default CategoryPicker
