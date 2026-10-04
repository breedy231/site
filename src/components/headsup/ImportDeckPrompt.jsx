import { motion, useIsPresent } from "framer-motion"

const PREVIEW_WORDS = 4

// Confirmation shown when /headsup is opened from a deck share link.
const ImportDeckPrompt = ({ deck, onImport, onCancel }) => {
  const preview = deck.words.slice(0, PREVIEW_WORDS).join(" · ")
  const more = deck.words.length > PREVIEW_WORDS ? " · …" : ""
  // ignore taps while the prompt animates out, so a double-tap can't import
  // twice
  const isPresent = useIsPresent()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/70 p-4"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-deck-heading"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-h-full w-full max-w-sm space-y-4 overflow-y-auto rounded-lg bg-white p-6 text-center shadow-lg dark:bg-gray-700"
      >
        <h2
          id="import-deck-heading"
          className="text-2xl font-bold text-gray-900 dark:text-white"
        >
          Import deck?
        </h2>
        <div className="rounded-lg bg-purple-500 p-4 text-white shadow">
          <p className="text-xl break-words">✏️ {deck.title}</p>
          <p className="text-sm opacity-75">{deck.words.length} words</p>
        </div>
        <p className="text-sm break-words text-gray-500 dark:text-gray-400">
          {preview}
          {more}
        </p>
        <div className="flex gap-3">
          <button
            onClick={isPresent ? onCancel : undefined}
            className="flex-1 rounded-lg bg-gray-200 p-3 text-lg text-gray-700 shadow transition-colors hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={isPresent ? onImport : undefined}
            className="flex-1 rounded-lg bg-purple-500 p-3 text-lg text-white shadow transition-colors hover:bg-purple-600"
          >
            Import
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ImportDeckPrompt
