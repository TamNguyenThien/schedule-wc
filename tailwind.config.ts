import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    fontSize: {
      xs: ["14px", { lineHeight: "20px" }],
      sm: ["14px", { lineHeight: "20px" }],
      base: ["14px", { lineHeight: "22px" }],
      lg: ["16px", { lineHeight: "24px" }],
      xl: ["18px", { lineHeight: "26px" }],
      "2xl": ["22px", { lineHeight: "30px" }],
      "3xl": ["28px", { lineHeight: "34px" }],
      "4xl": ["34px", { lineHeight: "38px" }],
      "5xl": ["46px", { lineHeight: "1" }],
      "6xl": ["58px", { lineHeight: "1" }],
      "7xl": ["70px", { lineHeight: "1" }],
      "8xl": ["94px", { lineHeight: "1" }],
      "9xl": ["126px", { lineHeight: "1" }]
    },
    extend: {
      boxShadow: {
        glow: "0 8px 24px rgba(245, 184, 62, 0.14)",
        glass: "0 8px 26px rgba(2, 20, 34, 0.16)"
      },
      colors: {
        trophy: {
          50: "#fff8dc",
          100: "#ffefad",
          300: "#ffd25e",
          500: "#f5b83e",
          700: "#b97813"
        }
      }
    }
  },
  plugins: []
};

export default config;
