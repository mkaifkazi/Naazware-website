import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Theme-driven tokens (values set per theme in globals.css).
        // "ink" = background scale (darkest→lightest in dark mode; inverted in light).
        // "paper" = foreground/text scale.
        ink: {
          950: 'rgb(var(--ink-950) / <alpha-value>)', // deepest background
          900: 'rgb(var(--ink-900) / <alpha-value>)', // primary background
          800: 'rgb(var(--ink-800) / <alpha-value>)', // elevated surface
          700: 'rgb(var(--ink-700) / <alpha-value>)', // cards
          600: 'rgb(var(--ink-600) / <alpha-value>)', // borders / hairlines
        },
        paper: {
          DEFAULT: 'rgb(var(--paper) / <alpha-value>)', // primary text
          dim: 'rgb(var(--paper-dim) / <alpha-value>)', // secondary text
          faint: 'rgb(var(--paper-faint) / <alpha-value>)', // muted text
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)', // electric indigo
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
          contrast: 'rgb(var(--accent-contrast) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Space Grotesk', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // Fluid display sizes (tight tracking for the grotesk)
        'display-xl': ['clamp(3.25rem, 10vw, 9rem)', { lineHeight: '0.92', letterSpacing: '-0.045em' }],
        'display-lg': ['clamp(2.75rem, 7.5vw, 6.5rem)', { lineHeight: '0.94', letterSpacing: '-0.04em' }],
        'display-md': ['clamp(2rem, 4.5vw, 3.75rem)', { lineHeight: '1.0', letterSpacing: '-0.03em' }],
        'display-sm': ['clamp(1.6rem, 3vw, 2.25rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      maxWidth: {
        container: '1280px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(4%, -3%) scale(1.08)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'glow-drift': 'glow-drift 18s ease-in-out infinite',
        marquee: 'marquee 32s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
