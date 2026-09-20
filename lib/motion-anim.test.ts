import { describe, expect, it } from 'vitest'
import { splitWords, staggerDelays, countUpValue } from './motion-anim'

describe('splitWords', () => {
  it('splits on whitespace and drops empties', () => {
    expect(splitWords('  work  beautifully ')).toEqual(['work', 'beautifully'])
  })
  it('handles single word', () => {
    expect(splitWords('hello')).toEqual(['hello'])
  })
})

describe('staggerDelays', () => {
  it('produces ascending delays from base', () => {
    expect(staggerDelays(3, 60, 100)).toEqual([100, 160, 220])
  })
  it('defaults base to 0', () => {
    expect(staggerDelays(2, 50)).toEqual([0, 50])
  })
})

describe('countUpValue', () => {
  it('returns exactly the target at progress 1', () => {
    expect(countUpValue(98, 1)).toBe(98)
  })
  it('returns from at progress 0', () => {
    expect(countUpValue(98, 0, 10)).toBe(10)
  })
  it('is monotonic increasing between 0 and 1', () => {
    const a = countUpValue(100, 0.3)
    const b = countUpValue(100, 0.7)
    expect(b).toBeGreaterThan(a)
    expect(a).toBeGreaterThanOrEqual(0)
    expect(b).toBeLessThanOrEqual(100)
  })
})
