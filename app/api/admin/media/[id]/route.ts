import { requireAdmin, json, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { deleteMedia } from '@/lib/media'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:upload`, 120, 60000)) return errorResponse('Too many requests', 429)
  const ok = await deleteMedia(params.id)
  if (!ok) return errorResponse('Not found', 404)
  return json({ ok: true })
}
