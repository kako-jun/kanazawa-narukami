/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'boundary-dark': '#0a0e1a',
        'boundary-darker': '#050810',
        'boundary-blue': '#2d3e5f',
        'boundary-indigo': '#1a2332',
        'boundary-cyan': '#4a7c8c',
        'boundary-silver': '#c0c5ce',
        'boundary-mist': '#8b95a8',
      },
      fontFamily: {
        serif: ['Noto Serif JP', 'serif'],
        sans: ['Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
