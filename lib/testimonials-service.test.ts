import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import {
  createTestimonial, updateTestimonial, getTestimonialById,
  listTestimonials, deleteTestimonial, reorderTestimonials,
} from './testimonials-service'

const base = { featured: false, published: true }

describe('testimonials-service', () => {
  setupTestDb()

  it('createTestimonial stores with defaults', async () => {
    const { id } = await createTestimonial({ ...base, name: 'Ada', quote: 'Great work' })
    const doc = await getTestimonialById(id)
    expect(doc?.name).toBe('Ada')
    expect(doc?.published).toBe(true)
    expect(doc?.featured).toBe(false)
  })

  it('updateTestimonial changes fields', async () => {
    const { id } = await createTestimonial({ ...base, name: 'Grace', quote: 'Nice' })
    const ok = await updateTestimonial(id, { ...base, name: 'Grace H.', quote: 'Nice', published: false })
    expect(ok).toBe(true)
    const doc = await getTestimonialById(id)
    expect(doc?.name).toBe('Grace H.')
    expect(doc?.published).toBe(false)
  })

  it('updateTestimonial returns false for missing id', async () => {
    const ok = await updateTestimonial('507f1f77bcf86cd799439011', { ...base, name: 'X', quote: 'Y' })
    expect(ok).toBe(false)
  })

  it('listTestimonials filters by published, featured and search', async () => {
    await createTestimonial({ ...base, name: 'Pub Featured', company: 'Acme', quote: 'q', featured: true, published: true })
    await createTestimonial({ ...base, name: 'Hidden', company: 'Beta', quote: 'q', published: false })
    expect((await listTestimonials({ published: true })).length).toBe(1)
    expect((await listTestimonials({ featured: true })).length).toBe(1)
    const found = await listTestimonials({ search: 'Beta' })
    expect(found.map((t) => t.name)).toContain('Hidden')
  })

  it('deleteTestimonial removes it', async () => {
    const { id } = await createTestimonial({ ...base, name: 'Temp', quote: 'q' })
    expect(await deleteTestimonial(id)).toBe(true)
    expect(await getTestimonialById(id)).toBeNull()
  })

  it('reorderTestimonials sets order by index', async () => {
    const a = await createTestimonial({ ...base, name: 'A', quote: 'q' })
    const b = await createTestimonial({ ...base, name: 'B', quote: 'q' })
    await reorderTestimonials([b.id, a.id])
    expect((await getTestimonialById(b.id))?.order).toBe(0)
    expect((await getTestimonialById(a.id))?.order).toBe(1)
  })
})
