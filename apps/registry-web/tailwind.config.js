/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saasable: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },
        surface: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          sidebar: "#0F172A",
          sidebarMuted: "#1E293B",
          sidebarBorder: "#334155",
          border: "#E2E8F0",
          hover: "#F1F5F9"
        },
        command: {
          dark: "#0F172A",
          surface: "#1E293B",
          panel: "#1E293B",
          border: "#334155",
          accent: "#38BDF8",
          gold: "#F59E0B",
          emerald: "#10B981",
          rose: "#F43F5E",
          text: "#F8FAFC",
          muted: "#94A3B8"
        }
      },
      boxShadow: {
        'saasable': '0 2px 12px -2px rgba(15, 23, 42, 0.06), 0 1px 3px 0 rgba(15, 23, 42, 0.04)',
        'saasable-hover': '0 10px 25px -5px rgba(79, 70, 229, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        'card-glow': '0 0 20px -5px rgba(99, 102, 241, 0.15)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    },
  },
  plugins: [],
}
