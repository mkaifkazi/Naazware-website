import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { testimonialInputSchema } from '@/lib/schemas/testimonial'
import { listTestimonials, createTestimonial } from '@/lib/testimonials-service'

export async function GET(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  const { searchParams } = new URL(req.url)
  const published = searchParams.get('published')
  const featured = searchParams.get('featured')
  const rows = await listTestimonials({
    search: searchParams.get('search') || undefined,
    published: published === 'true' ? true : published === 'false' ? false : undefined,
    featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
  })
  return json({ testimonials: rows })
}

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:testimonials`, 60, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const parsed = testimonialInputSchema.safeParse(body)
  if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())
  const { id } = await createTestimonial(parsed.data)
  return json({ id }, 201)
}
