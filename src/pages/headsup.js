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

  // Touch and tilt handling
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const lastActionTime = useRef(0)
  const ACTION_COOLDOWN = 500 // ms between actions

  // Request iOS permission for device orientation
  const requestOrientationPermission = async () => {
    if (
      typeof window !== "undefined" &&
      typeof DeviceOrientationEvent !== "undefined"
    ) {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        try {
          const permission = await DeviceOrientationEvent.requestPermission()
          if (permission === "granted") {
            setHasOrientationPermission(true)
            window.addEventListener(
              "deviceorientation",
              handleOrientation,
              true,
            )
            setDebugInfo("Tilt controls enabled")
          } else {
            setDebugInfo("Tilt permission denied - using swipe controls")
          }
        } catch (error) {
          setDebugInfo("Error requesting permission: " + error.message)
          setNeedsPermission(true)
          console.error(
            "Error requesting device orientation permission:",
            error,
          )
        }
      } else {
        // For non-iOS devices, no permission needed
        setHasOrientationPermission(true)
        window.addEventListener("deviceorientation", handleOrientation, true)
        setDebugInfo("Tilt controls enabled (non-iOS)")
      }
    }
  }

  // Initialize orientation detection
  useEffect(() => {
    requestOrientationPermission()
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("deviceorientation", handleOrientation, true)
      }
    }
  }, [])

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

  // Tilt handling with improved detection
  const handleOrientation = event => {
    if (gameState !== "playing") return

    const now = Date.now()
    if (now - lastActionTime.current < ACTION_COOLDOWN) return

    const gamma = event.gamma // Left-right tilt
    const beta = event.beta // Front-back tilt

    // Update debug info
    setDebugInfo(`Beta: ${beta?.toFixed(1)}°, Gamma: ${gamma?.toFixed(1)}°`)

    // Only process tilt when phone is roughly vertical (in forehead position)
    if (Math.abs(beta) > 45 && Math.abs(beta) < 135) {
      if (Math.abs(gamma) > 30) {
        // Reduced threshold for easier detection
        lastActionTime.current = now
        if (gamma > 0) {
          handleCorrect("tilt right")
        } else {
          handleIncorrect("tilt left")
        }
      }
    }
  }

  const startGame = category => {
    setCurrentCategory(category)
    setWords([...categories[category]])
    setGameState("ready")
  }

  const beginCountdown = () => {
    if (!hasOrientationPermission) {
      requestOrientationPermission()
    }
    setGameState("playing")
    setTimeLeft(60)
    nextWord()
  }

  const nextWord = () => {
    if (words.length > 0) {
      const randomIndex = Math.floor(Math.random() * words.length)
      setCurrentWord(words[randomIndex])
      setWords(words.filter((_, index) => index !== randomIndex))
    } else {
      endGame()
    }
  }

  const handleCorrect = method => {
    setScore(prev => ({ ...prev, correct: prev.correct + 1 }))
    setDebugInfo(`Correct! (${method})`)
    nextWord()
  }

  const handleIncorrect = method => {
    setScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }))
    setDebugInfo(`Pass! (${method})`)
    nextWord()
  }

  const endGame = () => {
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
            Tilt Controls: {hasOrientationPermission ? "Enabled" : "Disabled"}
            <br />
            {debugInfo}
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
              <div className="mb-4 text-6xl font-bold text-blue-600">
                {timeLeft}
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
