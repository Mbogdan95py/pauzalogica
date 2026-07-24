import type { Config } from 'tailwindcss';

/**
 * Colors are driven by CSS custom properties (see app/globals.css) so that a
 * single `.dark` class flip re-themes the whole site. Each color is stored as
 * space-separated RGB channels ("255 255 255") so Tailwind's `<alpha-value>`
 * opacity modifiers keep working (e.g. `bg-surface/60`).
 */
function withVar(variable: string) {
  return `rgb(var(${variable}) / <alpha-value>)`;
}

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './games/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: withVar('--c-bg'),
        surface: withVar('--c-surface'),
        'surface-2': withVar('--c-surface-2'),
        border: withVar('--c-border'),
        'border-strong': withVar('--c-border-strong'),
        text: withVar('--c-text'),
        muted: withVar('--c-muted'),
        brand: {
          DEFAULT: withVar('--c-brand'),
          soft: withVar('--c-brand-soft'),
          ink: withVar('--c-brand-ink'),
        },
        // Per-game accent colors, matching the mockup.
        sudoku: withVar('--c-sudoku'),
        rebus: withVar('--c-rebus'),
        cuvinte: withVar('--c-cuvinte'),
        nonograme: withVar('--c-nonograme'),
        rapid: withVar('--c-rapid'),
        kakuro: withVar('--c-kakuro'),
        anagrame: withVar('--c-anagrame'),
        labirint: withVar('--c-labirint'),
        integrame: withVar('--c-integrame'),
        careu: withVar('--c-careu'),
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.15rem',
      },
      boxShadow: {
        card: '0 1px 2px rgb(15 23 42 / 0.04), 0 1px 3px rgb(15 23 42 / 0.06)',
        'card-hover': '0 6px 20px rgb(15 23 42 / 0.08)',
      },
      maxWidth: {
        content: '1200px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop': {
          '0%': { transform: 'scale(0.9)' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
        pop: 'pop 0.28s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
