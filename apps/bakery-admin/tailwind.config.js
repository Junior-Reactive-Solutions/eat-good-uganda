/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        platform: {
          primary: 'var(--platform-primary)',
          'primary-hover': 'var(--platform-primary-hover)',
          'primary-light': 'var(--platform-primary-light)',
          accent: 'var(--platform-accent)',
          'accent-dark': 'var(--platform-accent-dark)',
          bg: 'var(--platform-bg)',
          surface: 'var(--platform-surface)',
          fg: 'var(--platform-fg)',
          'fg-muted': 'var(--platform-fg-muted)',
          border: 'var(--platform-border)',
          error: 'var(--platform-error)',
          success: 'var(--platform-success)',
          warning: 'var(--platform-warning)',
        },
        'bakery-primary': 'var(--bakery-primary, var(--platform-primary))',
        'bakery-primary-foreground': 'var(--bakery-primary-foreground, #ffffff)',
        'bakery-accent': 'var(--bakery-accent, var(--platform-accent))',
      },
    },
  },
  plugins: [],
}
