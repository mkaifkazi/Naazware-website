import { listEnquiries } from '@/lib/enquiries-service'
import EnquiriesTable, { type EnquiryRow } from '@/components/admin/EnquiriesTable'

export const dynamic = 'force-dynamic'

export default async function InboxPage() {
  const rows = await listEnquiries()
  const initial: EnquiryRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    company: r.company,
    budget: r.budget,
    status: r.status,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : '',
  }))
  const unread = initial.filter((r) => r.status === 'new').length
  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-paper">Enquiries</h1>
        <p className="mt-1 text-sm text-paper-dim">
          {unread > 0 ? `${unread} new · ` : ''}Contact-form submissions.
        </p>
      </div>
      <div className="mt-8">
        <EnquiriesTable initial={initial} />
      </div>
    </div>
  )
}
