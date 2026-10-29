import tailwindAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // Use class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,json}",
    "./src/pages/static-pages/configs/**/*.ts",
  ],
  plugins: [tailwindAnimate],
};
