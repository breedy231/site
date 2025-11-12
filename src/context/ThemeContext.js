import React, { createContext, useState, useEffect } from "react"
import PropTypes from "prop-types"

export const ThemeContext = createContext({
  isDark: true,
  toggleTheme: () => {},
})

export const ThemeProvider = ({ children }) => {
  // Check if we're in the browser and if there's a saved preference
  const [isDark, setIsDark] = useState(true)

  // Initialize theme from localStorage or system preference on client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme")
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches

      if (savedTheme === "light") {
        setIsDark(false)
      } else if (savedTheme === "dark") {
        setIsDark(true)
      } else {
        // No saved preference - use system preference
        setIsDark(prefersDark)
      }
    }
  }, [])

  // Update the HTML class when theme changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const html = document.querySelector("html")
      if (isDark) {
        html.classList.add("dark")
        localStorage.setItem("theme", "dark")
      } else {
        html.classList.remove("dark")
        localStorage.setItem("theme", "light")
      }
    }
  }, [isDark])

  const toggleTheme = () => {
    setIsDark(!isDark)
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
