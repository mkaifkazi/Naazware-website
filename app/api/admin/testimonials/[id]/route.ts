import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { testimonialInputSchema } from '@/lib/schemas/testimonial'
import { getTestimonialById, updateTestimonial, deleteTestimonial } from '@/lib/testimonials-service'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  const doc = await getTestimonialById(params.id)
  if (!doc) return errorResponse('Not found', 404)
  return json({ testimonial: doc })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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
  const ok = await updateTestimonial(params.id, parsed.data)
  if (!ok) return errorResponse('Not found', 404)
  return json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:testimonials`, 60, 60000)) return errorResponse('Too many requests', 429)
  const ok = await deleteTestimonial(params.id)
  if (!ok) return errorResponse('Not found', 404)
  return json({ ok: true })
}
