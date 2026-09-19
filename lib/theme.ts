export type Theme = 'light' | 'dark'

export const THEME_COLORS: Record<Theme, string> = {
  light: '#fafaf7',
  dark: '#0b0b0c',
}

/**
 * Resolve the theme to apply before first paint.
 * Stored choice wins; absent/invalid → light (light-first default).
 * Note: system preference is intentionally NOT auto-followed — light is the
 * brand default and dark is an explicit opt-in via the toggle.
 */
export function resolveInitialTheme(stored: string | null): Theme {
  return stored === 'light' || stored === 'dark' ? stored : 'light'
}
