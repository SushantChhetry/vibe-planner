import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        /** Drop-in with light overshoot + settle (GPU-friendly: transform + opacity only) */
        "canvas-block-place": {
          "0%": {
            opacity: "0",
            transform: "translateY(22px) scale(0.9) rotate(-1deg)",
          },
          "52%": {
            opacity: "1",
            transform: "translateY(-5px) scale(1.04) rotate(0.6deg)",
          },
          "78%": {
            transform: "translateY(2px) scale(0.99) rotate(-0.15deg)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1) rotate(0deg)",
          },
        },
      },
      animation: {
        "canvas-block-place":
          "canvas-block-place 0.72s cubic-bezier(0.33, 1, 0.53, 1) both",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        canvas: "var(--canvas)",
      },
    },
  },
  plugins: [typography],
};
export default config;
