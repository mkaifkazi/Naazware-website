import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { postInputSchema } from '@/lib/schemas/post'
import { listPosts, createPost } from '@/lib/posts-service'

export async function GET(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const rows = await listPosts({
    search: searchParams.get('search') || undefined,
    status: status === 'draft' || status === 'published' ? status : undefined,
  })
  return json({ posts: rows })
}

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:posts`, 60, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const parsed = postInputSchema.safeParse(body)
  if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())
  const { id } = await createPost(parsed.data)
  return json({ id }, 201)
}
