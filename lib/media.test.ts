import { describe, expect, it, vi } from 'vitest'
import { setupTestDb } from '@/test/setup-db'

// Stub the R2 side effects — these tests exercise the Mongo record logic only.
vi.mock('./storage', () => ({
  publicUrl: (key: string) => `https://pub-x.r2.dev/${key}`,
  deleteObject: vi.fn(async () => {}),
}))

import { createMedia, listMedia, deleteMedia } from './media'
import { Media } from './models/Media'

describe('media helpers', () => {
  setupTestDb()

  it('createMedia stores a record with a public url', async () => {
    const res = await createMedia({ key: 'projects/a.png', type: 'image/png', size: 100, filename: 'a.png' })
    expect(res.url).toBe('https://pub-x.r2.dev/projects/a.png')
    expect(await Media.countDocuments()).toBe(1)
  })

  it('listMedia returns records and filters by search', async () => {
    await createMedia({ key: 'k1', type: 'image/png', size: 1, filename: 'alpha.png' })
    await createMedia({ key: 'k2', type: 'image/png', size: 1, filename: 'beta.png' })
    const all = await listMedia()
    expect(all).toHaveLength(2)
    const filtered = await listMedia('alpha')
    expect(filtered.map((m) => m.filename)).toEqual(['alpha.png'])
  })

  it('deleteMedia removes the record and returns true; false when missing', async () => {
    const { id } = await createMedia({ key: 'k3', type: 'image/png', size: 1 })
    expect(await deleteMedia(id)).toBe(true)
    expect(await Media.countDocuments()).toBe(0)
    expect(await deleteMedia('64b7f9f9f9f9f9f9f9f9f9f9')).toBe(false)
  })
})
