/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./**/*.{js,ts,jsx,tsx}"],
  // Safelist for dynamically generated classes in Elite components
  safelist: [
    // Background colors with opacity
    {
      pattern:
        /bg-(blue|emerald|purple|amber|rose|cyan|zinc|orange|indigo|pink|yellow|red|slate)-500\/(10|20|30)/,
    },
    // Border colors with opacity
    {
      pattern:
        /border-(blue|emerald|purple|amber|rose|cyan|zinc|orange|indigo|pink|yellow|red|slate)-500\/(20|30|50)/,
    },
    // Text colors
    {
      pattern:
        /text-(blue|emerald|purple|amber|rose|cyan|zinc|orange|indigo|pink|yellow|red|slate)-(300|400|500)/,
    },
    // Shadow colors for glow effects
    {
      pattern:
        /shadow-(blue|emerald|purple|amber|rose|cyan|zinc|orange|indigo|pink|yellow|red|slate)-500/,
    },
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "#020617",
          900: "#0f172a",
          800: "#1e293b",
        },
        electric: {
          DEFAULT: "#3b82f6",
          glow: "#60a5fa",
        },
        gold: {
          DEFAULT: "#eab308",
        },
        quantum: {
          emerald: "#10b981",
          violet: "#8b5cf6",
          neon: "#1fb6ff",
          obsidian: "#020408",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        outfit: ["Outfit", "sans-serif"],
        space: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
