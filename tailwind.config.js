/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#d92828',
        'background-light': '#fff9f9',
        'background-dark': '#221010',
        gold: '#D4AF37',
      },
      fontFamily: {
        display: ['"Noto Sans SC"', '"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
        'serif-cn': ['"Noto Serif SC"', 'serif'],
        calligraphy: ['"Ma Shan Zheng"', 'cursive'],
        'cursive-cn': ['"Zhi Mang Xing"', 'cursive'],
        handwritten: ['"Long Cang"', 'cursive'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '2rem',
        xl: '3rem',
        full: '9999px',
      },
      animation: {
        sway: 'sway 6s ease-in-out infinite',
        'sway-delayed': 'sway 7s ease-in-out infinite 1s',
        shake: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        sway: {
          '0%, 100%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
      },
    },
  },
  plugins: [],
};
