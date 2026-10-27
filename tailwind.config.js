const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        card: token('card'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        primary: {
          DEFAULT: token('primary'),
          dark: '#115e59',
          soft: token('primary-soft'),
          text: token('primary-text'),
        },
        success: { DEFAULT: token('success'), soft: token('success-soft') },
        warn: { DEFAULT: token('warn'), soft: token('warn-soft') },
        info: { DEFAULT: token('info'), soft: token('info-soft') },
        danger: { DEFAULT: token('danger'), soft: token('danger-soft') },
        violet: { DEFAULT: token('violet'), soft: token('violet-soft') },
        neutral: { DEFAULT: token('neutral'), soft: token('neutral-soft') },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
}
