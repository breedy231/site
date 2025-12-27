import React, { useState, useEffect, useContext } from "react"
import { ThemeContext } from "../context/ThemeContext"

/**
 * Visual debugging overlay for mobile responsive testing
 * Shows:
 * - Viewport dimensions
 * - Active breakpoint
 * - Theme mode
 * - Media query status
 *
 * Usage: Add to layout.js with ?debug query parameter
 * Example: http://localhost:8000?debug
 */
const DebugOverlay = () => {
  const [viewport, setViewport] = useState({ width: 0, height: 0 })
  const [breakpoint, setBreakpoint] = useState("")
  const { isDark } = useContext(ThemeContext)

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })

      // Detect breakpoint
      if (window.matchMedia("(max-width: 599px)").matches) {
        setBreakpoint("SMALL (<600px)")
      } else if (
        window.matchMedia("(min-width: 600px) and (max-width: 1199px)").matches
      ) {
        setBreakpoint("MEDIUM (600-1199px)")
      } else {
        setBreakpoint("LARGE (≥1200px)")
      }
    }

    updateViewport()
    window.addEventListener("resize", updateViewport)
    window.addEventListener("orientationchange", updateViewport)

    return () => {
      window.removeEventListener("resize", updateViewport)
      window.removeEventListener("orientationchange", updateViewport)
    }
  }, [])

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        background: "rgba(255, 0, 0, 0.9)",
        color: "white",
        padding: "8px",
        fontSize: "12px",
        fontFamily: "monospace",
        zIndex: 9999,
        borderBottom: "3px solid yellow",
        lineHeight: "1.4",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
        🐛 DEBUG MODE
      </div>
      <div>
        <strong>Viewport:</strong> {viewport.width}px × {viewport.height}px
      </div>
      <div>
        <strong>Breakpoint:</strong> {breakpoint}
      </div>
      <div>
        <strong>Theme:</strong> {isDark ? "DARK 🌙" : "LIGHT ☀️"}
      </div>
      <div>
        <strong>User Agent:</strong>{" "}
        {typeof window !== "undefined"
          ? window.navigator.userAgent.includes("iPhone")
            ? "iPhone ✅"
            : "Other"
          : "SSR"}
      </div>
      <div style={{ marginTop: "4px", fontSize: "10px", opacity: 0.8 }}>
        Remove ?debug from URL to hide
      </div>
    </div>
  )
}

export default DebugOverlay
