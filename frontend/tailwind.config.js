/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EAF6EF",
          100: "#D3EEDD",
          200: "#A8DCBC",
          500: "#16A061",
          600: "#0F8A52",
          700: "#0B6E41",
          800: "#0A5434",
          900: "#083D27",
        },
        ink: { DEFAULT: "#111827", soft: "#374151", muted: "#6B7280", faint: "#9CA3AF" },
        line: "#E7E9E4",
        canvas: "#F6F7F4",
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,24,39,0.04), 0 1px 1px rgba(17,24,39,0.03)",
        nav: "0 -4px 16px rgba(17,24,39,0.06)",
        fab: "0 8px 20px rgba(11,110,65,0.35)",
      },
      keyframes: {
        pulseRing: { "0%": { transform: "scale(0.9)", opacity: "0.6" }, "100%": { transform: "scale(1.35)", opacity: "0" } },
        wave: { "0%,100%": { transform: "scaleY(0.35)" }, "50%": { transform: "scaleY(1)" } },
        fadeUp: { "0%": { opacity: "0", transform: "translateY(6px)" }, "100%": { opacity: "1", transform: "none" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
      animation: {
        pulseRing: "pulseRing 1.6s ease-out infinite",
        wave: "wave 1s ease-in-out infinite",
        fadeUp: "fadeUp 180ms ease-out both",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};
