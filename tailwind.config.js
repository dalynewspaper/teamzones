/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        notion: {
          black: '#000000',
          blue: {
            light: '#E6F5F7',
            DEFAULT: '#2383E2',
            dark: '#0B6E99'
          },
          text: {
            DEFAULT: '#000000',
            secondary: '#6B6B6B'
          },
          background: '#FFFFFF'
        }
      },
      fontFamily: {
        karma: ['Karma', 'serif'],
        sans: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
} 