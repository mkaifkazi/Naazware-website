import { describe, expect, it } from 'vitest'
import { rateLimit } from './rate-limit'

describe('rateLimit', () => {
  it('allows up to limit then blocks within the window', () => {
    const key = 'test-' + Math.random()
    expect(rateLimit(key, 2, 1000)).toBe(true)
    expect(rateLimit(key, 2, 1000)).toBe(true)
    expect(rateLimit(key, 2, 1000)).toBe(false)
  })
})
