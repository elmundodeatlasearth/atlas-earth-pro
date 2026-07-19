/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface-container": "rgba(31, 31, 31, 0.4)",
        "inverse-on-surface": "#303030",
        "surface": "rgba(19, 19, 19, 0.3)",
        "surface-bright": "rgba(57, 57, 57, 0.4)",
        "tertiary": "#ffffff",
        "primary": "#4ade80",
        "on-primary": "#000000",
        "gold": "#facc15",
        "cyan": "#00dddd"
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
