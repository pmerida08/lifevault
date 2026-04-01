/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Digital Sanctuary — Light Palette
        surface: '#f7f9fb',
        'surface-bright': '#f7f9fb',
        'surface-dim': '#cfdce3',
        'surface-container': '#e8eff3',
        'surface-container-low': '#f0f4f7',
        'surface-container-high': '#e1e9ee',
        'surface-container-highest': '#d9e4ea',
        'surface-container-lowest': '#ffffff',
        'surface-variant': '#d9e4ea',

        primary: {
          DEFAULT: '#4d44e3',
          dim: '#4034d7',
          fixed: '#e2dfff',
          container: '#e2dfff',
        },
        'on-primary': '#faf6ff',
        'on-primary-container': '#3f33d6',

        secondary: {
          DEFAULT: '#575f75',
          container: '#dae2fd',
        },
        'on-secondary': '#f9f8ff',
        'on-secondary-container': '#4a5167',

        'on-surface': '#2a3439',
        'on-surface-variant': '#566166',
        'on-background': '#2a3439',

        outline: '#717c82',
        'outline-variant': '#a9b4b9',

        error: '#9e3f4e',
        'error-container': '#ff8b9a',
      },
      borderRadius: {
        DEFAULT: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '2rem',
        '3xl': '3rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
