/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        craft: {
          orange: '#D9662C',
          gold: '#C99A2E',
          cream: '#FBF3E7'
        },
        tech: {
          teal: '#0F6E6A',
          blue: '#125E62'
        }
      },
      fontFamily: {
        display: ['"Poppins"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif']
      }
    },
  },
  plugins: [],
}
