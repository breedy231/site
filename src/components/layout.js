import React from "react"
import "./layout.css"

import Header from "./header"

export default function Layout({ children }) {
  return (
    <html lang="en">
       <head>
          <title>Brendan Reed</title>
        </head>
      <body>
          <div style={{ margin: `0 auto`, maxWidth: 650, padding: `0 1rem` }}>
              <Header/>
              {children}
          </div>
      </body>
    </html>
  )
}