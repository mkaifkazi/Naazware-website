import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { settingsInputSchema } from '@/lib/schemas/settings'
import { getSettings, updateSettings } from '@/lib/settings-service'

export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  const s = await getSettings()
  return json({
    settings: {
      tagline: s.tagline,
      description: s.description,
      email: s.email,
      phone: s.phone,
      location: s.location,
      linkedin: s.socials.linkedin,
      twitter: s.socials.twitter,
      github: s.socials.github,
    },
  })
}

export async function PUT(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:settings`, 60, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const parsed = settingsInputSchema.safeParse(body)
  if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())
  await updateSettings(parsed.data)
  return json({ ok: true })
}
