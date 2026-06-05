/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'platform-primary': 'var(--platform-primary)',
        'platform-primary-hover': 'var(--platform-primary-hover)',
        'platform-primary-light': 'var(--platform-primary-light)',
        'platform-accent': 'var(--platform-accent)',
        'platform-accent-dark': 'var(--platform-accent-dark)',
        'platform-bg': 'var(--platform-bg)',
        'platform-surface': 'var(--platform-surface)',
        'platform-fg': 'var(--platform-fg)',
        'platform-fg-muted': 'var(--platform-fg-muted)',
        'platform-border': 'var(--platform-border)',
        'platform-error': 'var(--platform-error)',
        'platform-success': 'var(--platform-success)',
        'platform-warning': 'var(--platform-warning)',
      },
    },
  },
  plugins: [],
}
