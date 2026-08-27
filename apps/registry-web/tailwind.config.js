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
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        surface: {
          bg: "#F8FBFF",
          card: "#FFFFFF",
          sidebar: "#FFFFFF",
          sidebarMuted: "#F1F5F9",
          sidebarBorder: "#E2E8F0",
          border: "#E2E8F0",
          hover: "#F8FAFC"
        },
        command: {
          dark: "#0F172A",
          surface: "#FFFFFF",
          panel: "#FFFFFF",
          border: "#E2E8F0",
          accent: "#2563EB",
          gold: "#F59E0B",
          emerald: "#10B981",
          rose: "#EF4444",
          text: "#0F172A",
          muted: "#64748B"
        }
      },
      boxShadow: {
        'saasable': '0 2px 12px -2px rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.02)',
        'saasable-hover': '0 12px 28px -4px rgba(37, 99, 235, 0.1), 0 4px 8px -2px rgba(15, 23, 42, 0.03)',
        'card-glow': '0 0 20px -5px rgba(37, 99, 235, 0.12)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    },
  },
  plugins: [],
}
