/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#08090c',
        surface: {
          50: '#1e2430',
          100: '#161a23',
          200: '#10141c',
          300: '#0d1017',
          DEFAULT: '#0d1017',
        },
        cinema: {
          gold: '#e5a93c',
          amber: '#f59e0b',
          red: '#e50914',
          crimson: '#dc2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
