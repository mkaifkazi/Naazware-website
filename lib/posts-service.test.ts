import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import {
  slugify, uniqueSlug, renderPostHtml, createPost, updatePost,
  getPostById, listPosts, deletePost,
} from './posts-service'

const doc = (text: string) => ({
  type: 'doc' as const,
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
})

const base = { excerpt: 'x', tags: [], status: 'draft' as const }

describe('posts-service', () => {
  setupTestDb()

  it('slugify normalizes', () => {
    expect(slugify('Hello World! 2024')).toBe('hello-world-2024')
  })

  it('renderPostHtml converts Tiptap JSON to HTML', () => {
    const html = renderPostHtml(doc('Hello body'))
    expect(html).toContain('Hello body')
    expect(html).toContain('<p>')
  })

  it('renderPostHtml returns empty string for nullish content', () => {
    expect(renderPostHtml(null)).toBe('')
    expect(renderPostHtml(undefined)).toBe('')
  })

  it('createPost stores generated slug, draft default, and derived HTML', async () => {
    const { id } = await createPost({ ...base, title: 'My Post', content: doc('Body text') })
    const stored = await getPostById(id)
    expect(stored?.slug).toBe('my-post')
    expect(stored?.status).toBe('draft')
    expect(stored?.contentHtml).toContain('Body text')
  })

  it('uniqueSlug avoids collisions', async () => {
    await createPost({ ...base, title: 'Alpha', content: doc('a') })
    expect(await uniqueSlug('alpha')).toBe('alpha-2')
  })

  it('updatePost changes fields, re-derives HTML, re-uniques slug excluding self', async () => {
    const { id } = await createPost({ ...base, title: 'Editable', content: doc('old') })
    const ok = await updatePost(id, { ...base, title: 'Editable', slug: 'editable', status: 'published', content: doc('new body') })
    expect(ok).toBe(true)
    const stored = await getPostById(id)
    expect(stored?.status).toBe('published')
    expect(stored?.slug).toBe('editable')
    expect(stored?.contentHtml).toContain('new body')
  })

  it('updatePost returns false for missing id', async () => {
    const ok = await updatePost('507f1f77bcf86cd799439011', { ...base, title: 'X', content: doc('y') })
    expect(ok).toBe(false)
  })

  it('listPosts filters by status and search', async () => {
    await createPost({ ...base, title: 'Published One', status: 'published', content: doc('a') })
    await createPost({ ...base, title: 'Draft One', status: 'draft', content: doc('b') })
    expect((await listPosts({ status: 'published' })).length).toBe(1)
    const found = await listPosts({ search: 'Draft' })
    expect(found.map((p) => p.title)).toContain('Draft One')
  })

  it('deletePost removes it', async () => {
    const { id } = await createPost({ ...base, title: 'Temp', content: doc('a') })
    expect(await deletePost(id)).toBe(true)
    expect(await getPostById(id)).toBeNull()
  })
})
