export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Helvetica', 'Arial', 'sans-serif'],
        mono: ['"Helvetica Monospaced"', '"Helvetica Mono"', 'monospace'],
      },
      colors: {
        black: '#000000',
        white: '#ffffff',
      }
    },
  },
  plugins: [],
}