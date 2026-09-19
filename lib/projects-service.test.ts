import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import {
  slugify, uniqueSlug, createProject, updateProject, getProjectById,
  listProjects, deleteProject, duplicateProject, reorderProjects,
} from './projects-service'

const base = { client: 'Acme', shortDescription: 'x', services: [], technologies: [], metrics: [], gallery: [], featured: false, status: 'draft' as const, seo: {} }

describe('projects-service', () => {
  setupTestDb()

  it('slugify normalizes', () => {
    expect(slugify('Hello World! 2024')).toBe('hello-world-2024')
  })

  it('uniqueSlug avoids collisions', async () => {
    await createProject({ ...base, title: 'Alpha' })
    expect(await uniqueSlug('alpha')).toBe('alpha-2')
  })

  it('createProject stores with generated slug + draft default', async () => {
    const { id } = await createProject({ ...base, title: 'My Project' })
    const doc = await getProjectById(id)
    expect(doc?.slug).toBe('my-project')
    expect(doc?.status).toBe('draft')
  })

  it('updateProject changes fields and re-uniques slug excluding self', async () => {
    const { id } = await createProject({ ...base, title: 'Editable' })
    const ok = await updateProject(id, { ...base, title: 'Editable', slug: 'editable', status: 'published' })
    expect(ok).toBe(true)
    const doc = await getProjectById(id)
    expect(doc?.status).toBe('published')
    expect(doc?.slug).toBe('editable')
  })

  it('listProjects filters by status and search', async () => {
    await createProject({ ...base, title: 'Published One', status: 'published' })
    await createProject({ ...base, title: 'Draft One', status: 'draft' })
    expect((await listProjects({ status: 'published' })).length).toBe(1)
    const found = await listProjects({ search: 'Draft' })
    expect(found.map((p) => p.title)).toContain('Draft One')
  })

  it('duplicateProject creates a draft copy with a new slug', async () => {
    const { id } = await createProject({ ...base, title: 'Original', status: 'published' })
    const dup = await duplicateProject(id)
    const doc = await getProjectById(dup!.id)
    expect(doc?.title).toBe('Original (copy)')
    expect(doc?.slug).toBe('original-copy')
    expect(doc?.status).toBe('draft')
  })

  it('deleteProject removes it', async () => {
    const { id } = await createProject({ ...base, title: 'Temp' })
    expect(await deleteProject(id)).toBe(true)
    expect(await getProjectById(id)).toBeNull()
  })

  it('reorderProjects sets order by index', async () => {
    const a = await createProject({ ...base, title: 'A' })
    const b = await createProject({ ...base, title: 'B' })
    await reorderProjects([b.id, a.id])
    expect((await getProjectById(b.id))?.order).toBe(0)
    expect((await getProjectById(a.id))?.order).toBe(1)
  })
})
