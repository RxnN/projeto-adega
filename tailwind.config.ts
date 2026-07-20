import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vinho: {
          50: "#fdf2f4",
          100: "#fbe6ea",
          200: "#f4c1cb",
          300: "#e8909f",
          400: "#d65a72",
          500: "#b8324f",
          600: "#8f1f3a",
          700: "#6f1830",
          800: "#5a1428",
          900: "#4b1223",
        },
      },
    },
  },
  plugins: [],
};
export default config;
