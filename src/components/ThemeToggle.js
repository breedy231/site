import React, { useContext } from "react"
import PropTypes from "prop-types"
import { ThemeContext } from "../context/ThemeContext"

const ThemeToggle = ({ className }) => {
  const { isDark, toggleTheme } = useContext(ThemeContext)

  return (
    <button
      onClick={toggleTheme}
      className={`rounded-full bg-gray-200 p-2 text-gray-800 transition-colors duration-200 dark:bg-gray-800 dark:text-gray-200 ${
        className || ""
      }`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? "☀️" : "🌙"}
    </button>
  )
}

ThemeToggle.propTypes = {
  className: PropTypes.string,
}

export default ThemeToggle
