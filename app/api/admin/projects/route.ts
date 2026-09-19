import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { projectInputSchema } from '@/lib/schemas/project'
import { listProjects, createProject } from '@/lib/projects-service'

export async function GET(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const featured = searchParams.get('featured')
  const rows = await listProjects({
    search: searchParams.get('search') || undefined,
    status: status === 'draft' || status === 'published' ? status : undefined,
    featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
  })
  return json({ projects: rows })
}

export async function POST(req: Request) {
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
  const { id } = await createProject(parsed.data)
  return json({ id }, 201)
}
