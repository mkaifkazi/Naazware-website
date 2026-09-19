import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import { Testimonial } from './Testimonial'

describe('Testimonial model', () => {
  setupTestDb()

  it('requires name and quote', async () => {
    await expect(Testimonial.create({})).rejects.toThrow()
  })

  it('defaults published=true, featured=false, order=0', async () => {
    const t = await Testimonial.create({ name: 'Sarah', quote: 'Great' })
    expect(t.published).toBe(true)
    expect(t.featured).toBe(false)
    expect(t.order).toBe(0)
  })
})
