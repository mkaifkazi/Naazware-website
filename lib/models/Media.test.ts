import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import { Media } from './Media'

describe('Media model', () => {
  setupTestDb()

  it('requires key and url', async () => {
    await expect(Media.create({})).rejects.toThrow()
  })

  it('creates with key + url', async () => {
    const m = await Media.create({ key: 'covers/a.png', url: 'https://cdn/a.png', type: 'image/png', size: 10 })
    expect(m.key).toBe('covers/a.png')
    expect(m.url).toBe('https://cdn/a.png')
  })
})
