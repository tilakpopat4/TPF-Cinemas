/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#07080A',
        graphite: '#12141A',
        surface: {
          DEFAULT: '#161922',
          elevated: '#1E222E',
        },
        ivory: '#F5F5F7',
        signature: {
          DEFAULT: '#E5A93C',
          hover: '#F5B748',
          muted: 'rgba(229, 169, 59, 0.15)',
        },
        muted: '#9CA3AF',
        hairline: 'rgba(245, 245, 247, 0.08)',
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
