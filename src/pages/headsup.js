import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Layout from "../components/layout"
import { categories } from "../data/headsupCategories"
import { Helmet } from "react-helmet"
import "../styles/global.css"

const HeadsUpGame = () => {
  const [gameState, setGameState] = useState("category")
  const [currentCategory, setCurrentCategory] = useState(null)
  const [currentWord, setCurrentWord] = useState("")
  const [score, setScore] = useState({ correct: 0, incorrect: 0 })
  const [timeLeft, setTimeLeft] = useState(60)
  const [words, setWords] = useState([])
  const [debugInfo, setDebugInfo] = useState("")
  const [showDebug, setShowDebug] = useState(true)
  const [hasOrientationPermission, setHasOrientationPermission] =
    useState(false)

  // Add gameStateRef at the top with other refs
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const lastActionTime = useRef(0)
  const gameStateRef = useRef("category")
  // const ACTION_COOLDOWN = 500 // ms between actions

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
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = e => {
    if (!touchStartX.current || !touchStartY.current || gameState !== "playing")
      return

    const now = Date.now()
    if (now - lastActionTime.current < ACTION_COOLDOWN) return

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY

    const deltaX = touchEndX - touchStartX.current
    const deltaY = touchEndY - touchStartY.current

    // Only trigger if the swipe is mostly horizontal
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      lastActionTime.current = now
      if (deltaX > 0) {
        handleCorrect("swipe right")
      } else {
        handleIncorrect("swipe left")
      }
    }

    touchStartX.current = null
    touchStartY.current = null
  }

  // Add effect to keep gameStateRef in sync
  useEffect(() => {
    gameStateRef.current = gameState
    console.log("Game state updated:", gameState)
  }, [gameState])

  // Constants with tightened landscape thresholds
  const ACTION_COOLDOWN = 600 // Cooldown between actions
  const TILT_THRESHOLD = 25 // Base threshold for portrait mode
  const VERTICAL_TOLERANCE = 60 // Vertical tolerance
  const LANDSCAPE_NEUTRAL = 90 // Neutral position in landscape
  const LANDSCAPE_THRESHOLD = 20 // Smaller threshold for landscape mode

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

          if (tiltAngle > TILT_THRESHOLD) {
            console.log("Portrait RIGHT tilt detected - Correct")
            handleCorrect("tilt right")
            setDebugInfo("Correct ✅")
          } else if (tiltAngle < -TILT_THRESHOLD) {
            console.log("Portrait LEFT tilt detected - Pass")
            handleIncorrect("tilt left")
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

          if (tiltDiff < -LANDSCAPE_THRESHOLD) {
            // Tilted down from neutral (correct)
            console.log("Landscape DOWN tilt detected - Correct")
            handleCorrect("tilt down")
            setDebugInfo("Correct ✅")
          } else if (tiltDiff > LANDSCAPE_THRESHOLD) {
            // Tilted up from neutral (pass)
            console.log("Landscape UP tilt detected - Pass")
            handleIncorrect("tilt up")
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
    setGameState("ready")
  }

  const beginCountdown = async () => {
    console.log("Beginning countdown")
    setDebugInfo("Starting game...")

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
      setCurrentWord(firstWord)
      setWords(remainingWords)
      setTimeLeft(60)
      setGameState("playing")

      console.log(`Game started with ${remainingWords.length + 1} words`)
    } catch (error) {
      console.error("Error starting game:", error)
      setDebugInfo(`Error: ${error.message}`)
    }
  }

  const nextWord = () => {
    console.log(`nextWord called - current game state: ${gameStateRef.current}`)
    if (gameStateRef.current !== "playing") {
      console.log("nextWord called but not in playing state")
      return
    }

    // Guard against empty word list
    if (!words || words.length === 0) {
      console.log("No more words available")
      return // Don't end game here, let the timer handle it
    }

    try {
      // Get next word
      const randomIndex = Math.floor(Math.random() * words.length)
      const nextWord = words[randomIndex]
      const remainingWords = words.filter((_, index) => index !== randomIndex)

      console.log(
        `Setting next word: ${nextWord} (${remainingWords.length} words remaining)`,
      )

      // Update state
      setCurrentWord(nextWord)
      setWords(remainingWords)
    } catch (error) {
      console.error("Error in nextWord:", error)
      setDebugInfo(`Error getting next word: ${error.message}`)
    }
  }

  const handleCorrect = method => {
    if (!gameStateRef.current || gameStateRef.current !== "playing") {
      console.log(
        `Ignoring correct action - invalid game state: ${gameStateRef.current}`,
      )
      return
    }

    try {
      console.log(`Processing correct action (${method})`)

      // Update score
      setScore(prev => ({
        ...prev,
        correct: prev.correct + 1,
      }))

      // Get next word after a short delay
      setTimeout(() => {
        if (gameStateRef.current === "playing") {
          nextWord()
        }
      }, 100)
    } catch (error) {
      console.error("Error in handleCorrect:", error)
      setDebugInfo(`Error processing correct action: ${error.message}`)
    }
  }

  const handleIncorrect = method => {
    if (!gameStateRef.current || gameStateRef.current !== "playing") {
      console.log(
        `Ignoring incorrect action - invalid game state: ${gameStateRef.current}`,
      )
      return
    }

    try {
      console.log(`Processing incorrect action (${method})`)

      // Update score
      setScore(prev => ({
        ...prev,
        incorrect: prev.incorrect + 1,
      }))

      // Get next word after a short delay
      setTimeout(() => {
        if (gameStateRef.current === "playing") {
          nextWord()
        }
      }, 100)
    } catch (error) {
      console.error("Error in handleIncorrect:", error)
      setDebugInfo(`Error processing incorrect action: ${error.message}`)
    }
  }

  const endGame = () => {
    console.log("Ending game - final scores:", score)
    // Cleanup motion listener before ending
    if (typeof window !== "undefined") {
      window.removeEventListener("deviceorientation", handleOrientation, true)
    }
    setGameState("finished")
  }

  useEffect(() => {
    let timer
    if (gameState === "playing" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [gameState, timeLeft])

  // Add keyboard controls for desktop testing
  useEffect(() => {
    const handleKeyPress = event => {
      if (gameState === "playing") {
        const now = Date.now()
        if (now - lastActionTime.current < ACTION_COOLDOWN) return

        lastActionTime.current = now
        if (event.key === "ArrowRight") {
          handleCorrect("keyboard right")
        } else if (event.key === "ArrowLeft") {
          handleIncorrect("keyboard left")
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
        className="min-h-screen bg-gray-100 p-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mx-auto max-w-md">
          <h1 className="mb-8 text-center text-4xl font-bold">Heads Up!</h1>

          {/* Debug Toggle Button */}
          <button
            onClick={() => setShowDebug(prev => !prev)}
            className="fixed top-4 right-4 rounded-full bg-gray-200 p-2 text-xs"
          >
            {showDebug ? "Hide Debug" : "Show Debug"}
          </button>

          {/* Debug Info */}
          <div
            className={`mb-4 text-center text-xs text-gray-500 ${
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
              <h2 className="mb-4 text-center text-2xl font-bold">
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

          {gameState === "ready" && (
            <div className="space-y-6 text-center">
              <h2 className="text-2xl font-bold">Get Ready!</h2>
              <div className="rounded-lg bg-white p-6 shadow-lg">
                <p className="mb-4 text-gray-600">
                  1. Hold your phone up to your forehead
                </p>
                <p className="mb-4 text-gray-600">
                  2. {hasOrientationPermission ? "Tilt or swipe" : "Swipe"}{" "}
                  right for correct ✅
                </p>
                <p className="mb-4 text-gray-600">
                  3. {hasOrientationPermission ? "Tilt or swipe" : "Swipe"} left
                  for pass ❌
                </p>
                <p className="text-sm text-gray-600">
                  (On desktop: use left/right arrow keys)
                </p>
              </div>
              <button
                onClick={beginCountdown}
                className="w-full transform rounded-lg bg-green-500 p-4 text-xl text-white shadow transition-colors hover:scale-105 hover:bg-green-600"
              >
                Start Game
              </button>
            </div>
          )}

          {gameState === "playing" && (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold text-blue-600">
                  {timeLeft}s
                </div>
                <div className="text-sm text-gray-500">
                  Words: {words.length + 1}
                </div>
              </div>
              <motion.div
                key={currentWord}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-white p-8 text-4xl font-bold shadow-lg"
                style={{
                  minHeight: "200px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {currentWord}
              </motion.div>
              <div className="mt-4 flex justify-between text-xl">
                <div className="text-green-600">✅ {score.correct}</div>
                <div className="text-red-600">❌ {score.incorrect}</div>
              </div>
            </div>
          )}

          {gameState === "finished" && (
            <div className="space-y-6 text-center">
              <h2 className="mb-4 text-3xl font-bold">Game Over!</h2>
              <div className="rounded-lg bg-white p-6 shadow-lg">
                <div className="space-y-2 text-xl">
                  <p className="text-green-600">Correct: {score.correct}</p>
                  <p className="text-red-600">Incorrect: {score.incorrect}</p>
                  <p className="mt-4 text-2xl font-bold">
                    Total Score: {score.correct - score.incorrect}
                  </p>
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
