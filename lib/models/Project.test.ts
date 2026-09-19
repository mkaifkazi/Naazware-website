import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import { Project } from './Project'

describe('Project model', () => {
  setupTestDb()

  it('requires title, slug, client, shortDescription', async () => {
    await expect(Project.create({})).rejects.toThrow()
  })

  it('defaults status=draft, featured=false, order=0', async () => {
    const p = await Project.create({ title: 'A', slug: 'a', client: 'C', shortDescription: 'x' })
    expect(p.status).toBe('draft')
    expect(p.featured).toBe(false)
    expect(p.order).toBe(0)
    expect(p.services).toEqual([])
  })

  it('rejects invalid status', async () => {
    await expect(
      Project.create({ title: 'A', slug: 'a2', client: 'C', shortDescription: 'x', status: 'bogus' })
    ).rejects.toThrow()
  })
})
