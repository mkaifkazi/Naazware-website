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
        // Silk ramp — backdrops + decorative accents ONLY (not UI controls).
        silk: {
          1: 'rgb(var(--silk-1) / <alpha-value>)', // teal
          2: 'rgb(var(--silk-2) / <alpha-value>)', // sky
          3: 'rgb(var(--silk-3) / <alpha-value>)', // violet
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Fraunces', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // Fluid display sizes (tight tracking for the grotesk)
        'display-xl': ['clamp(3.25rem, 10vw, 9rem)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2.75rem, 7.5vw, 6.5rem)', { lineHeight: '0.98', letterSpacing: '-0.018em' }],
        'display-md': ['clamp(2rem, 4.5vw, 3.75rem)', { lineHeight: '1.02', letterSpacing: '-0.015em' }],
        'display-sm': ['clamp(1.6rem, 3vw, 2.25rem)', { lineHeight: '1.12', letterSpacing: '-0.01em' }],
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
        'silk-drift': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(-2%, 1.5%, 0) scale(1.06)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'glow-drift': 'glow-drift 18s ease-in-out infinite',
        'silk-drift': 'silk-drift 48s ease-in-out infinite',
        marquee: 'marquee 32s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
