/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#001f3f',
        cyan: {
          DEFAULT: '#0EA5E9',
          ...colors.cyan
        },
        purple: {
          DEFAULT: '#A855F7',
          ...colors.purple
        },
      },
      backgroundColor: {
        gradient: 'linear-gradient(135deg, #001f3f 0%, #0EA5E9 100%)',
      }
    },
  },
  plugins: [],
}
