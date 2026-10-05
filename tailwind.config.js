/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  presets: [require("@relume_io/relume-tailwind")],
  theme: {
    // Override Relume preset container screens — "100%" becomes invalid
    // @media (min-width: 100%) under Vite/lightningcss minify.
    container: {
      center: true,
      screens: {
        sm: "640px",
        md: "768px",
        lg: "992px",
        xl: "1280px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Instrument Serif",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
        mono: [
          "JetBrains Mono",
          "SF Mono",
          "ui-monospace",
          "Menlo",
          "monospace",
        ],
      },
      gradientColorStops: ({ theme }) => theme("colors"),
      fontSize: {
        h1: ["3.75rem", { lineHeight: "1.05", letterSpacing: "-0.035em", fontWeight: "400" }],
        h2: ["2.75rem", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "400" }],
        h3: ["2.125rem", { lineHeight: "1.15", letterSpacing: "-0.025em", fontWeight: "400" }],
        h4: ["1.625rem", { lineHeight: "1.25", letterSpacing: "-0.02em", fontWeight: "500" }],
        h5: ["1.25rem", { lineHeight: "1.35", letterSpacing: "-0.015em", fontWeight: "500" }],
        h6: ["1.0625rem", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "500" }],
        large: ["1.25rem", { lineHeight: "1.55", letterSpacing: "-0.01em" }],
        medium: ["1.125rem", { lineHeight: "1.6", letterSpacing: "-0.011em" }],
        regular: ["1.0625rem", { lineHeight: "1.65", letterSpacing: "-0.01em" }],
        small: ["0.9375rem", { lineHeight: "1.55", letterSpacing: "-0.008em" }],
        tiny: ["0.8125rem", { lineHeight: "1.5", letterSpacing: "0" }],
        micro: ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.06em" }],
      },
      colors: {
        scheme: {
          background: "#000000",
          foreground: "#111113",
          text: "#f5f5f7",
          border: "rgba(255, 255, 255, 0.08)",
          "btn-text": "#000000",
        },
        ink: {
          DEFAULT: "#000000",
          soft: "#111113",
          raised: "#1c1c1e",
          line: "rgba(255, 255, 255, 0.08)",
          mute: "#86868b",
          faint: "#6e6e73",
        },
        mist: {
          DEFAULT: "#f5f5f7",
          dim: "#a1a1a6",
        },
        accent: {
          DEFAULT: "#2997ff",
          soft: "rgba(41, 151, 255, 0.12)",
          muted: "rgba(41, 151, 255, 0.55)",
        },
      },
      borderRadius: {
        button: "980px",
        card: "1.25rem",
        image: "1rem",
        form: "0.75rem",
        badge: "9999px",
        checkbox: "0.25rem",
        carousel: "1rem",
        dropdown: "0.75rem",
      },
      boxShadow: {
        soft: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.35)",
        lift: "0 12px 40px rgba(0,0,0,0.45)",
        hairline: "0 0 0 1px rgba(255,255,255,0.08)",
      },
      maxWidth: {
        prose: "40rem",
        content: "68rem",
        narrow: "42rem",
      },
      transitionDuration: {
        calm: "250ms",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
};
