import { describe, expect, it } from 'vitest'
import { buildAccents } from './accents'

const PRESETS = ['hero', 'section', 'cta'] as const

describe('buildAccents', () => {
  it('is deterministic for a given preset', () => {
    expect(buildAccents('hero')).toEqual(buildAccents('hero'))
  })

  it('caps element counts (premium restraint)', () => {
    for (const p of PRESETS) {
      const { blobs, shapes } = buildAccents(p)
      expect(blobs.length).toBeGreaterThanOrEqual(1)
      expect(blobs.length).toBeLessThanOrEqual(4)
      expect(shapes.length).toBeLessThanOrEqual(3)
    }
  })

  it('keeps positions in-bounds, colours valid, depth normalised', () => {
    for (const p of PRESETS) {
      const { blobs, shapes } = buildAccents(p)
      for (const b of blobs) {
        expect(b.x).toBeGreaterThanOrEqual(-20)
        expect(b.x).toBeLessThanOrEqual(120)
        expect([1, 2, 3]).toContain(b.color)
        expect(b.depth).toBeGreaterThanOrEqual(0)
        expect(b.depth).toBeLessThanOrEqual(1)
        expect(b.opacity).toBeGreaterThan(0)
        expect(b.opacity).toBeLessThanOrEqual(0.5)
      }
      for (const s of shapes) {
        expect(['ring', 'arc']).toContain(s.kind)
      }
    }
  })

  it('gives every element a unique id', () => {
    const { blobs, shapes } = buildAccents('hero')
    const ids = [...blobs, ...shapes].map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
