import { connectDb } from './db'
import { Project, type ProjectDoc } from './models/Project'
import type { ProjectInput } from './schemas/project'

export type AdminProjectRow = {
  id: string
  title: string
  slug: string
  client: string
  status: string
  featured: boolean
  order: number
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
  const root = slugify(base) || 'project'
  let candidate = root
  let n = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await Project.findOne({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })
    if (!clash) return candidate
    n += 1
    candidate = `${root}-${n}`
  }
}

function applyInput(doc: Record<string, unknown>, input: ProjectInput) {
  doc.title = input.title
  doc.client = input.client
  doc.industry = input.industry ?? ''
  doc.shortDescription = input.shortDescription
  doc.fullDescription = input.fullDescription ?? ''
  doc.challenge = input.challenge ?? ''
  doc.solution = input.solution ?? ''
  doc.outcome = input.outcome ?? ''
  doc.services = input.services ?? []
  doc.technologies = input.technologies ?? []
  doc.metrics = input.metrics ?? []
  doc.coverMedia = input.coverMedia || undefined
  doc.gallery = input.gallery ?? []
  doc.videoUrl = input.videoUrl || undefined
  doc.externalUrl = input.externalUrl || undefined
  doc.testimonial = input.testimonial || undefined
  doc.featured = input.featured ?? false
  doc.status = input.status ?? 'draft'
  doc.seo = input.seo ?? {}
}

export async function createProject(input: ProjectInput): Promise<{ id: string }> {
  await connectDb()
  const slug = await uniqueSlug(input.slug || input.title)
  const doc: Record<string, unknown> = { slug }
  applyInput(doc, input)
  const created = await Project.create(doc)
  return { id: String(created._id) }
}

export async function getProjectById(id: string): Promise<ProjectDoc | null> {
  await connectDb()
  return Project.findById(id).lean<ProjectDoc>()
}

export async function updateProject(id: string, input: ProjectInput): Promise<boolean> {
  await connectDb()
  const doc = await Project.findById(id)
  if (!doc) return false
  doc.slug = await uniqueSlug(input.slug || input.title, id)
  const patch: Record<string, unknown> = {}
  applyInput(patch, input)
  doc.set(patch)
  await doc.save()
  return true
}

export async function deleteProject(id: string): Promise<boolean> {
  await connectDb()
  const res = await Project.findByIdAndDelete(id)
  return Boolean(res)
}

export async function duplicateProject(id: string): Promise<{ id: string } | null> {
  await connectDb()
  const src = await Project.findById(id).lean<ProjectDoc>()
  if (!src) return null
  const title = `${src.title} (copy)`
  const slug = await uniqueSlug(title)
  const { _id, createdAt, updatedAt, ...rest } = src as Record<string, unknown>
  void _id
  void createdAt
  void updatedAt
  const created = await Project.create({ ...rest, title, slug, status: 'draft', featured: false })
  return { id: String(created._id) }
}

export async function reorderProjects(ids: string[]): Promise<void> {
  await connectDb()
  await Promise.all(ids.map((id, index) => Project.updateOne({ _id: id }, { $set: { order: index } })))
}

export async function listProjects(
  opts: { search?: string; status?: 'draft' | 'published'; featured?: boolean } = {}
): Promise<AdminProjectRow[]> {
  await connectDb()
  const filter: Record<string, unknown> = {}
  if (opts.status) filter.status = opts.status
  if (typeof opts.featured === 'boolean') filter.featured = opts.featured
  if (opts.search) {
    const rx = new RegExp(opts.search, 'i')
    filter.$or = [{ title: rx }, { client: rx }, { slug: rx }]
  }
  const rows = await Project.find(filter)
    .sort({ order: 1, updatedAt: -1 })
    .lean<(ProjectDoc & { _id: unknown; updatedAt: Date })[]>()
  return rows.map((p) => ({
    id: String(p._id),
    title: p.title,
    slug: p.slug,
    client: p.client,
    status: p.status,
    featured: Boolean(p.featured),
    order: p.order ?? 0,
    updatedAt: p.updatedAt,
  }))
}
