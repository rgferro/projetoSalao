/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        salon: {
          50: '#fdf4f7',
          100: '#fbe8ef',
          200: '#f7d2e0',
          300: '#f0acc6',
          400: '#e57ca3',
          500: '#d75382',
          600: '#c13768',
          700: '#a32851',
          800: '#872445',
          900: '#72223d',
          950: '#420e20',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Segoe UI', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
