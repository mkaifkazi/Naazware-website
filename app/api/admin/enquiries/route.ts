import { requireAdmin, json } from '@/lib/admin-api'
import { listEnquiries } from '@/lib/enquiries-service'
import type { EnquiryStatus } from '@/lib/schemas/enquiry'

export async function GET(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const valid = status === 'new' || status === 'read' || status === 'archived'
  const rows = await listEnquiries({
    search: searchParams.get('search') || undefined,
    status: valid ? (status as EnquiryStatus) : undefined,
  })
  return json({ enquiries: rows })
}
