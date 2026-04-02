import { useState, useEffect } from "react"

const ThemeToggle = ({ className }) => {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const html = document.documentElement
    setIsDark(html.classList.contains("dark"))
  }, [])

  const toggleTheme = () => {
    const html = document.documentElement
    const newIsDark = !isDark
    setIsDark(newIsDark)

    if (newIsDark) {
      html.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      html.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className={`rounded-full bg-gray-200 p-2 text-gray-800 transition-colors duration-200 dark:bg-gray-800 dark:text-gray-200 ${
        className || ""
      }`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? "\u2600\uFE0F" : "\uD83C\uDF19"}
    </button>
  )
}

export default ThemeToggle
