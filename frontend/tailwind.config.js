/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink:    '#0D0D0F',
        cream:  '#F5F2ED',
        amber:  { DEFAULT: '#E8A838', light: '#FFC96B', dark: '#B07A10' },
        teal:   { DEFAULT: '#1A9E8F', light: '#2DCFBB', dark: '#0D6E64' },
        coral:  { DEFAULT: '#E85C3A', light: '#FF8A6E' },
        slate:  { 50: '#F8F9FA', 100: '#EEF0F3', 200: '#D4D8E0', 500: '#7A8499', 700: '#3E4557', 900: '#1C2135' },
      },
      animation: {
        'fade-up':   'fadeUp 0.4s ease forwards',
        'fade-in':   'fadeIn 0.3s ease forwards',
        'pulse-dot': 'pulseDot 1.2s ease-in-out infinite',
        'tick-down': 'tickDown 1s linear infinite',
      },
      keyframes: {
        fadeUp:   { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        pulseDot: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.4)' } },
        tickDown: { from: { strokeDashoffset: 0 }, to: { strokeDashoffset: 283 } },
      },
    },
  },
  plugins: [],
}
