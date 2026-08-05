import { motion, AnimatePresence } from "framer-motion"

// The in-round screen: timer, word card, tap zones, flash feedback, pause
// overlay. Pointer input lands on this surface only — taps on buttons are
// filtered out so the pause/mute controls never score a card.
const PlayScreen = ({
  currentWord,
  secondsLeft,
  remainingCount,
  correctCount,
  passCount,
  paused,
  pauseReason,
  flash,
  onMark,
  onTogglePause,
  onQuit,
}) => (
  <div
    className="relative flex h-full touch-none flex-col select-none"
    onPointerDown={event => {
      if (paused || event.target.closest("button")) return
      onMark(event.clientX < window.innerWidth / 2)
    }}
  >
    <div className="flex items-center justify-between p-4">
      <div className="text-4xl font-bold text-blue-600">{secondsLeft}s</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {remainingCount} words left
      </div>
      <button
        onClick={onTogglePause}
        className="rounded-full bg-gray-200 px-4 py-2 dark:bg-gray-600 dark:text-gray-200"
        aria-label={paused ? "Resume" : "Pause"}
      >
        {paused ? "▶" : "⏸"}
      </button>
    </div>

    <div className="relative mx-4 mb-4 flex-1">
      <div className="absolute inset-0 flex overflow-hidden rounded-lg">
        <div className="flex w-1/2 items-end justify-center bg-green-50/20 pb-2 text-xs text-green-700/60 dark:text-green-300/60">
          tap: correct
        </div>
        <div className="flex w-1/2 items-end justify-center bg-red-50/20 pb-2 text-xs text-red-700/60 dark:text-red-300/60">
          tap: pass
        </div>
      </div>
      <motion.div
        key={currentWord}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex h-full items-center justify-center rounded-lg bg-white p-6 text-center text-5xl font-bold text-gray-900 shadow-lg landscape:text-6xl dark:bg-gray-700 dark:text-white"
        aria-live="polite"
      >
        {currentWord}
      </motion.div>
    </div>

    <div className="flex justify-between px-4 pb-3 text-xl">
      <div className="text-green-600">{correctCount} correct</div>
      <div className="text-red-600">{passCount} passed</div>
    </div>

    {/* full-screen feedback flash, readable at forehead distance */}
    <AnimatePresence>
      {flash && (
        <motion.div
          key={flash.key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.95 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center ${
            flash.type === "correct" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          <span className="text-7xl font-bold text-white">
            {flash.type === "correct" ? "✓ Correct!" : "✕ Pass"}
          </span>
        </motion.div>
      )}
    </AnimatePresence>

    {paused && (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-gray-900/90 p-6 text-center">
        {pauseReason === "rotate" ? (
          <>
            <div className="text-3xl font-bold text-white">
              Rotate your phone sideways 📱↷
            </div>
            <p className="text-gray-300">
              The game resumes when the phone is back in landscape.
            </p>
          </>
        ) : (
          <>
            <div className="text-3xl font-bold text-white">Paused</div>
            <button
              onClick={onTogglePause}
              className="w-64 rounded-lg bg-green-500 p-4 text-xl text-white shadow hover:bg-green-600"
            >
              Resume
            </button>
          </>
        )}
        <button
          onClick={onQuit}
          className="w-64 rounded-lg bg-red-500 p-4 text-xl text-white shadow hover:bg-red-600"
        >
          Quit Round
        </button>
      </div>
    )}
  </div>
)

export default PlayScreen
