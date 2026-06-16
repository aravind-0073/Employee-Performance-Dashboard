/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#001f3f',
        cyan: '#0EA5E9',
        purple: '#A855F7',
      },
      backgroundColor: {
        gradient: 'linear-gradient(135deg, #001f3f 0%, #0EA5E9 100%)',
      }
    },
  },
  plugins: [],
}
