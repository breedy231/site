import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { motion } from "framer-motion"
import { decks } from "../../data/headsupCategories"
import { useTiltControls } from "../../hooks/useTiltControls"
import { useRoundTimer } from "../../hooks/useRoundTimer"
import { useWakeLock } from "../../hooks/useWakeLock"
import { useFullscreen } from "../../hooks/useFullscreen"
import { sounds } from "./sounds"
import CategoryPicker from "./CategoryPicker"
import PlayScreen from "./PlayScreen"
import ResultsScreen from "./ResultsScreen"

const ROUND_LENGTHS = [60, 90, 120]
const MIN_ACTION_GAP_MS = 250
const FLASH_MS = 350
// tilt-to-start: hold the phone roughly level at the forehead this long
const TILT_START_HOLD_MS = 500
const TILT_START_MAX_PITCH_DEG = 30
const TILT_START_MIN_VERTICAL_G = 4

function shuffle(words) {
  const arr = [...words]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const initialState = {
  phase: "category", // category | ready | countdown | playing | finished
  deck: null,
  remaining: [],
  currentWord: "",
  results: [],
  paused: false,
  pauseReason: null, // "user" | "rotate"
}

function reducer(state, action) {
  switch (action.type) {
    case "SELECT_DECK":
      return { ...initialState, phase: "ready", deck: action.deck }
    case "BACK":
      return initialState
    case "START_COUNTDOWN":
      // action.words is pre-shuffled at the dispatch site (reducers stay pure)
      return {
        ...state,
        phase: "countdown",
        currentWord: action.words[0],
        remaining: action.words.slice(1),
        results: [],
        paused: false,
        pauseReason: null,
      }
    case "COUNTDOWN_DONE":
      return state.phase === "countdown"
        ? { ...state, phase: "playing" }
        : state
    case "MARK": {
      if (state.phase !== "playing" || state.paused) return state
      // record the current card before checking exhaustion, so the last
      // card of a deck is always scored
      const results = [
        ...state.results,
        { word: state.currentWord, correct: action.correct },
      ]
      if (state.remaining.length === 0) {
        return { ...state, results, currentWord: "", phase: "finished" }
      }
      return {
        ...state,
        results,
        currentWord: state.remaining[0],
        remaining: state.remaining.slice(1),
      }
    }
    case "PAUSE":
      return state.phase === "playing" && !state.paused
        ? { ...state, paused: true, pauseReason: action.reason || "user" }
        : state
    case "RESUME":
      return { ...state, paused: false, pauseReason: null }
    case "TIME_UP":
      return state.phase === "playing"
        ? { ...state, phase: "finished", paused: false, pauseReason: null }
        : state
    case "PLAY_AGAIN":
      return {
        ...state,
        phase: "ready",
        remaining: [],
        currentWord: "",
        results: [],
        paused: false,
        pauseReason: null,
      }
    default:
      return state
  }
}

const HeadsUpGame = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { phase, deck, paused, pauseReason, currentWord, remaining, results } =
    state

  const stateRef = useRef(state)
  stateRef.current = state

  const [roundLength, setRoundLength] = useState(() => {
    try {
      const stored = parseInt(localStorage.getItem("headsupRoundLength"), 10)
      return ROUND_LENGTHS.includes(stored) ? stored : 60
    } catch {
      return 60
    }
  })
  const roundLengthRef = useRef(roundLength)
  roundLengthRef.current = roundLength

  const [isMuted, setIsMuted] = useState(sounds.isMuted())
  const [bestScore, setBestScore] = useState(null)
  const [isNewBest, setIsNewBest] = useState(false)
  const [flash, setFlash] = useState(null)
  const [countdownStep, setCountdownStep] = useState(null)
  const [isPortrait, setIsPortrait] = useState(false)
  const [debugSnapshot, setDebugSnapshot] = useState(null)
  const debugEnabled =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("debug")

  const lastMarkAtRef = useRef(0)
  const hasStartedOnceRef = useRef(false)
  const rootRef = useRef(null)

  const timer = useRoundTimer({
    onTick: seconds => {
      if (seconds <= 10) sounds.play("tick")
    },
    onExpire: () => dispatch({ type: "TIME_UP" }),
  })
  const timerRef = useRef(timer)
  timerRef.current = timer

  const wakeLock = useWakeLock()
  const fullscreen = useFullscreen()

  // Single scoring path shared by tilt, tap, and keyboard.
  const mark = useCallback(correct => {
    const now = Date.now()
    if (now - lastMarkAtRef.current < MIN_ACTION_GAP_MS) return
    const current = stateRef.current
    if (current.phase !== "playing" || current.paused) return
    lastMarkAtRef.current = now
    dispatch({ type: "MARK", correct })
    sounds.play(correct ? "correct" : "wrong")
    if (navigator.vibrate) navigator.vibrate(correct ? 60 : [40, 60, 40])
    setFlash({ type: correct ? "correct" : "pass", key: now })
  }, [])

  const tilt = useTiltControls({
    onAction: action => mark(action === "correct"),
  })

  const togglePause = useCallback(() => {
    const current = stateRef.current
    if (current.phase !== "playing") return
    if (current.paused) {
      timerRef.current.resume()
      dispatch({ type: "RESUME" })
    } else {
      timerRef.current.pause()
      dispatch({ type: "PAUSE" })
    }
  }, [])

  const quitRound = useCallback(() => {
    timerRef.current.stop()
    dispatch({ type: "BACK" })
  }, [])

  // Start button: the one user gesture that unlocks audio, requests motion
  // permission (iOS), enters fullscreen, and grabs the wake lock.
  const handleStart = async () => {
    hasStartedOnceRef.current = true
    sounds.unlock()
    sounds.load()
    await tilt.requestPermission().catch(() => {})
    fullscreen.enter(rootRef.current)
    wakeLock.acquire()
    dispatch({ type: "START_COUNTDOWN", words: shuffle(deck.words) })
  }

  // Tilt-to-start: once a manual Start has unlocked audio this page load,
  // later rounds can begin by holding the phone level at the forehead.
  // Gesture-bound steps (permission, audio unlock, fullscreen) are skipped.
  const tiltStartArmed =
    phase === "ready" &&
    !isPortrait &&
    tilt.permission === "granted" &&
    hasStartedOnceRef.current

  useEffect(() => {
    if (!tiltStartArmed) return
    let heldSince = null
    let fired = false
    const interval = setInterval(() => {
      const { pitch, gravity } = tilt.getDebugState()
      const holding =
        Math.abs(pitch) < TILT_START_MAX_PITCH_DEG &&
        Math.abs(gravity.x) > TILT_START_MIN_VERTICAL_G
      if (!holding) {
        heldSince = null
        return
      }
      if (heldSince == null) {
        heldSince = Date.now()
      } else if (!fired && Date.now() - heldSince >= TILT_START_HOLD_MS) {
        fired = true
        sounds.load()
        wakeLock.acquire()
        dispatch({
          type: "START_COUNTDOWN",
          words: shuffle(stateRef.current.deck.words),
        })
      }
    }, 100)
    return () => clearInterval(interval)
  }, [tiltStartArmed, tilt, wakeLock])

  // Arm tilt detection only while actively playing.
  useEffect(() => {
    tilt.setEnabled(phase === "playing" && !paused)
  }, [phase, paused, tilt])

  // Phase side effects: run the timer during play, wind everything down after.
  useEffect(() => {
    if (phase === "playing") {
      timerRef.current.start(roundLengthRef.current)
    } else if (phase === "finished") {
      timerRef.current.stop()
      sounds.play("gameOver")
      wakeLock.release()
      fullscreen.exit()
    } else if (phase === "category" || phase === "ready") {
      timerRef.current.stop()
      wakeLock.release()
      fullscreen.exit()
    }
  }, [phase])

  // Track the per-deck best score (correct − passed) in localStorage.
  useEffect(() => {
    if (phase !== "finished") return
    const { deck: finishedDeck, results: finishedResults } = stateRef.current
    if (!finishedDeck) return
    const correct = finishedResults.filter(r => r.correct).length
    const score = correct - (finishedResults.length - correct)
    let previous = null
    try {
      const stored = localStorage.getItem("headsupBest:" + finishedDeck.id)
      if (stored != null) previous = parseInt(stored, 10)
      if (Number.isNaN(previous)) previous = null
    } catch {
      previous = null
    }
    const beat = previous == null || score > previous
    if (beat) {
      try {
        localStorage.setItem("headsupBest:" + finishedDeck.id, String(score))
      } catch {
        // storage unavailable — best just isn't persisted
      }
    }
    setBestScore(beat ? score : previous)
    setIsNewBest(previous != null && score > previous)
  }, [phase])

  // 3-2-1-GO countdown; calibrates the tilt neutral at "GO".
  useEffect(() => {
    if (phase !== "countdown") {
      setCountdownStep(null)
      return
    }
    let cancelled = false
    setCountdownStep("3")
    sounds.play("tick")
    const timeouts = ["2", "1", "GO!"].map((step, index) =>
      setTimeout(
        () => {
          if (cancelled) return
          setCountdownStep(step)
          if (step === "GO!") {
            sounds.play("start")
            tilt.calibrate()
          } else {
            sounds.play("tick")
          }
        },
        (index + 1) * 1000,
      ),
    )
    timeouts.push(
      setTimeout(() => {
        if (!cancelled) dispatch({ type: "COUNTDOWN_DONE" })
      }, 3800),
    )
    return () => {
      cancelled = true
      timeouts.forEach(clearTimeout)
    }
  }, [phase])

  // Landscape gate: block round start in portrait, auto-pause mid-round on
  // rotation, auto-resume when rotated back.
  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)")
    setIsPortrait(mq.matches)
    const handleChange = event => setIsPortrait(event.matches)
    mq.addEventListener("change", handleChange)
    return () => mq.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    const current = stateRef.current
    if (phase !== "playing") return
    if (isPortrait && !current.paused) {
      timerRef.current.pause()
      dispatch({ type: "PAUSE", reason: "rotate" })
    } else if (
      !isPortrait &&
      current.paused &&
      current.pauseReason === "rotate"
    ) {
      timerRef.current.resume()
      dispatch({ type: "RESUME" })
    }
  }, [isPortrait, phase])

  // Keyboard controls (desktop): arrows mark, space/esc pauses.
  useEffect(() => {
    const handleKey = event => {
      if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        mark(true)
      } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        mark(false)
      } else if (event.key === " " || event.key === "Escape") {
        if (stateRef.current.phase === "playing") {
          event.preventDefault()
          togglePause()
        }
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [mark, togglePause])

  // Clear the feedback flash shortly after each action.
  useEffect(() => {
    if (!flash) return
    const timeout = setTimeout(() => setFlash(null), FLASH_MS)
    return () => clearTimeout(timeout)
  }, [flash])

  // Debug overlay (?debug): poll the hook's refs at 5Hz.
  useEffect(() => {
    if (!debugEnabled) return
    const interval = setInterval(
      () =>
        setDebugSnapshot({
          ...tilt.getDebugState(),
          audio: sounds.getAudioDebug(),
        }),
      200,
    )
    return () => clearInterval(interval)
  }, [debugEnabled, tilt])

  const correctCount = results.filter(r => r.correct).length
  const passCount = results.length - correctCount
  const tiltAvailable = tilt.supported && tilt.permission !== "denied"

  return (
    <div
      ref={rootRef}
      className="h-[100dvh] overflow-hidden bg-gray-100 dark:bg-gray-800"
    >
      {phase !== "playing" && (
        <button
          onClick={() => setIsMuted(sounds.toggleMute())}
          className="fixed top-4 right-4 z-30 rounded-full bg-gray-200 p-2 text-xs dark:bg-gray-600 dark:text-gray-200"
          aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      )}

      {phase === "category" && (
        <CategoryPicker
          decks={decks}
          onSelect={selected =>
            dispatch({ type: "SELECT_DECK", deck: selected })
          }
        />
      )}

      {phase === "ready" && (
        <div className="flex h-full flex-col items-center justify-center overflow-y-auto p-4">
          <div className="w-full max-w-md space-y-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {deck.emoji} {deck.title}
            </h2>
            {isPortrait ? (
              <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-700">
                <div className="mb-2 text-4xl">📱↷</div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  Rotate your phone sideways
                </p>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Heads Up is played in landscape, phone on your forehead.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-lg bg-white p-6 text-left shadow-lg dark:bg-gray-700">
                  <p className="mb-3 text-gray-600 dark:text-gray-300">
                    1. Hold the phone on your forehead, screen facing your
                    friends
                  </p>
                  <p className="mb-3 text-gray-600 dark:text-gray-300">
                    2. {tiltAvailable ? "Tilt down" : "Tap left"} for correct,{" "}
                    {tiltAvailable ? "tilt up" : "tap right"} to pass
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    (Desktop: ← correct, → pass, space to pause)
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {ROUND_LENGTHS.map(length => (
                    <button
                      key={length}
                      onClick={() => {
                        setRoundLength(length)
                        try {
                          localStorage.setItem(
                            "headsupRoundLength",
                            String(length),
                          )
                        } catch {
                          // ignore
                        }
                      }}
                      className={`rounded-lg px-4 py-2 shadow ${
                        roundLength === length
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {length}s
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleStart}
                  className="w-full transform rounded-lg bg-green-500 p-4 text-xl text-white shadow transition-colors hover:scale-105 hover:bg-green-600"
                >
                  Start Game
                </button>
                {tiltStartArmed && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    …or hold the phone to your forehead to start
                  </p>
                )}
                {isMuted && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    🔇 Sounds are muted — tap the speaker icon to unmute
                  </p>
                )}
              </>
            )}
            <button
              onClick={() => dispatch({ type: "BACK" })}
              className="text-sm text-gray-500 hover:underline dark:text-gray-400"
            >
              ← choose a different deck
            </button>
          </div>
        </div>
      )}

      {phase === "countdown" && (
        <div className="flex h-full items-center justify-center">
          <motion.div
            key={countdownStep}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-8xl font-bold text-blue-600"
          >
            {countdownStep}
          </motion.div>
        </div>
      )}

      {phase === "playing" && (
        <PlayScreen
          currentWord={currentWord}
          secondsLeft={timer.secondsLeft}
          remainingCount={remaining.length}
          correctCount={correctCount}
          passCount={passCount}
          paused={paused}
          pauseReason={pauseReason}
          flash={flash}
          onMark={mark}
          onTogglePause={togglePause}
          onQuit={quitRound}
        />
      )}

      {phase === "finished" && (
        <ResultsScreen
          results={results}
          best={bestScore}
          isNewBest={isNewBest}
          onPlayAgain={() => dispatch({ type: "PLAY_AGAIN" })}
          onNewCategory={() => dispatch({ type: "BACK" })}
        />
      )}

      {debugEnabled && (
        <div className="pointer-events-none fixed bottom-2 left-2 z-40 rounded bg-black/70 p-2 font-mono text-xs text-green-400">
          <div>phase: {phase}</div>
          <div>permission: {tilt.permission}</div>
          <div>pitch: {debugSnapshot?.pitch?.toFixed(1) ?? "-"}</div>
          <div>zone: {debugSnapshot?.zone ?? "-"}</div>
          <div>arm: {debugSnapshot?.armState ?? "-"}</div>
          <div>samples: {debugSnapshot?.sampleCount ?? 0}</div>
          <div>
            last: {debugSnapshot?.lastAction?.action ?? "-"} @{" "}
            {debugSnapshot?.lastAction?.pitch?.toFixed(0) ?? "-"}°
          </div>
          <div>
            audio: {debugSnapshot?.audio?.ctxState ?? "-"} ·{" "}
            {debugSnapshot?.audio?.buffersLoaded ?? 0} buf ·{" "}
            {debugSnapshot?.audio?.muted ? "muted" : "unmuted"} · session:{" "}
            {debugSnapshot?.audio?.audioSessionType ?? "-"}
          </div>
        </div>
      )}
    </div>
  )
}

export default HeadsUpGame
