import { z } from 'zod'
import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { reorderProjects } from '@/lib/projects-service'

const schema = z.object({ ids: z.array(z.string().length(24)).max(500) })

export async function PUT(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:projects`, 60, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())
  await reorderProjects(parsed.data.ids)
  return json({ ok: true })
}
