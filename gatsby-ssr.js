import * as React from "react"
import { ThemeProvider } from "./src/context/ThemeContext"

export const wrapRootElement = ({ element }) => {
  return <ThemeProvider>{element}</ThemeProvider>
}

export const onRenderBody = ({ setHeadComponents }) => {
  setHeadComponents([
    <link
      rel="preload"
      href="/fonts/Poppins-Bold.ttf"
      as="font"
      type="font/ttf"
      crossOrigin="anonymous"
      key="interFont"
    />,
    <link
      rel="preload"
      href="/fonts/Poppins-Regular.ttf"
      as="font"
      type="font/ttf"
      crossOrigin="anonymous"
      key="interFont"
    />,
  ])
}
