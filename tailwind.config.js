/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "rgb(79, 70, 229)",
          foreground: "rgb(248, 250, 252)",
        }
      }
    },
  },
  plugins: [],
}

