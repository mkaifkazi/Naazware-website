import type { PortableTextBlock } from '@portabletext/types'
import type { Image } from 'sanity'
import { client } from '@/sanity/lib/client'
import { urlForImage } from '@/sanity/lib/image'
import { caseStudies as localProjects } from './case-studies-data'
import { blogPosts as localPosts } from './blog-posts-data'

// ─── Shared shapes (superset of local data + Sanity) ───
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
  body?: PortableTextBlock[] // Sanity rich text
  content?: string // markdown fallback (local data)
}

export type Testimonial = Quote

type ProjectRow = Omit<Project, 'coverUrl'> & { coverImage?: Image }
type PostRow = Omit<Post, 'coverUrl' | 'content'> & { coverImage?: Image }

const localTestimonials: Testimonial[] = [
  {
    quote:
      'The new checkout flow paid for itself in the first month. Our customers love how fast and simple it is.',
    author: 'Sarah Chen',
    role: 'Director of E-commerce, RetailCo',
  },
  {
    quote:
      'Security and accessibility were both critical. The team delivered on both without compromise.',
    author: 'Dr. Michael Torres',
    role: 'CTO, MediHealth',
  },
  {
    quote: "Our drivers actually love using this app. That's never happened before.",
    author: 'James Park',
    role: 'Operations Manager, QuickShip',
  },
]

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

// ─── Public API (Sanity when configured, else local) ───

export async function getTestimonials(): Promise<Testimonial[]> {
  if (!client) return localTestimonials
  const rows = await client.fetch<Testimonial[]>(
    `*[_type=="testimonial"]|order(order asc){quote, author, role}`
  )
  return rows.length ? rows : localTestimonials
}

export async function getProjects(): Promise<Project[]> {
  if (!client) return localProjects.map(projectFromLocal)
  const rows = await client.fetch<ProjectRow[]>(
    `*[_type=="project"]|order(order asc){
      "slug": slug.current, title, client, industry, excerpt, challenge, solution, outcome,
      metrics[]{label, value}, technologies, testimonial, featured, coverImage
    }`
  )
  if (!rows.length) return localProjects.map(projectFromLocal)
  return rows.map(({ coverImage, ...p }) => ({
    ...p,
    metrics: p.metrics ?? [],
    technologies: p.technologies ?? [],
    coverUrl: urlForImage(coverImage, 1000),
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
  if (!client) return localPosts.filter((p) => p.published).map(postFromLocal)
  const rows = await client.fetch<PostRow[]>(
    `*[_type=="post" && published==true]|order(date desc){
      "slug": slug.current, title, excerpt, author, date, readTime, tags, body, coverImage
    }`
  )
  if (!rows.length) return localPosts.filter((p) => p.published).map(postFromLocal)
  return rows.map(({ coverImage, ...p }) => ({
    ...p,
    tags: p.tags ?? [],
    coverUrl: urlForImage(coverImage, 1400),
  }))
}

export async function getPost(slug: string): Promise<Post | null> {
  return (await getPosts()).find((p) => p.slug === slug) ?? null
}

export async function getPostSlugs(): Promise<string[]> {
  return (await getPosts()).map((p) => p.slug)
}
