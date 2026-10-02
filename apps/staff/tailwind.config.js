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
        ivory: '#F5F5F7',
        signature: {
          DEFAULT: '#E5A93C',
          hover: '#F5B748',
          muted: 'rgba(229, 169, 59, 0.15)',
        },
        muted: '#9CA3AF',
        hairline: 'rgba(245, 245, 247, 0.08)',
        background: '#07080A',
        surface: {
          50: '#1e2430',
          100: '#161a23',
          200: '#12141a',
          300: '#0c0d14',
          DEFAULT: '#0c0d14',
        },
        cinema: {
          gold: '#E5A93C',
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
