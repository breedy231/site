import React from "react"
import "./layout.sass"

export default function Layout({ children }) {
  return (
    <html lang="en">
       <head>
          <title>Brendan Reed</title>
        </head>
        <div style={{ margin: `0 auto`, padding: `0 1rem` }}>
            {children}
        </div>
    </html>
  )
}