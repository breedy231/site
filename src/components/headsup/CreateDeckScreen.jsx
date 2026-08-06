import { useState } from "react"

const MIN_WORDS = 5

function parseWords(raw) {
  const pieces = raw
    .split(/[\n,]/)
    .map(word => word.trim())
    .filter(Boolean)
  const seen = new Set()
  const words = []
  for (const word of pieces) {
    const key = word.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    words.push(word)
  }
  return words
}

const CreateDeckScreen = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState("")
  const [wordsText, setWordsText] = useState("")

  const words = parseWords(wordsText)
  const canSave = title.trim().length > 0 && words.length >= MIN_WORDS

  const handleSubmit = event => {
    event.preventDefault()
    if (!canSave) return
    onSave(title.trim(), words)
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <div className="mx-auto w-full max-w-md space-y-4">
        <h1 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
          ✏️ Create your own deck
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="deck-title"
              className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300"
            >
              Deck title
            </label>
            <input
              id="deck-title"
              type="text"
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="e.g. Office Inside Jokes"
              className="w-full rounded-lg border border-gray-300 p-3 text-lg dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              maxLength={40}
            />
          </div>
          <div>
            <label
              htmlFor="deck-words"
              className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300"
            >
              Words or phrases
            </label>
            <textarea
              id="deck-words"
              value={wordsText}
              onChange={event => setWordsText(event.target.value)}
              placeholder={
                "One per line (or comma-separated)\ne.g.\nPizza Friday\nStandup meeting\nBroken printer"
              }
              rows={8}
              className="w-full rounded-lg border border-gray-300 p-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {words.length} word{words.length === 1 ? "" : "s"}
              {words.length < MIN_WORDS &&
                ` — need at least ${MIN_WORDS} to save`}
            </p>
          </div>
          <div className="flex gap-3 pb-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg bg-gray-200 p-3 text-lg text-gray-700 shadow transition-colors hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="flex-1 rounded-lg bg-blue-500 p-3 text-lg text-white shadow transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save deck
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateDeckScreen
