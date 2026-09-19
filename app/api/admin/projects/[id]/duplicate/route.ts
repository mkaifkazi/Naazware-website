import { requireAdmin, json, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { duplicateProject } from '@/lib/projects-service'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:projects`, 60, 60000)) return errorResponse('Too many requests', 429)
  const res = await duplicateProject(params.id)
  if (!res) return errorResponse('Not found', 404)
  return json({ id: res.id }, 201)
}
