import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        pulse2: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.06)" },
        },
      },
      animation: {
        breathe: "breathe var(--effect-duration, 6s) ease-in-out infinite",
        pulse2: "pulse2 var(--effect-duration, 2s) ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
