import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        navy: { DEFAULT: "#0b1f3a", 50: "#f1f4f9", 100: "#dde5f0", 200: "#b6c5db", 300: "#8aa0c0", 400: "#4f6a93", 500: "#2a4570", 600: "#1a3258", 700: "#112849", 800: "#0b1f3a", 900: "#071528" },
        gold: { DEFAULT: "#c9a24b", 50: "#fbf7ec", 100: "#f4ead0", 200: "#e8d4a0", 300: "#dcbd70", 400: "#d1ab55", 500: "#c9a24b", 600: "#a98235", 700: "#86642b" },
        ivory: "#faf7f0",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,31,58,.04), 0 8px 24px -8px rgba(11,31,58,.12)",
        lift: "0 2px 4px rgba(11,31,58,.06), 0 20px 40px -12px rgba(11,31,58,.25)",
      },
      borderRadius: { xl: "0.9rem", "2xl": "1.25rem", "3xl": "1.75rem" },
    },
  },
  plugins: [animate],
};
export default config;
