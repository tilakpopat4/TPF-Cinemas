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
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Bebas Neue"', 'Oswald', 'sans-serif'],
        editorial: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      aspectRatio: {
        cinema: '2.39 / 1',
        poster: '2 / 3',
      },
    },
  },
  plugins: [],
}
