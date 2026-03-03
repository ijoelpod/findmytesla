/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:           '#212121',
        surface:      '#2a2a2a',
        'surface-2':  '#333333',
        text:         '#F2F2F2',
        muted:        '#9ca3af',
        accent:       '#CC0000',
        'accent-hover': '#aa0000',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

