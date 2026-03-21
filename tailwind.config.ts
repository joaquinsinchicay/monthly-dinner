import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "var(--surface)",
        "surface-low": "var(--surface-low)",
        "surface-lowest": "var(--surface-lowest)",
        "surface-high": "var(--surface-high)",
        primary: "var(--primary)",
        "primary-cont": "var(--primary-cont)",
        "on-surface": "var(--on-surface)",
        secondary: "var(--secondary)",
        tertiary: "var(--tertiary)",
        "tertiary-fixed": "var(--tertiary-fixed)",
        "secondary-fixed": "var(--secondary-fixed)",
        error: "var(--error)",
        "error-cont": "var(--error-cont)",
        "outline-var": "var(--outline-var)"
      },
      boxShadow: {
        card: "var(--shadow)",
        "card-md": "var(--shadow-md)"
      },
      borderRadius: {
        '2xl': '1rem'
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif']
      },
      backgroundImage: {
        primary: 'linear-gradient(135deg, var(--primary), var(--primary-cont))'
      },
      backdropBlur: {
        xs: '12px'
      }
    }
  },
  plugins: []
};

export default config;
