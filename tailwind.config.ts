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
        // Brand canvas
        ink: {
          950: '#08080a', // deepest background
          900: '#0a0a0b', // primary background
          800: '#111114', // elevated surface
          700: '#17171c', // cards
          600: '#212129', // borders / hairlines
        },
        paper: {
          DEFAULT: '#f4f4f5', // primary text
          dim: '#a1a1aa', // secondary text
          faint: '#71717a', // muted text
        },
        accent: {
          DEFAULT: '#6d5df6', // electric indigo
          hover: '#8273f8',
          soft: '#a99ffb',
          contrast: '#0a0a0b',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Clash Display', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Fluid display sizes
        'display-xl': ['clamp(3rem, 9vw, 8rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.5rem, 6.5vw, 5.5rem)', { lineHeight: '0.98', letterSpacing: '-0.025em' }],
        'display-md': ['clamp(2rem, 4.5vw, 3.5rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(1.6rem, 3vw, 2.25rem)', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
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
