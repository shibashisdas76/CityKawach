/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        command: {
          dark: "#0B192C",
          surface: "#1E3E62",
          panel: "#162B48",
          border: "#2A4E78",
          accent: "#00F2FE",
          gold: "#F59E0B",
          emerald: "#10B981",
          rose: "#F43F5E",
          text: "#F8FAFC",
          muted: "#94A3B8"
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [],
}
