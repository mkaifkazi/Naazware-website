import { connectDb } from './db'
import { Testimonial, type TestimonialDoc } from './models/Testimonial'
import type { TestimonialInput } from './schemas/testimonial'

export type AdminTestimonialRow = {
  id: string
  name: string
  company: string
  quote: string
  featured: boolean
  published: boolean
  order: number
  updatedAt: Date
}

function applyInput(doc: Record<string, unknown>, input: TestimonialInput) {
  doc.name = input.name
  doc.role = input.role ?? ''
  doc.company = input.company ?? ''
  doc.quote = input.quote
  doc.image = input.image || undefined
  doc.companyLogo = input.companyLogo || undefined
  doc.featured = input.featured ?? false
  doc.published = input.published ?? true
}

export async function createTestimonial(input: TestimonialInput): Promise<{ id: string }> {
  await connectDb()
  const doc: Record<string, unknown> = {}
  applyInput(doc, input)
  const created = await Testimonial.create(doc)
  return { id: String(created._id) }
}

export async function getTestimonialById(id: string): Promise<TestimonialDoc | null> {
  await connectDb()
  return Testimonial.findById(id).lean<TestimonialDoc>()
}

export async function updateTestimonial(id: string, input: TestimonialInput): Promise<boolean> {
  await connectDb()
  const doc = await Testimonial.findById(id)
  if (!doc) return false
  const patch: Record<string, unknown> = {}
  applyInput(patch, input)
  doc.set(patch)
  await doc.save()
  return true
}

export async function deleteTestimonial(id: string): Promise<boolean> {
  await connectDb()
  const res = await Testimonial.findByIdAndDelete(id)
  return Boolean(res)
}

export async function reorderTestimonials(ids: string[]): Promise<void> {
  await connectDb()
  await Promise.all(ids.map((id, index) => Testimonial.updateOne({ _id: id }, { $set: { order: index } })))
}

export async function listTestimonials(
  opts: { search?: string; published?: boolean; featured?: boolean } = {}
): Promise<AdminTestimonialRow[]> {
  await connectDb()
  const filter: Record<string, unknown> = {}
  if (typeof opts.published === 'boolean') filter.published = opts.published
  if (typeof opts.featured === 'boolean') filter.featured = opts.featured
  if (opts.search) {
    const rx = new RegExp(opts.search, 'i')
    filter.$or = [{ name: rx }, { company: rx }, { quote: rx }]
  }
  const rows = await Testimonial.find(filter)
    .sort({ order: 1, updatedAt: -1 })
    .lean<(TestimonialDoc & { _id: unknown; updatedAt: Date })[]>()
  return rows.map((t) => ({
    id: String(t._id),
    name: t.name,
    company: t.company ?? '',
    quote: t.quote,
    featured: Boolean(t.featured),
    published: Boolean(t.published),
    order: t.order ?? 0,
    updatedAt: t.updatedAt,
  }))
}
