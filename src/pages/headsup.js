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
  const [debugInfo, setDebugInfo] = useState("")
  const [showDebug, setShowDebug] = useState(true)
  const [isMuted, setIsMuted] = useState(soundManager.isMuted())
  const [hasOrientationPermission, setHasOrientationPermission] =
    useState(false)

  // Add refs for state tracking
  const lastActionTime = useRef(0)
  const gameStateRef = useRef("category")

  // State for detailed debugging
  const [motionDebug, setMotionDebug] = useState({
    deviceType: "unknown",
    hasMotionEvents: false,
    permissionState: "unknown",
    lastMotionTime: null,
  })

  // Request iOS permission for device orientation
  const requestOrientationPermission = async () => {
    if (typeof window === "undefined") return

    // Update device type detection
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    const deviceType = isIOS ? "iOS" : "non-iOS"

    setMotionDebug(prev => ({
      ...prev,
      deviceType,
      hasMotionEvents: "DeviceOrientationEvent" in window,
    }))

    setDebugInfo(`Device: ${deviceType}, Requesting permissions...`)

    try {
      // Check if we have the permission API (iOS 13+)
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        setDebugInfo("Permission API available, requesting...")

        const permission = await DeviceOrientationEvent.requestPermission()
        console.log("Permission response:", permission)

        setMotionDebug(prev => ({ ...prev, permissionState: permission }))
        setHasOrientationPermission(permission === "granted")

        if (permission === "granted") {
          setDebugInfo("Permission granted, enabling tilt controls")
          window.addEventListener("deviceorientation", handleOrientation, true)
        } else {
          setDebugInfo(`Permission denied: ${permission}`)
        }
      } else {
        // No permission API needed (non-iOS or older versions)
        setDebugInfo(
          "No permission API needed, enabling tilt controls directly",
        )
        setMotionDebug(prev => ({ ...prev, permissionState: "granted" }))
        setHasOrientationPermission(true)
        window.addEventListener("deviceorientation", handleOrientation, true)
      }
    } catch (error) {
      console.error("Permission error:", error)
      setDebugInfo(`Permission error: ${error.message}`)
      setMotionDebug(prev => ({ ...prev, permissionState: "error" }))
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
      setDebugInfo("Motion listener activated")
    } else {
      console.log("Removing orientation listener due to no permission")
      window.removeEventListener("deviceorientation", handleOrientation, true)
      setDebugInfo("Motion listener deactivated")
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
    if (now - lastActionTime.current < ACTION_COOLDOWN) return

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

  // Constants with adjusted thresholds and timing
  const ACTION_COOLDOWN = 800 // Increased cooldown to prevent double-counting
  const TILT_THRESHOLD = 30 // Base threshold for portrait mode
  const VERTICAL_TOLERANCE = 60 // Vertical tolerance
  const LANDSCAPE_NEUTRAL = 90 // Neutral position in landscape
  const LANDSCAPE_THRESHOLD = 25 // Threshold for landscape mode

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
            if (prev <= 11 && prev > 1) {
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

  // Updated tilt handling with improved landscape detection
  const handleOrientation = event => {
    // Early exit if not playing
    if (gameStateRef.current !== "playing") {
      return
    }

    // Cooldown check
    const now = Date.now()
    if (now - lastActionTime.current < ACTION_COOLDOWN) {
      return
    }

    try {
      // Get orientation values
      const gamma = event.gamma || 0 // Left-right tilt (-90 to 90)
      const beta = event.beta || 0 // Front-back tilt (-180 to 180)
      const orientation = window.orientation || 0

      // Debug orientation values
      console.log(
        `Raw values - Beta: ${beta.toFixed(1)}°, Gamma: ${gamma.toFixed(
          1,
        )}°, Orientation: ${orientation}°`,
      )

      // Determine device orientation
      const isPortrait = orientation === 0 || orientation === 180

      // Calculate angles based on orientation
      let tiltAngle, verticalAngle

      if (isPortrait) {
        // Portrait mode
        tiltAngle = gamma // Left-right tilt
        verticalAngle = beta // Front-back tilt
      } else {
        // Landscape mode - normalize beta to 0-180 range for easier calculations
        tiltAngle = beta < 0 ? beta + 180 : beta // Normalize beta to 0-180
        verticalAngle = gamma // Gamma becomes the vertical alignment
      }

      // Check if phone is in roughly vertical position
      const isVertical = isPortrait
        ? verticalAngle > 45 && verticalAngle < 135 // Portrait: tilted back
        : Math.abs(verticalAngle) < VERTICAL_TOLERANCE // Landscape: roughly vertical

      if (!isVertical) {
        setDebugInfo(
          `Adjust phone position | Vertical: ${verticalAngle.toFixed(1)}°`,
        )
        return
      }

      // Log the processed angles
      console.log(
        `Processed - Tilt: ${tiltAngle.toFixed(
          1,
        )}°, Vertical: ${verticalAngle.toFixed(1)}°`,
      )

      if (isPortrait) {
        // Portrait mode logic
        if (Math.abs(tiltAngle) > TILT_THRESHOLD) {
          lastActionTime.current = now

          if (tiltAngle < -TILT_THRESHOLD) {
            console.log("Portrait LEFT tilt detected - Correct")
            handleCorrect("tilt left")
            setDebugInfo("Correct ✅")
          } else if (tiltAngle > TILT_THRESHOLD) {
            console.log("Portrait RIGHT tilt detected - Pass")
            handleIncorrect("tilt right")
            setDebugInfo("Pass ❌")
          }
        } else {
          setDebugInfo(`Ready | Portrait tilt: ${tiltAngle.toFixed(1)}°`)
        }
      } else {
        // Landscape mode logic with normalized angles
        const tiltDiff = tiltAngle - LANDSCAPE_NEUTRAL

        if (Math.abs(tiltDiff) > LANDSCAPE_THRESHOLD) {
          lastActionTime.current = now

          if (tiltDiff > LANDSCAPE_THRESHOLD) {
            // Tilted up from neutral (correct)
            console.log("Landscape UP tilt detected - Correct")
            handleCorrect("tilt up")
            setDebugInfo("Correct ✅")
          } else if (tiltDiff < -LANDSCAPE_THRESHOLD) {
            // Tilted down from neutral (pass)
            console.log("Landscape DOWN tilt detected - Pass")
            handleIncorrect("tilt down")
            setDebugInfo("Pass ❌")
          }
        } else {
          setDebugInfo(
            `Ready | Landscape tilt: ${tiltDiff.toFixed(1)}° from neutral`,
          )
        }
      }
    } catch (error) {
      console.error("Orientation error:", error)
      setDebugInfo(`Error: ${error.message}`)
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
    setDebugInfo("Starting game...")

    // Load sounds
    await soundManager.loadSounds()

    try {
      if (!hasOrientationPermission) {
        setDebugInfo("Requesting permission before start...")
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
      setTimeLeft(60)

      // Set up countdown state
      setGameState("countdown")
      setDebugInfo("3...")
      soundManager.play("timerWarning")

      // 3-2-1 countdown
      await new Promise(resolve => setTimeout(resolve, 1000))
      setDebugInfo("2...")
      soundManager.play("timerWarning")

      await new Promise(resolve => setTimeout(resolve, 1000))
      setDebugInfo("1...")
      soundManager.play("timerWarning")

      await new Promise(resolve => setTimeout(resolve, 1000))
      setDebugInfo("GO!")
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
      setDebugInfo(`Error: ${error.message}`)
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

  const handleCorrect = method => {
    console.log(`Correct answer (${method})`)
    if (!gameStateRef.current || gameStateRef.current !== "playing") return

    const wordToStore = currentWordRef.current
    const next = getNextWord()

    soundManager.play("correct")

    if (!next) {
      endGame()
      return
    }

    // Update all states synchronously
    setScore(prev => ({ ...prev, correct: prev.correct + 1 }))
    setWordResults(prev => [...prev, { word: wordToStore, correct: true }])
    setWords(next.remainingWords)
    setCurrentWord(next.nextWord)
    setDebugInfo(`Correct! ${wordToStore}`)
  }

  const handleIncorrect = method => {
    console.log(`Incorrect answer (${method})`)
    if (!gameStateRef.current || gameStateRef.current !== "playing") return

    const wordToStore = currentWordRef.current
    const next = getNextWord()

    soundManager.play("wrong")

    if (!next) {
      endGame()
      return
    }

    // Update all states synchronously
    setScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }))
    setWordResults(prev => [...prev, { word: wordToStore, correct: false }])
    setWords(next.remainingWords)
    setCurrentWord(next.nextWord)
    setDebugInfo(`Pass! ${wordToStore}`)
  }

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
        if (now - lastActionTime.current < ACTION_COOLDOWN) return

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
            <div>Device Type: {motionDebug.deviceType}</div>
            <div>
              Has Motion Events: {motionDebug.hasMotionEvents ? "Yes" : "No"}
            </div>
            <div>Permission State: {motionDebug.permissionState}</div>
            <div>Last Motion: {motionDebug.lastMotionTime || "None"}</div>
            <div className="mt-2">{debugInfo}</div>
          </div>

          {gameState === "category" && (
            <div className="space-y-4">
              <h2 className="mb-4 text-center text-2xl font-bold text-gray-900 dark:text-white">
                Choose a Category
              </h2>
              {!hasOrientationPermission && (
                <button
                  onClick={requestOrientationPermission}
                  className="mb-4 w-full rounded-lg bg-yellow-500 p-3 text-white hover:bg-yellow-600"
                >
                  Enable Tilt Controls (Optional)
                </button>
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
                      key={debugInfo}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="text-6xl font-bold text-blue-600"
                    >
                      {debugInfo}
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
