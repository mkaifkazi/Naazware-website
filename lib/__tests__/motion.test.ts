import { describe, it, expect } from 'vitest'
import {
  EASE_OUT_EXPO,
  LENIS_DEFAULTS,
  shouldEnableMotion,
  fadeUpVariants,
  shouldRenderWebGL,
} from '@/lib/motion'

describe('EASE_OUT_EXPO', () => {
  it('is the out-expo cubic-bezier control points', () => {
    expect(EASE_OUT_EXPO).toEqual([0.16, 1, 0.3, 1])
  })
})

describe('LENIS_DEFAULTS', () => {
  it('uses a 1.1s smooth-wheel duration', () => {
    expect(LENIS_DEFAULTS).toEqual({ duration: 1.1, smoothWheel: true })
  })
})

describe('shouldEnableMotion', () => {
  it('enabled when reduced-motion is off', () => {
    expect(shouldEnableMotion(false)).toBe(true)
  })
  it('disabled when reduced-motion is on', () => {
    expect(shouldEnableMotion(true)).toBe(false)
  })
})

describe('fadeUpVariants', () => {
  it('animates opacity and y with the out-expo ease', () => {
    expect(fadeUpVariants.hidden).toMatchObject({ opacity: 0, y: 24 })
    expect(fadeUpVariants.visible).toMatchObject({ opacity: 1, y: 0 })
    expect(fadeUpVariants.visible.transition.ease).toEqual(EASE_OUT_EXPO)
  })
})

describe('shouldRenderWebGL', () => {
  const ok = { prefersReduced: false, isCoarseOrSmall: false, saveData: false, webglSupported: true }
  it('renders on a capable desktop with motion allowed', () => {
    expect(shouldRenderWebGL(ok)).toBe(true)
  })
  it('off under reduced motion', () => {
    expect(shouldRenderWebGL({ ...ok, prefersReduced: true })).toBe(false)
  })
  it('off on coarse/small (mobile)', () => {
    expect(shouldRenderWebGL({ ...ok, isCoarseOrSmall: true })).toBe(false)
  })
  it('off on save-data', () => {
    expect(shouldRenderWebGL({ ...ok, saveData: true })).toBe(false)
  })
  it('off when webgl unsupported', () => {
    expect(shouldRenderWebGL({ ...ok, webglSupported: false })).toBe(false)
  })
})
