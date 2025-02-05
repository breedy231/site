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

  useEffect(() => {
    // Request permission for device orientation on iOS
    if (typeof window !== "undefined") {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
      ) {
        DeviceOrientationEvent.requestPermission()
          .then(response => {
            if (response === "granted") {
              window.addEventListener("deviceorientation", handleOrientation)
            }
          })
          .catch(console.error)
      } else {
        window.addEventListener("deviceorientation", handleOrientation)
      }

      return () => {
        window.removeEventListener("deviceorientation", handleOrientation)
      }
    }
  }, [])

  const handleOrientation = event => {
    if (gameState === "playing") {
      const gamma = event.gamma // Rotation around front-to-back axis (-90 to 90)
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
