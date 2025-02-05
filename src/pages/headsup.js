import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Layout from "../components/layout"
import { categories } from "../data/headsupCategories"
import { Helmet } from "react-helmet"
import "../styles/global.css"

const HeadsUpGame = () => {
  const [gameState, setGameState] = useState("category") // category, ready, playing, finished
  const [currentCategory, setCurrentCategory] = useState(null)
  const [currentWord, setCurrentWord] = useState("")
  const [score, setScore] = useState({ correct: 0, incorrect: 0 })
  const [timeLeft, setTimeLeft] = useState(60)
  const [words, setWords] = useState([])
  const [orientationPermission, setOrientationPermission] = useState("unknown")
  const [debugInfo, setDebugInfo] = useState("")
  const [needsPermission, setNeedsPermission] = useState(false)

  // Function to check if device orientation permission is needed
  const checkOrientationPermission = () => {
    if (
      typeof window !== "undefined" &&
      typeof DeviceOrientationEvent !== "undefined"
    ) {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        setNeedsPermission(true)
        setDebugInfo("Permission needed for iOS device")
        return true
      }
    }
    return false
  }

  // Function to request device orientation permission
  const requestOrientationPermission = async () => {
    if (
      typeof window !== "undefined" &&
      typeof DeviceOrientationEvent !== "undefined"
    ) {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        try {
          const permission = await DeviceOrientationEvent.requestPermission()
          setOrientationPermission(permission)
          if (permission === "granted") {
            window.addEventListener("deviceorientation", handleOrientation)
            setDebugInfo("Permission granted, orientation listener added")
            setNeedsPermission(false)
          } else {
            setDebugInfo("Permission denied: " + permission)
            setNeedsPermission(true)
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
        // For non-iOS devices
        window.addEventListener("deviceorientation", handleOrientation)
        setOrientationPermission("not-required")
        setDebugInfo("Permission not required, orientation listener added")
        setNeedsPermission(false)
      }
    } else {
      setDebugInfo("DeviceOrientation not supported")
      setNeedsPermission(false)
    }
  }

  useEffect(() => {
    if (!checkOrientationPermission()) {
      requestOrientationPermission()
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("deviceorientation", handleOrientation)
      }
    }
  }, [])

  const handleOrientation = event => {
    if (gameState === "playing") {
      const gamma = event.gamma // Rotation around front-to-back axis (-90 to 90)
      setDebugInfo(`Gamma: ${gamma?.toFixed(2)}`)

      if (gamma > 45) {
        // Phone tilted right (correct)
        handleCorrect()
      } else if (gamma < -45) {
        // Phone tilted left (pass/incorrect)
        handleIncorrect()
      }
    }
  }

  const startGame = category => {
    setCurrentCategory(category)
    setWords([...categories[category]])
    setGameState("ready")
  }

  const beginCountdown = () => {
    // Request permission again when starting the game if needed
    if (orientationPermission !== "granted" && needsPermission) {
      requestOrientationPermission()
      return
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

  const handleCorrect = () => {
    setScore(prev => ({ ...prev, correct: prev.correct + 1 }))
    nextWord()
  }

  const handleIncorrect = () => {
    setScore(prev => ({ ...prev, incorrect: prev.incorrect + 1 }))
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
        if (event.key === "ArrowRight") {
          handleCorrect()
        } else if (event.key === "ArrowLeft") {
          handleIncorrect()
        }
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyPress)
      return () => window.removeEventListener("keydown", handleKeyPress)
    }
  }, [gameState])

  // Permission Request Banner Component
  const PermissionBanner = () => (
    <div className="mb-4 border-l-4 border-yellow-500 bg-yellow-100 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            This game requires motion sensor access to work properly.
          </p>
          <button
            onClick={requestOrientationPermission}
            className="mt-2 rounded-md bg-yellow-500 px-4 py-2 text-white transition-colors hover:bg-yellow-600"
          >
            Enable Motion Sensors
          </button>
        </div>
      </div>
    </div>
  )

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
          content="Play Heads Up! - a fun word guessing game. Tilt your device to play!"
        />
        <meta name="theme-color" content="#3B82F6" />
      </Helmet>

      <div className="min-h-screen bg-gray-100 p-4">
        <div className="mx-auto max-w-md">
          <h1 className="mb-8 text-center text-4xl font-bold">Heads Up!</h1>

          {/* Debug info - only show in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="mb-4 text-center text-xs text-gray-500">
              Permission: {orientationPermission}
              <br />
              {debugInfo}
            </div>
          )}

          {/* Permission Banner */}
          {needsPermission && <PermissionBanner />}

          {gameState === "category" && (
            <div className="space-y-4">
              <h2 className="mb-4 text-center text-2xl font-bold">
                Choose a Category
              </h2>
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
                  2. Tilt right for correct ✅
                </p>
                <p className="mb-4 text-gray-600">3. Tilt left for pass ❌</p>
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
