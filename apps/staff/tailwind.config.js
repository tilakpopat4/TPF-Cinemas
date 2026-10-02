/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0A0A0B',
        graphite: '#1A1A1D',
        ivory: '#F2EEE6',
        signature: '#FF9F1C',
        muted: '#8E8E93',
        hairline: 'rgba(242, 238, 230, 0.12)',
        background: '#08090c',
        surface: {
          50: '#1e2430',
          100: '#161a23',
          200: '#10141c',
          300: '#0d1017',
          DEFAULT: '#0d1017',
        },
        cinema: {
          gold: '#FF9F1C',
          amber: '#f59e0b',
          red: '#e50914',
          crimson: '#dc2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Bebas Neue"', 'Outfit', 'sans-serif'],
        editorial: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
