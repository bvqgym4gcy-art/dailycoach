/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        card: '#0d0d0d',
        border: '#1a1a1a',
        'input-bg': '#111111',
        'input-border': '#222222',
        muted: {
          1: '#666666',
          2: '#555555',
          3: '#444444',
          4: '#333333',
          5: '#2a2a2a',
          6: '#1f1f1f',
          7: '#141414',
          8: '#0f0f0f',
          9: '#0a0a0a',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
