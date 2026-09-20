import { describe, expect, it } from 'vitest'
import config from '../tailwind.config'

describe('tailwind silk colour ramp', () => {
  it('exposes silk.1/2/3 wired to the CSS vars with alpha support', () => {
    const theme = config.theme as Record<string, any>
    const silk = theme.extend.colors.silk as Record<string, string>
    expect(silk['1']).toBe('rgb(var(--silk-1) / <alpha-value>)')
    expect(silk['2']).toBe('rgb(var(--silk-2) / <alpha-value>)')
    expect(silk['3']).toBe('rgb(var(--silk-3) / <alpha-value>)')
  })

  it('does not disturb the brand accent mapping', () => {
    const theme = config.theme as Record<string, any>
    expect(theme.extend.colors.accent.DEFAULT).toBe('rgb(var(--accent) / <alpha-value>)')
  })
})
