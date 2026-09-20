import { describe, expect, it } from 'vitest'
import {
  normalizeComposition,
  toFallbackLayers,
  toCanvasUniforms,
  SILK_DEFAULTS,
} from './silk'

describe('normalizeComposition', () => {
  it('returns defaults when given nothing', () => {
    expect(normalizeComposition()).toEqual(SILK_DEFAULTS)
  })

  it('clamps out-of-range values', () => {
    const c = normalizeComposition({ scale: 9, intensity: 5, offset: { x: 999, y: -999 } })
    expect(c.scale).toBeLessThanOrEqual(2)
    expect(c.scale).toBeGreaterThanOrEqual(0.5)
    expect(c.intensity).toBeLessThanOrEqual(1)
    expect(c.intensity).toBeGreaterThanOrEqual(0)
    expect(c.offset.x).toBeLessThanOrEqual(100)
    expect(c.offset.y).toBeGreaterThanOrEqual(-100)
  })

  it('wraps angle into [0,360)', () => {
    expect(normalizeComposition({ angle: 400 }).angle).toBe(40)
    expect(normalizeComposition({ angle: -30 }).angle).toBe(330)
  })
})

describe('toFallbackLayers', () => {
  it('references all three silk vars', () => {
    const s = toFallbackLayers(SILK_DEFAULTS)
    expect(s).toContain('var(--silk-1)')
    expect(s).toContain('var(--silk-2)')
    expect(s).toContain('var(--silk-3)')
  })

  it('scales alpha with intensity (dimmer at lower intensity)', () => {
    const strong = toFallbackLayers(normalizeComposition({ intensity: 1 }))
    const weak = toFallbackLayers(normalizeComposition({ intensity: 0.2 }))
    const firstAlpha = (str: string) => Number(str.match(/silk-1\) \/ ([0-9.]+)/)![1])
    expect(firstAlpha(strong)).toBeGreaterThan(firstAlpha(weak))
  })

  it('moves gradient anchors with offset', () => {
    const a = toFallbackLayers(normalizeComposition({ offset: { x: 0, y: 0 } }))
    const b = toFallbackLayers(normalizeComposition({ offset: { x: 40, y: 0 } }))
    expect(a).not.toBe(b)
  })
})

describe('toCanvasUniforms', () => {
  it('converts angle to radians and passes intensity/scale', () => {
    const u = toCanvasUniforms(normalizeComposition({ angle: 180, scale: 1.5, intensity: 0.5 }))
    expect(u.angleRad).toBeCloseTo(Math.PI)
    expect(u.scale).toBe(1.5)
    expect(u.intensity).toBe(0.5)
  })
})
