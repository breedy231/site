/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class", // Enable class-based dark mode
  theme: {
    extend: {},
  },
  plugins: [
    // eslint-disable-next-line no-undef
    require("@tailwindcss/typography"),
  ],
}
