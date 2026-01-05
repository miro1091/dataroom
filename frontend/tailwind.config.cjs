/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Newsreader"', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        paper: 'var(--paper)',
        surface: 'var(--surface)',
        'surface-strong': 'var(--surface-strong)',
        accent: 'var(--accent)',
        'accent-dark': 'var(--accent-dark)',
        border: 'var(--border)',
      },
      boxShadow: {
        soft: '0 24px 60px rgba(30, 28, 22, 0.12)',
      },
      borderRadius: {
        xl: '18px',
      },
    },
  },
  plugins: [],
}
