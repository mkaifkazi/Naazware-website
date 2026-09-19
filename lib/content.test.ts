import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import { Project } from './models/Project'
import { Post } from './models/Post'
import { Testimonial } from './models/Testimonial'
import { getProjects, getFeaturedProjects, getPosts, getTestimonials } from './content'

describe('content layer (Mongo-backed)', () => {
  setupTestDb()

  it('returns published projects from Mongo, ordered', async () => {
    await Project.create({ title: 'B', slug: 'b', client: 'C', shortDescription: 'x', status: 'published', order: 1 })
    await Project.create({ title: 'A', slug: 'a', client: 'C', shortDescription: 'x', status: 'published', order: 0, featured: true })
    const projects = await getProjects()
    expect(projects.map((p) => p.slug)).toEqual(['a', 'b'])
    expect(projects[0].coverUrl).toBeNull()
    const featured = await getFeaturedProjects()
    expect(featured.map((p) => p.slug)).toEqual(['a'])
  })

  it('excludes draft posts and orders by publishDate desc', async () => {
    await Post.create({ title: 'Old', slug: 'old', excerpt: 'e', status: 'published', publishDate: new Date('2020-01-01') })
    await Post.create({ title: 'New', slug: 'new', excerpt: 'e', status: 'published', publishDate: new Date('2024-01-01') })
    await Post.create({ title: 'Draft', slug: 'draft', excerpt: 'e', status: 'draft' })
    const posts = await getPosts()
    expect(posts.map((p) => p.slug)).toEqual(['new', 'old'])
  })

  it('returns published testimonials ordered', async () => {
    await Testimonial.create({ name: 'Z', quote: 'q', order: 1, published: true })
    await Testimonial.create({ name: 'A', quote: 'q', order: 0, published: true })
    await Testimonial.create({ name: 'Hidden', quote: 'q', order: 2, published: false })
    const rows = await getTestimonials()
    expect(rows.map((t) => t.author)).toEqual(['A', 'Z'])
  })
})
