import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"

const categories = {
  animals: [
    "Lion",
    "Elephant",
    "Giraffe",
    "Penguin",
    "Kangaroo",
    "Dolphin",
    "Tiger",
    "Koala",
  ],
  movies: [
    "Star Wars",
    "The Matrix",
    "Jurassic Park",
    "Avatar",
    "Titanic",
    "The Lion King",
  ],
  food: [
    "Pizza",
    "Sushi",
    "Hamburger",
    "Ice Cream",
    "Tacos",
    "Pasta",
    "Chocolate",
  ],
}

const GAME_DURATION = 60 // seconds

const HeadsUpGame = () => {
  const [gameState, setGameState] = useState("idle") // idle, playing, finished
  const [currentWord, setCurrentWord] = useState("")
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [score, setScore] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [deviceOrientation, setDeviceOrientation] = useState(null)

  useEffect(() => {
    if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation)
      return () =>
        window.removeEventListener("deviceorientation", handleOrientation)
    }
  }, [])

  const handleOrientation = event => {
    const beta = event.beta // -180 to 180 (front/back)
    setDeviceOrientation(beta > 45 && beta < 135 ? "up" : "down")
  }

  useEffect(() => {
    let timer
    if (gameState === "playing" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setGameState("finished")
    }
    return () => clearInterval(timer)
  }, [gameState, timeLeft])

  const startGame = category => {
    setSelectedCategory(category)
    setGameState("playing")
    setTimeLeft(GAME_DURATION)
    setScore(0)
    nextWord(category)
  }

  const nextWord = (category = selectedCategory) => {
    const words = categories[category]
    const randomIndex = Math.floor(Math.random() * words.length)
    setCurrentWord(words[randomIndex])
  }

  const handleCorrect = () => {
    setScore(prev => prev + 1)
    nextWord()
  }

  const handlePass = () => {
    nextWord()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 p-4">
      <div className="mx-auto max-w-md">
        {gameState === "idle" && (
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h1 className="mb-6 text-center text-3xl font-bold">Heads Up!</h1>
            <p className="mb-4 text-center text-gray-600">
              Choose a category and hold your phone up to your forehead. Others
              will try to help you guess the word!
            </p>
            <div className="space-y-3">
              {Object.keys(categories).map(category => (
                <button
                  key={category}
                  onClick={() => startGame(category)}
                  className="w-full rounded-lg bg-blue-500 py-3 px-6 capitalize text-white transition-colors hover:bg-blue-600"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState === "playing" && (
          <motion.div
            initial={{ rotateX: 0 }}
            animate={{ rotateX: deviceOrientation === "up" ? 180 : 0 }}
            className="rounded-lg bg-white p-6 text-center shadow-lg"
          >
            <div className="mb-4">
              <div className="mb-2 text-4xl font-bold">{timeLeft}s</div>
              <div className="mb-4 text-6xl font-bold text-blue-600">
                {currentWord}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handlePass}
                className="rounded-lg bg-red-500 py-3 px-6 text-white hover:bg-red-600"
              >
                Pass
              </button>
              <button
                onClick={handleCorrect}
                className="rounded-lg bg-green-500 py-3 px-6 text-white hover:bg-green-600"
              >
                Correct!
              </button>
            </div>
          </motion.div>
        )}

        {gameState === "finished" && (
          <div className="rounded-lg bg-white p-6 text-center shadow-lg">
            <h2 className="mb-4 text-3xl font-bold">Time!</h2>
            <p className="mb-6 text-2xl">Your Score: {score}</p>
            <button
              onClick={() => startGame(selectedCategory)}
              className="w-full rounded-lg bg-blue-500 py-3 px-6 text-white hover:bg-blue-600"
            >
              Play Again
            </button>
            <button
              onClick={() => setGameState("idle")}
              className="mt-3 w-full rounded-lg bg-gray-500 py-3 px-6 text-white hover:bg-gray-600"
            >
              Choose New Category
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default HeadsUpGame
