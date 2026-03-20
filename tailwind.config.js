/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-container': 'var(--primary-container)',
        surface: 'var(--surface)',
        'surface-container': 'var(--surface-container)',
        'surface-container-low': 'var(--surface-container-low)',
        'surface-container-lowest': 'var(--surface-container-lowest)',
        'on-surface': 'var(--on-surface)',
        'on-surface-variant': 'var(--on-surface-variant)',
        secondary: 'var(--secondary)',
        outline: 'var(--outline)',
        'outline-variant': 'var(--outline-variant)',
        tertiary: 'var(--tertiary)',
        'tertiary-container': 'var(--tertiary-container)',
        error: 'var(--error)',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        xl: '1.5rem',
        full: '9999px',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
      },
      boxShadow: {
        'primary-glow': '0 18px 48px rgba(0, 74, 198, 0.2)',
      },
    },
  },
  plugins: [],
};

module.exports = config;
