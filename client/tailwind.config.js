/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // "Professional / light" palette: neutral slate-grays for text and
        // dark accents instead of a blue-tinted navy, a clean corporate blue
        // for the brand accent, a softer near-white canvas, and slightly
        // muted (less neon) semantic colors for success/danger/warning.
        navy: {
          950: "#0B1220",
          900: "#111827",
          800: "#1F2937",
          700: "#374151",
          600: "#4B5563",
        },
        brand: {
          DEFAULT: "#2563EB",
          light: "#3B82F6",
          dark: "#1D4ED8",
          50: "#EFF6FF",
          100: "#DBEAFE",
        },
        canvas: "#F8FAFC",
        success: "#16A34A",
        danger: "#DC2626",
        warning: "#D97706",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 55, 0.04), 0 8px 24px -8px rgba(16, 24, 55, 0.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
