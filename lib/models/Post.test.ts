import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import { Post } from './Post'

describe('Post model', () => {
  setupTestDb()

  it('requires title, slug, excerpt', async () => {
    await expect(Post.create({})).rejects.toThrow()
  })

  it('defaults author=Naazware, status=draft, tags=[]', async () => {
    const p = await Post.create({ title: 'T', slug: 't', excerpt: 'e' })
    expect(p.author).toBe('Naazware')
    expect(p.status).toBe('draft')
    expect(p.tags).toEqual([])
  })
})
