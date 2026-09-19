import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { signSchema } from '@/lib/schemas/media'
import { r2Configured, buildObjectKey, getSignedUploadUrl, publicUrl } from '@/lib/storage'

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!r2Configured()) return errorResponse('Storage not configured', 500)
  if (!rateLimit(`${gate.userId}:upload`, 120, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const parsed = signSchema.safeParse(body)
  if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())
  const key = buildObjectKey(parsed.data.folder || 'uploads', parsed.data.filename)
  const uploadUrl = await getSignedUploadUrl(key, parsed.data.contentType)
  return json({ uploadUrl, key, publicUrl: publicUrl(key) })
}
