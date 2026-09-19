import { connectDb } from './db'
import { Project as ProjectModel } from './models/Project'
import { Post as PostModel } from './models/Post'
import { Testimonial as TestimonialModel } from './models/Testimonial'
import { Media } from './models/Media'
import { caseStudies as localProjects } from './case-studies-data'
import { blogPosts as localPosts } from './blog-posts-data'
import { testimonialsData } from './testimonials-data'

// ─── Shared shapes (superset of local data + Mongo) ───
export type Metric = { label: string; value: string }
export type Quote = { quote: string; author: string; role?: string }

export type Project = {
  slug: string
  title: string
  client: string
  industry: string
  excerpt: string
  challenge: string
  solution: string
  outcome: string
  metrics: Metric[]
  technologies: string[]
  testimonial?: Quote
  featured: boolean
  coverUrl: string | null
}

export type Post = {
  slug: string
  title: string
  excerpt: string
  author: string
  date: string
  readTime: string
  tags: string[]
  coverUrl: string | null
  content?: string // markdown body (interim, until Tiptap on public side)
}

export type Testimonial = Quote

// ─── Local fallback mappers ───
const projectFromLocal = (c: (typeof localProjects)[number]): Project => ({
  slug: c.slug,
  title: c.title,
  client: c.client,
  industry: c.industry,
  excerpt: c.excerpt,
  challenge: c.challenge,
  solution: c.solution,
  outcome: c.outcome,
  metrics: c.metrics,
  technologies: c.technologies,
  testimonial: c.testimonial,
  featured: c.featured,
  coverUrl: null,
})

const postFromLocal = (p: (typeof localPosts)[number]): Post => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  author: p.author,
  date: p.date,
  readTime: p.readTime,
  tags: p.tags,
  coverUrl: null,
  content: p.content,
})

const localTestimonials: Testimonial[] = testimonialsData.map((t) => ({
  quote: t.quote,
  author: t.name,
  role: [t.role, t.company].filter(Boolean).join(', ') || undefined,
}))

// Resolve a populated coverMedia (or null) to a URL.
const coverUrlOf = (cover: unknown): string | null =>
  cover && typeof cover === 'object' && 'url' in cover ? String((cover as { url: string }).url) : null

// Best-effort DB connect; on failure, callers fall back to local data.
async function tryDb(): Promise<boolean> {
  try {
    await connectDb()
    return true
  } catch {
    return false
  }
}

// ─── Public API (Mongo when available + non-empty, else local) ───

export async function getTestimonials(): Promise<Testimonial[]> {
  if (!(await tryDb())) return localTestimonials
  const rows = await TestimonialModel.find({ published: true }).sort({ order: 1 }).lean()
  if (!rows.length) return localTestimonials
  return rows.map((t) => ({
    quote: t.quote,
    author: t.name,
    role: [t.role, t.company].filter(Boolean).join(', ') || undefined,
  }))
}

export async function getProjects(): Promise<Project[]> {
  if (!(await tryDb())) return localProjects.map(projectFromLocal)
  const rows = await ProjectModel.find({ status: 'published' })
    .sort({ order: 1 })
    .populate({ path: 'coverMedia', model: Media })
    .lean()
  if (!rows.length) return localProjects.map(projectFromLocal)
  return rows.map((p) => ({
    slug: p.slug,
    title: p.title,
    client: p.client,
    industry: p.industry ?? '',
    excerpt: p.shortDescription,
    challenge: p.challenge ?? '',
    solution: p.solution ?? '',
    outcome: p.outcome ?? '',
    metrics: (p.metrics ?? []).map((m) => ({ label: m.label ?? '', value: m.value ?? '' })),
    technologies: p.technologies ?? [],
    testimonial: p.testimonial?.quote
      ? { quote: p.testimonial.quote, author: p.testimonial.author ?? '', role: p.testimonial.role ?? undefined }
      : undefined,
    featured: Boolean(p.featured),
    coverUrl: coverUrlOf(p.coverMedia),
  }))
}

export async function getFeaturedProjects(): Promise<Project[]> {
  return (await getProjects()).filter((p) => p.featured)
}

export async function getProject(slug: string): Promise<Project | null> {
  return (await getProjects()).find((p) => p.slug === slug) ?? null
}

export async function getProjectSlugs(): Promise<string[]> {
  return (await getProjects()).map((p) => p.slug)
}

export async function getPosts(): Promise<Post[]> {
  if (!(await tryDb())) return localPosts.filter((p) => p.published).map(postFromLocal)
  const rows = await PostModel.find({ status: 'published' })
    .sort({ publishDate: -1 })
    .populate({ path: 'coverMedia', model: Media })
    .lean()
  if (!rows.length) return localPosts.filter((p) => p.published).map(postFromLocal)
  return rows.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    author: p.author ?? 'Naazware',
    date: (p.publishDate ?? p.createdAt ?? new Date()).toISOString().slice(0, 10),
    readTime: p.readTime ?? '',
    tags: p.tags ?? [],
    coverUrl: coverUrlOf(p.coverMedia),
    content: p.contentMarkdown ?? '',
  }))
}

export async function getPost(slug: string): Promise<Post | null> {
  return (await getPosts()).find((p) => p.slug === slug) ?? null
}

export async function getPostSlugs(): Promise<string[]> {
  return (await getPosts()).map((p) => p.slug)
}

/** Posts most related to `slug`, ranked by shared tags then recency. */
export async function getRelatedPosts(slug: string, tags: string[], limit = 3): Promise<Post[]> {
  const others = (await getPosts()).filter((p) => p.slug !== slug)
  return others
    .map((p) => ({ p, score: p.tags.filter((t) => tags.includes(t)).length }))
    .sort((a, b) => b.score - a.score || +new Date(b.p.date) - +new Date(a.p.date))
    .slice(0, limit)
    .map((s) => s.p)
}
