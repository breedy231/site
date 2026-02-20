// src/pages/kindle-diagnostic.js
import React from "react"
import { Helmet } from "react-helmet"

const KindleDiagnostic = () => {
  const width = 608 // Reported width from your screen analyzer
  const height = 800

  // Generate vertical rulers at 50px intervals
  const verticalRulers = []
  for (let x = 0; x <= width; x += 50) {
    verticalRulers.push(
      <div
        key={`vr-${x}`}
        style={{
          position: "absolute",
          left: `${x}px`,
          top: 0,
          width: "1px",
          height: "100%",
          backgroundColor: "black",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "5px",
            left: "-10px",
            width: "20px",
            fontSize: "10px",
            textAlign: "center",
          }}
        >
          {x}
        </div>
        <div
          style={{
            position: "absolute",
            top: "25px",
            left: "-10px",
            width: "20px",
            fontSize: "10px",
            textAlign: "center",
          }}
        >
          |
        </div>
      </div>,
    )
  }

  // Generate boxes at the right edge to test boundaries
  const testBoxes = []
  for (let i = 0; i < 10; i++) {
    testBoxes.push(
      <div
        key={`box-${i}`}
        style={{
          position: "absolute",
          right: `${i * 10}px`,
          top: 50 + i * 50,
          width: "100px",
          height: "40px",
          backgroundColor: "white",
          border: "1px solid black",
          fontSize: "10px",
          padding: "2px",
          boxSizing: "border-box",
        }}
      >
        {`Right: ${i * 10}px`}
      </div>,
    )
  }

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: "white",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Helmet>
        <title>Kindle Screen Diagnostic</title>
      </Helmet>

      <div
        style={{
          position: "absolute",
          top: "2px",
          left: "2px",
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        Screen Diagnostic (0,0)
      </div>

      <div
        style={{
          position: "absolute",
          top: "2px",
          right: "2px",
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        Right ({width},0)
      </div>

      {/* Vertical rulers */}
      {verticalRulers}

      {/* Test boxes at right edge */}
      {testBoxes}

      {/* Center marker */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "20px",
          height: "20px",
          marginLeft: "-10px",
          marginTop: "-10px",
          backgroundColor: "black",
          borderRadius: "10px",
        }}
      />

      {/* Bottom right corner marker */}
      <div
        style={{
          position: "absolute",
          right: "0",
          bottom: "0",
          width: "50px",
          height: "20px",
          fontSize: "10px",
          textAlign: "right",
          paddingRight: "2px",
        }}
      >
        ({width},{height})
      </div>
    </div>
  )
}

export default KindleDiagnostic
