import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Layout from "../components/layout"
import { categories } from "../data/headsupCategories"
import { Helmet } from "react-helmet"
import soundManager from "../components/SoundManager"
import "../styles/global.css"

const HeadsUpGame = () => {
  const [gameState, setGameState] = useState("category")
  const [currentCategory, setCurrentCategory] = useState(null)
  const [currentWord, setCurrentWord] = useState("")
  const [score, setScore] = useState({ correct: 0, incorrect: 0 })
  const [timeLeft, setTimeLeft] = useState(60)
  const [words, setWords] = useState([])
  const [wordResults, setWordResults] = useState([])
  const [showDebug, setShowDebug] = useState(false)
  const [isMuted, setIsMuted] = useState(soundManager.isMuted())
  const [hasOrientationPermission, setHasOrientationPermission] =
    useState(false)

  // Consolidated debug state
  const [debugState, setDebugState] = useState({
    info: "",
    deviceType: "unknown",
    hasMotionEvents: false,
    permissionState: "unknown",
    lastMotionTime: null,
  })

  // State tracking refs
  const lastActionTime = useRef(0)
  const gameStateRef = useRef("category")

  // Request iOS permission for device orientation
  const requestOrientationPermission = async () => {
    if (typeof window === "undefined") return

    // Update device type detection
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    const deviceType = isIOS ? "iOS" : "non-iOS"
    const isSecureContext =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost"

    setDebugState(prev => ({
      ...prev,
      deviceType,
      hasMotionEvents: "DeviceOrientationEvent" in window,
      info: `Device: ${deviceType}, Secure: ${isSecureContext}`,
    }))

    try {
      // Check if we have the permission API (iOS 13+) and are in a secure context
      if (
        typeof DeviceOrientationEvent.requestPermission === "function" &&
        isSecureContext
      ) {
        setDebugState(prev => ({
          ...prev,
          info: "Permission API available, requesting...",
        }))

        const permission = await DeviceOrientationEvent.requestPermission()
        console.log("Permission response:", permission)

        setDebugState(prev => ({ ...prev, permissionState: permission }))
        setHasOrientationPermission(permission === "granted")

        if (permission === "granted") {
          setDebugState(prev => ({
            ...prev,
            info: "Permission granted, enabling tilt controls",
          }))
          window.addEventListener("deviceorientation", handleOrientation, true)
        } else {
          setDebugState(prev => ({
            ...prev,
            info: `Permission denied: ${permission}`,
          }))
        }
      } else {
        // Fallback for non-secure contexts or older browsers
        if (!isSecureContext && isIOS) {
          setDebugState(prev => ({
            ...prev,
            info: "HTTPS required for iOS motion controls, using tap only",
            permissionState: "https-required",
          }))
          setHasOrientationPermission(false)
        } else {
          setDebugState(prev => ({
            ...prev,
            info: "Enabling tilt controls (no permission needed)",
            permissionState: "granted",
          }))
          setHasOrientationPermission(true)
          window.addEventListener("deviceorientation", handleOrientation, true)
        }
      }
    } catch (error) {
      console.error("Permission error:", error)
      setDebugState(prev => ({
        ...prev,
        info: `Permission error: ${error.message} - Using tap controls only`,
      }))
      setDebugState(prev => ({ ...prev, permissionState: "error" }))
      setHasOrientationPermission(false)
    }

    return hasOrientationPermission
  }

  // Initialize orientation detection and handle permission changes
  useEffect(() => {
    // Don't initialize on server-side
    if (typeof window === "undefined") return

    // Initial permission request
    requestOrientationPermission()
  }, [])

  // Separate effect to handle motion listener based on permission state
  useEffect(() => {
    if (typeof window === "undefined") return

    if (hasOrientationPermission) {
      console.log("Adding orientation listener due to permission granted")
      window.addEventListener("deviceorientation", handleOrientation, true)
      setDebugState(prev => ({ ...prev, info: "Motion listener activated" }))
    } else {
      console.log("Removing orientation listener due to no permission")
      window.removeEventListener("deviceorientation", handleOrientation, true)
      setDebugState(prev => ({ ...prev, info: "Motion listener deactivated" }))
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("deviceorientation", handleOrientation, true)
      }
    }
  }, [hasOrientationPermission])

  const handleTouchStart = e => {
    if (gameState !== "playing") return

    const now = Date.now()
    if (now - lastActionTime.current < GAME_CONFIG.ACTION_COOLDOWN) return

    const touch = e.touches[0]
    const screenWidth = window.innerWidth
    const tapX = touch.clientX

    lastActionTime.current = now

    // Left half of screen is correct, right half is incorrect
    if (tapX < screenWidth / 2) {
      handleCorrect("tap left")
    } else {
      handleIncorrect("tap right")
    }
  }

  // Remove handleTouchEnd since we're using instant taps
  const handleTouchEnd = () => {}

  // Add effect to keep gameStateRef in sync
  useEffect(() => {
    gameStateRef.current = gameState
    console.log("Game state updated:", gameState)
  }, [gameState])

  // Game constants
  const GAME_CONFIG = {
    ACTION_COOLDOWN: 800,
    GAME_DURATION: 60,
    COUNTDOWN_STEP: 1000,
    TIMER_WARNING_THRESHOLD: 11,
    PORTRAIT: {
      TILT_THRESHOLD: 30,
      VERTICAL_MIN: 45,
      VERTICAL_MAX: 135,
    },
    LANDSCAPE: {
      THRESHOLD: 25,
      VERTICAL_TOLERANCE: 60,
      // Dynamic neutral calculation instead of fixed 90°
      NEUTRAL_TOLERANCE: 15,
    },
  }

  // Update useEffect for game timer
  // Update useEffect for game timer and state management
  useEffect(() => {
    let timer
    let isActive = true // For cleanup

    const cleanup = () => {
      if (timer) {
        clearInterval(timer)
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("deviceorientation", handleOrientation, true)
      }
      isActive = false
    }

    if (gameState === "playing" && timeLeft > 0) {
      // Set up timer
      timer = setInterval(() => {
        if (isActive) {
          setTimeLeft(prev => {
            // Only play ticking sound in final 10 seconds
            if (prev <= GAME_CONFIG.TIMER_WARNING_THRESHOLD && prev > 1) {
              soundManager.play("timerWarning")
            }
            if (prev <= 1) {
              console.log("Timer reached 0 - ending game")
              endGame()
              return 0
            }
            return prev - 1
          })
        }
      }, 1000)

      // Add orientation listener
      if (typeof window !== "undefined" && hasOrientationPermission) {
        window.addEventListener("deviceorientation", handleOrientation, true)
      }
    }

    // Cleanup function
    return cleanup
  }, [gameState, timeLeft, hasOrientationPermission])

  // Improved orientation handling with better landscape detection
  const handleOrientation = event => {
    if (gameStateRef.current !== "playing") return

    const now = Date.now()
    if (now - lastActionTime.current < GAME_CONFIG.ACTION_COOLDOWN) return

    try {
      const { gamma = 0, beta = 0 } = event
      const orientation = window.orientation || 0
      const isPortrait = orientation === 0 || orientation === 180

      console.log(
        `Raw - Beta: ${beta.toFixed(1)}°, Gamma: ${gamma.toFixed(1)}°, Orientation: ${orientation}°`,
      )

      if (isPortrait) {
        handlePortraitMode(gamma, beta, now)
      } else {
        handleLandscapeMode(gamma, beta, orientation, now)
      }
    } catch (error) {
      console.error("Orientation error:", error)
      setDebugState(prev => ({ ...prev, info: `Error: ${error.message}` }))
    }
  }

  const handlePortraitMode = (gamma, beta, now) => {
    // Check vertical position
    if (
      beta < GAME_CONFIG.PORTRAIT.VERTICAL_MIN ||
      beta > GAME_CONFIG.PORTRAIT.VERTICAL_MAX
    ) {
      setDebugState(prev => ({
        ...prev,
        info: `Adjust phone position | Vertical: ${beta.toFixed(1)}°`,
      }))
      return
    }

    if (Math.abs(gamma) > GAME_CONFIG.PORTRAIT.TILT_THRESHOLD) {
      lastActionTime.current = now

      if (gamma < -GAME_CONFIG.PORTRAIT.TILT_THRESHOLD) {
        console.log("Portrait LEFT tilt detected - Correct")
        handleCorrect("tilt left")
        setDebugState(prev => ({ ...prev, info: "Correct ✅" }))
      } else {
        console.log("Portrait RIGHT tilt detected - Pass")
        handleIncorrect("tilt right")
        setDebugState(prev => ({ ...prev, info: "Pass ❌" }))
      }
    } else {
      setDebugState(prev => ({
        ...prev,
        info: `Ready | Portrait tilt: ${gamma.toFixed(1)}°`,
      }))
    }
  }

  const handleLandscapeMode = (gamma, beta, orientation, now) => {
    // Improved landscape logic: use beta for up/down motion
    // Account for different landscape orientations
    const isLandscapeLeft = orientation === -90 || orientation === 270
    const isLandscapeRight = orientation === 90

    // Check if device is roughly vertical (not lying flat)
    if (Math.abs(gamma) > GAME_CONFIG.LANDSCAPE.VERTICAL_TOLERANCE) {
      setDebugState(prev => ({
        ...prev,
        info: `Hold phone more upright | Gamma: ${gamma.toFixed(1)}°`,
      }))
      return
    }

    // Use beta for up/down detection in landscape
    // Normalize beta to handle different orientations
    let normalizedBeta = beta
    if (isLandscapeLeft) {
      // In left landscape, beta values are inverted for natural up/down motion
      normalizedBeta = -beta
    }

    // Calculate deviation from neutral (around 0° when upright in landscape)
    const neutralBeta = 0
    const tiltFromNeutral = normalizedBeta - neutralBeta

    console.log(
      `Landscape - Beta: ${beta.toFixed(1)}°, Normalized: ${normalizedBeta.toFixed(1)}°, Tilt: ${tiltFromNeutral.toFixed(1)}°`,
    )

    if (Math.abs(tiltFromNeutral) > GAME_CONFIG.LANDSCAPE.THRESHOLD) {
      lastActionTime.current = now

      if (tiltFromNeutral > GAME_CONFIG.LANDSCAPE.THRESHOLD) {
        // Tilted up (correct)
        console.log("Landscape UP tilt detected - Correct")
        handleCorrect("tilt up")
        setDebugState(prev => ({ ...prev, info: "Correct ✅" }))
      } else {
        // Tilted down (pass)
        console.log("Landscape DOWN tilt detected - Pass")
        handleIncorrect("tilt down")
        setDebugState(prev => ({ ...prev, info: "Pass ❌" }))
      }
    } else {
      setDebugState(prev => ({
        ...prev,
        info: `Ready | Landscape tilt: ${tiltFromNeutral.toFixed(1)}°`,
      }))
    }
  }

  const startGame = category => {
    console.log(`Starting game with category: ${category}`)
    // Make a deep copy of the category words
    const categoryWords = [...categories[category]]
    console.log(`Loaded ${categoryWords.length} words`)
    setWords(categoryWords)
    setCurrentCategory(category)
    setWordResults([]) // Clear previous word results
    setGameState("ready")
  }

  const beginCountdown = async () => {
    console.log("Beginning countdown")
    setDebugState(prev => ({ ...prev, info: "Starting game..." }))

    // Load sounds
    await soundManager.loadSounds()

    try {
      if (!hasOrientationPermission) {
        setDebugState(prev => ({
          ...prev,
          info: "Requesting permission before start...",
        }))
        await requestOrientationPermission()
      }

      // Reset last action time
      lastActionTime.current = Date.now()

      // Set initial word before changing state
      const initialWords = [...words]
      if (initialWords.length === 0) {
        console.error("No words available to start game")
        return
      }

      const randomIndex = Math.floor(Math.random() * initialWords.length)
      const firstWord = initialWords[randomIndex]
      const remainingWords = initialWords.filter(
        (_, index) => index !== randomIndex,
      )

      // Set up initial game state
      setScore({ correct: 0, incorrect: 0 })
      setWordResults([])
      setTimeLeft(GAME_CONFIG.GAME_DURATION)

      // Set up countdown state
      setGameState("countdown")
      setDebugState(prev => ({ ...prev, info: "3..." }))
      soundManager.play("timerWarning")

      // 3-2-1 countdown
      await new Promise(resolve =>
        setTimeout(resolve, GAME_CONFIG.COUNTDOWN_STEP),
      )
      setDebugState(prev => ({ ...prev, info: "2..." }))
      soundManager.play("timerWarning")

      await new Promise(resolve =>
        setTimeout(resolve, GAME_CONFIG.COUNTDOWN_STEP),
      )
      setDebugState(prev => ({ ...prev, info: "1..." }))
      soundManager.play("timerWarning")

      await new Promise(resolve =>
        setTimeout(resolve, GAME_CONFIG.COUNTDOWN_STEP),
      )
      setDebugState(prev => ({ ...prev, info: "GO!" }))
      soundManager.stop("timerWarning") // Stop the ticking sound
      soundManager.play("start") // Play start sound for "GO!"

      // Wait for state updates to complete
      await new Promise(resolve => {
        setCurrentWord(firstWord)
        setWords(remainingWords)
        setTimeout(resolve, 50)
      })

      setGameState("playing")
      console.log(`Game started with ${remainingWords.length + 1} words`)
    } catch (error) {
      console.error("Error starting game:", error)
      setDebugState(prev => ({ ...prev, info: `Error: ${error.message}` }))
    }
  }

  // Add new refs for current state tracking
  const currentWordRef = useRef("")
  const wordsRef = useRef([])

  // Update refs whenever state changes
  useEffect(() => {
    currentWordRef.current = currentWord
  }, [currentWord])

  useEffect(() => {
    wordsRef.current = words
  }, [words])

  const getNextWord = () => {
    const currentWords = wordsRef.current
    if (!currentWords || currentWords.length === 0) return null

    const randomIndex = Math.floor(Math.random() * currentWords.length)
    const nextWord = currentWords[randomIndex]
    const remainingWords = currentWords.filter(
      (_, index) => index !== randomIndex,
    )

    return { nextWord, remainingWords }
  }

  const processAnswer = (isCorrect, method) => {
    console.log(`${isCorrect ? "Correct" : "Incorrect"} answer (${method})`)
    if (!gameStateRef.current || gameStateRef.current !== "playing") return

    const wordToStore = currentWordRef.current
    const next = getNextWord()

    soundManager.play(isCorrect ? "correct" : "wrong")

    if (!next) {
      endGame()
      return
    }

    // Update all states synchronously
    setScore(prev =>
      isCorrect
        ? { ...prev, correct: prev.correct + 1 }
        : { ...prev, incorrect: prev.incorrect + 1 },
    )
    setWordResults(prev => [...prev, { word: wordToStore, correct: isCorrect }])
    setWords(next.remainingWords)
    setCurrentWord(next.nextWord)
    setDebugState(prev => ({
      ...prev,
      info: `${isCorrect ? "Correct" : "Pass"}! ${wordToStore}`,
    }))
  }

  const handleCorrect = method => processAnswer(true, method)
  const handleIncorrect = method => processAnswer(false, method)

  const endGame = () => {
    console.log("Ending game - final scores:", score)
    console.log("Final word results:", wordResults)

    soundManager.stop("timerWarning") // Stop the ticking sound
    soundManager.play("gameOver")

    // Cleanup motion listener before ending
    if (typeof window !== "undefined") {
      window.removeEventListener("deviceorientation", handleOrientation, true)
    }
    setGameState("finished")
  }

  // Add keyboard controls for desktop testing
  useEffect(() => {
    const handleKeyPress = event => {
      if (gameState === "playing") {
        const now = Date.now()
        if (now - lastActionTime.current < GAME_CONFIG.ACTION_COOLDOWN) return

        lastActionTime.current = now
        if (event.key === "ArrowLeft") {
          handleCorrect("keyboard left")
        } else if (event.key === "ArrowRight") {
          handleIncorrect("keyboard right")
        }
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyPress)
      return () => window.removeEventListener("keydown", handleKeyPress)
    }
  }, [gameState])

  return (
    <Layout>
      <Helmet>
        <title>Heads Up! Game</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta
          name="description"
          content="Play Heads Up! - a fun word guessing game. Tilt or swipe to play!"
        />
        <meta name="theme-color" content="#3B82F6" />
      </Helmet>

      <div
        className="min-h-screen bg-gray-100 p-4 dark:bg-gray-800"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mx-auto max-w-md">
          <h1 className="mb-8 text-center text-4xl font-bold text-gray-900 dark:text-white">
            Heads Up!
          </h1>

          {/* Debug Toggle Button */}
          <div className="fixed right-4 top-4 flex gap-2">
            <button
              onClick={() => {
                const newMuted = soundManager.toggleMute()
                setIsMuted(newMuted)
              }}
              className="rounded-full bg-gray-200 p-2 text-xs dark:bg-gray-600 dark:text-gray-200"
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
            <button
              onClick={() => setShowDebug(prev => !prev)}
              className="rounded-full bg-gray-200 p-2 text-xs dark:bg-gray-600 dark:text-gray-200"
            >
              {showDebug ? "Hide Debug" : "Show Debug"}
            </button>
          </div>

          {/* Debug Info */}
          <div
            className={`mb-4 text-center text-xs text-gray-500 dark:text-gray-400 ${
              showDebug ? "" : "hidden"
            }`}
          >
            <div>Device Type: {debugState.deviceType}</div>
            <div>
              Has Motion Events: {debugState.hasMotionEvents ? "Yes" : "No"}
            </div>
            <div>Permission State: {debugState.permissionState}</div>
            <div>Last Motion: {debugState.lastMotionTime || "None"}</div>
            <div className="mt-2">{debugState.info}</div>
          </div>

          {gameState === "category" && (
            <div className="space-y-4">
              <h2 className="mb-4 text-center text-2xl font-bold text-gray-900 dark:text-white">
                Choose a Category
              </h2>
              {!hasOrientationPermission && (
                <div className="mb-4">
                  {debugState.permissionState === "https-required" ? (
                    <div className="rounded-lg bg-orange-100 p-3 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                      <p className="text-sm">
                        <strong>Note:</strong> Tilt controls require HTTPS on
                        iOS devices. The game will work with tap controls only.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={requestOrientationPermission}
                      className="w-full rounded-lg bg-yellow-500 p-3 text-white hover:bg-yellow-600"
                    >
                      Enable Tilt Controls (Optional)
                    </button>
                  )}
                </div>
              )}
              <div className="grid gap-4">
                {Object.keys(categories).map(category => (
                  <button
                    key={category}
                    onClick={() => startGame(category)}
                    className="w-full transform rounded-lg bg-blue-500 p-4 text-xl text-white shadow transition-colors hover:scale-105 hover:bg-blue-600"
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(gameState === "ready" || gameState === "countdown") && (
            <div className="space-y-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Get Ready!
              </h2>
              <div>
                {gameState === "countdown" ? (
                  <div className="flex h-48 items-center justify-center">
                    <motion.div
                      key={debugState.info}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="text-6xl font-bold text-blue-600"
                    >
                      {debugState.info}
                    </motion.div>
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-700">
                      <p className="mb-4 text-gray-600 dark:text-gray-300">
                        1. Hold your phone up to your forehead
                      </p>
                      <p className="mb-4 text-gray-600 dark:text-gray-300">
                        2. {hasOrientationPermission ? "Tilt or tap" : "Tap"}{" "}
                        the left side for correct ✅
                      </p>
                      <p className="mb-4 text-gray-600 dark:text-gray-300">
                        3. {hasOrientationPermission ? "Tilt or tap" : "Tap"}{" "}
                        the right side for pass ❌
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        (On desktop: use left/right arrow keys)
                      </p>
                    </div>
                    <button
                      onClick={beginCountdown}
                      className="mt-6 w-full transform rounded-lg bg-green-500 p-4 text-xl text-white shadow transition-colors hover:scale-105 hover:bg-green-600"
                    >
                      Start Game
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {gameState === "playing" && (
            <div className="flex min-h-[50vh] flex-col justify-center space-y-4 text-center">
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold text-blue-600">
                  {timeLeft}s
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Remaining Words: {words.length}
                </div>
              </div>
              <div className="relative flex-1">
                {/* Tap zone indicators */}
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 border-r border-gray-200 bg-green-50/20"></div>
                  <div className="w-1/2 bg-red-50/20"></div>
                </div>
                <motion.div
                  key={currentWord}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative flex h-full min-h-[200px] items-center justify-center rounded-lg bg-white p-8 text-4xl font-bold text-gray-900 shadow-lg dark:bg-gray-700 dark:text-white landscape:min-h-[40vh] landscape:p-4 landscape:text-3xl"
                >
                  {currentWord}
                </motion.div>
              </div>
              <div className="mt-4 flex justify-between text-xl">
                <div className="text-green-600">✅ {score.correct}</div>
                <div className="text-red-600">❌ {score.incorrect}</div>
              </div>
              {showDebug && (
                <div className="mt-2 text-xs text-gray-500">
                  Words played: {wordResults.length}
                </div>
              )}
            </div>
          )}

          {gameState === "finished" && (
            <div className="space-y-6 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                Game Over!
              </h2>
              <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-700">
                <div className="space-y-2 text-xl dark:text-gray-200">
                  <p className="text-green-600">Correct: {score.correct}</p>
                  <p className="text-red-600">Incorrect: {score.incorrect}</p>
                  <p className="mt-4 text-2xl font-bold">
                    Total Score: {score.correct - score.incorrect}
                  </p>
                </div>
              </div>

              {/* Word Results */}
              <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-700">
                <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                  Word Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="mb-2 font-bold text-green-600">
                      Correct ✅
                    </h4>
                    <ul className="text-left">
                      {wordResults
                        .filter(result => result.correct)
                        .map((result, index) => (
                          <li
                            key={`correct-${index}`}
                            className="text-green-600"
                          >
                            {result.word}
                          </li>
                        ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 font-bold text-red-600">
                      Incorrect ❌
                    </h4>
                    <ul className="text-left">
                      {wordResults
                        .filter(result => !result.correct)
                        .map((result, index) => (
                          <li
                            key={`incorrect-${index}`}
                            className="text-red-600"
                          >
                            {result.word}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => startGame(currentCategory)}
                  className="w-full rounded-lg bg-blue-500 p-4 text-xl text-white shadow transition-colors hover:bg-blue-600"
                >
                  Play Same Category
                </button>
                <button
                  onClick={() => setGameState("category")}
                  className="w-full rounded-lg bg-green-500 p-4 text-xl text-white shadow transition-colors hover:bg-green-600"
                >
                  Choose New Category
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default HeadsUpGame
