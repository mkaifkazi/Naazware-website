import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { enquiryStatusSchema } from '@/lib/schemas/enquiry'
import { getEnquiryById, setEnquiryStatus, deleteEnquiry } from '@/lib/enquiries-service'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  const doc = await getEnquiryById(params.id)
  if (!doc) return errorResponse('Not found', 404)
  return json({ enquiry: doc })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:enquiries`, 60, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const parsed = enquiryStatusSchema.safeParse(body)
  if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())
  const ok = await setEnquiryStatus(params.id, parsed.data.status)
  if (!ok) return errorResponse('Not found', 404)
  return json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:enquiries`, 60, 60000)) return errorResponse('Too many requests', 429)
  const ok = await deleteEnquiry(params.id)
  if (!ok) return errorResponse('Not found', 404)
  return json({ ok: true })
}
