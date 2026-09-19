import { generateHTML } from '@tiptap/html'
import { connectDb } from './db'
import { Post, type PostDoc } from './models/Post'
import { tiptapExtensions } from './tiptap-extensions'
import type { PostInput } from './schemas/post'

export type AdminPostRow = {
  id: string
  title: string
  slug: string
  status: string
  category: string
  publishDate: Date
  updatedAt: Date
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  await connectDb()
  const root = slugify(base) || 'post'
  let candidate = root
  let n = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await Post.findOne({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })
    if (!clash) return candidate
    n += 1
    candidate = `${root}-${n}`
  }
}

export function renderPostHtml(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  try {
    return generateHTML(content as Record<string, unknown>, tiptapExtensions)
  } catch {
    return ''
  }
}

function applyInput(doc: Record<string, unknown>, input: PostInput) {
  doc.title = input.title
  doc.excerpt = input.excerpt
  doc.coverMedia = input.coverMedia || undefined
  doc.content = input.content ?? undefined
  doc.contentHtml = renderPostHtml(input.content)
  doc.author = input.author || 'Naazware'
  doc.category = input.category ?? ''
  doc.tags = input.tags ?? []
  doc.status = input.status ?? 'draft'
  doc.publishDate = input.publishDate ? new Date(input.publishDate) : new Date()
  doc.readTime = input.readTime ?? ''
  doc.seoTitle = input.seoTitle || undefined
  doc.seoDescription = input.seoDescription || undefined
  doc.ogImage = input.ogImage || undefined
}

export async function createPost(input: PostInput): Promise<{ id: string }> {
  await connectDb()
  const slug = await uniqueSlug(input.slug || input.title)
  const doc: Record<string, unknown> = { slug }
  applyInput(doc, input)
  const created = await Post.create(doc)
  return { id: String(created._id) }
}

export async function getPostById(id: string): Promise<PostDoc | null> {
  await connectDb()
  return Post.findById(id).lean<PostDoc>()
}

export async function updatePost(id: string, input: PostInput): Promise<boolean> {
  await connectDb()
  const doc = await Post.findById(id)
  if (!doc) return false
  doc.slug = await uniqueSlug(input.slug || input.title, id)
  const patch: Record<string, unknown> = {}
  applyInput(patch, input)
  doc.set(patch)
  await doc.save()
  return true
}

export async function deletePost(id: string): Promise<boolean> {
  await connectDb()
  const res = await Post.findByIdAndDelete(id)
  return Boolean(res)
}

export async function listPosts(
  opts: { search?: string; status?: 'draft' | 'published' } = {}
): Promise<AdminPostRow[]> {
  await connectDb()
  const filter: Record<string, unknown> = {}
  if (opts.status) filter.status = opts.status
  if (opts.search) {
    const rx = new RegExp(opts.search, 'i')
    filter.$or = [{ title: rx }, { slug: rx }, { category: rx }]
  }
  const rows = await Post.find(filter)
    .sort({ publishDate: -1, updatedAt: -1 })
    .lean<(PostDoc & { _id: unknown; publishDate: Date; updatedAt: Date })[]>()
  return rows.map((p) => ({
    id: String(p._id),
    title: p.title,
    slug: p.slug,
    status: p.status,
    category: p.category ?? '',
    publishDate: p.publishDate,
    updatedAt: p.updatedAt,
  }))
}
