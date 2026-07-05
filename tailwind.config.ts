import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fef7ee",
          100: "#fdecd3",
          200: "#fad5a5",
          300: "#f7b76d",
          400: "#f39032",
          500: "#f0730f",
          600: "#e1590a",
          700: "#bb420b",
          800: "#953510",
          900: "#782d10",
        },
      },
    },
  },
  plugins: [],
};

export default config;
