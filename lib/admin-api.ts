import { auth } from '@/auth'

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export function errorResponse(message: string, status: number): Response {
  return json({ error: message }, status)
}

export function badRequest(message: string, issues?: unknown): Response {
  return json({ error: message, issues }, 400)
}

type AdminOk = { ok: true; userId: string }
type AdminFail = { ok: false; response: Response }

export async function requireAdmin(): Promise<AdminOk | AdminFail> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, response: errorResponse('Unauthorized', 401) }
  }
  return { ok: true, userId: session.user.id }
}
