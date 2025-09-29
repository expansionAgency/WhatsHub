/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          500: "#25D366",
          600: "#1ebe57",
          700: "#18a34b"
        }
      }
    }
  },
  darkMode: "class"
};


