import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { reorderTestimonials } from '@/lib/testimonials-service'

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
  const ids = (body as { ids?: unknown }).ids
  if (!Array.isArray(ids) || !ids.every((x) => typeof x === 'string')) return badRequest('ids must be a string array')
  await reorderTestimonials(ids as string[])
  return json({ ok: true })
}
