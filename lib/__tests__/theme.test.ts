import { describe, it, expect } from 'vitest'
import { resolveInitialTheme, THEME_COLORS } from '@/lib/theme'

describe('resolveInitialTheme', () => {
  it('honors a stored light choice', () => {
    expect(resolveInitialTheme('light')).toBe('light')
  })
  it('honors a stored dark choice', () => {
    expect(resolveInitialTheme('dark')).toBe('dark')
  })
  it('defaults to light when nothing is stored', () => {
    expect(resolveInitialTheme(null)).toBe('light')
  })
  it('defaults to light for any invalid stored value', () => {
    expect(resolveInitialTheme('purple')).toBe('light')
  })
})

describe('THEME_COLORS', () => {
  it('exposes light-first defaults', () => {
    expect(THEME_COLORS.light).toBe('#fafaf7')
    expect(THEME_COLORS.dark).toBe('#0b0b0c')
  })
})
