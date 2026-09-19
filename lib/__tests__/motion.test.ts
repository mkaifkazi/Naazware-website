import { describe, it, expect } from 'vitest'
import {
  EASE_OUT_EXPO,
  LENIS_DEFAULTS,
  shouldEnableMotion,
  shouldEnableCursor,
  magneticOffset,
  fadeUpVariants,
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

describe('shouldEnableCursor', () => {
  it('enabled only for fine pointer without reduced-motion', () => {
    expect(shouldEnableCursor(false, false)).toBe(true)
  })
  it('disabled on coarse pointer', () => {
    expect(shouldEnableCursor(false, true)).toBe(false)
  })
  it('disabled with reduced-motion', () => {
    expect(shouldEnableCursor(true, false)).toBe(false)
  })
})

describe('magneticOffset', () => {
  const rect = { left: 100, top: 100, width: 100, height: 100 } // center 150,150
  it('is zero at the element center', () => {
    expect(magneticOffset({ x: 150, y: 150 }, rect)).toEqual({ x: 0, y: 0 })
  })
  it('pulls toward the pointer scaled by strength (default 0.3)', () => {
    // pointer 50px right of center → 50 * 0.3 = 15
    expect(magneticOffset({ x: 200, y: 150 }, rect)).toEqual({ x: 15, y: 0 })
  })
  it('respects a custom strength', () => {
    expect(magneticOffset({ x: 200, y: 150 }, rect, 0.5)).toEqual({ x: 25, y: 0 })
  })
})

describe('fadeUpVariants', () => {
  it('animates opacity and y with the out-expo ease', () => {
    expect(fadeUpVariants.hidden).toMatchObject({ opacity: 0, y: 24 })
    expect(fadeUpVariants.visible).toMatchObject({ opacity: 1, y: 0 })
    expect(fadeUpVariants.visible.transition.ease).toEqual(EASE_OUT_EXPO)
  })
})
