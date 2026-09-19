import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { projectInputSchema } from '@/lib/schemas/project'
import { getProjectById, updateProject, deleteProject } from '@/lib/projects-service'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  const doc = await getProjectById(params.id)
  if (!doc) return errorResponse('Not found', 404)
  return json({ project: doc })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:projects`, 60, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const parsed = projectInputSchema.safeParse(body)
  if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())
  const ok = await updateProject(params.id, parsed.data)
  if (!ok) return errorResponse('Not found', 404)
  return json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:projects`, 60, 60000)) return errorResponse('Too many requests', 429)
  const ok = await deleteProject(params.id)
  if (!ok) return errorResponse('Not found', 404)
  return json({ ok: true })
}
