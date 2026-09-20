/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        surface: "#0a0a0a",
        surfaceLight: "#141414",
        accent: "#3b82f6",
        accentGlow: "#60a5fa",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Outfit", "Inter", "system-ui", "sans-serif"],
        mono: ["Fira Code", "JetBrains Mono", "Cascadia Code", "SF Mono", "Menlo", "Monaco", "Consolas", "Liberation Mono", "DejaVu Sans Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
