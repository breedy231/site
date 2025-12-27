import * as React from "react"
import { ThemeProvider } from "./src/context/ThemeContext"

export const wrapRootElement = ({ element }) => {
  return <ThemeProvider>{element}</ThemeProvider>
}

export const onRenderBody = ({ setHeadComponents, setPreBodyComponents }) => {
  // Preload fonts
  setHeadComponents([
    <link
      rel="preload"
      href="/fonts/Poppins-Bold.ttf"
      as="font"
      type="font/ttf"
      crossOrigin="anonymous"
      key="poppinsBold"
    />,
    <link
      rel="preload"
      href="/fonts/Poppins-Regular.ttf"
      as="font"
      type="font/ttf"
      crossOrigin="anonymous"
      key="poppinsRegular"
    />,
  ])

  // Add dark mode script that runs before React hydration
  // This prevents flash of wrong theme on page load
  setPreBodyComponents([
    <script
      key="theme-hydration"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              const theme = localStorage.getItem('theme');
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              const isDark = theme === 'dark' || (!theme && prefersDark);

              if (isDark) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (e) {
              // If localStorage is unavailable, default to dark mode
              document.documentElement.classList.add('dark');
            }
          })();
        `,
      }}
    />,
  ])
}
