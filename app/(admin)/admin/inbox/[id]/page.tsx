import { notFound } from 'next/navigation'
import { getEnquiryById, setEnquiryStatus } from '@/lib/enquiries-service'
import EnquiryDetail from '@/components/admin/EnquiryDetail'

export const dynamic = 'force-dynamic'

export default async function EnquiryPage({ params }: { params: { id: string } }) {
  const doc = await getEnquiryById(params.id)
  if (!doc) notFound()

  // Auto-mark as read on open.
  const status = doc.status ?? 'new'
  if (status === 'new') {
    await setEnquiryStatus(params.id, 'read')
  }

  return (
    <EnquiryDetail
      id={params.id}
      name={doc.name}
      email={doc.email}
      company={doc.company ?? ''}
      budget={doc.budget ?? ''}
      message={doc.message}
      status={status === 'new' ? 'read' : status}
      createdAt={doc.createdAt ? new Date(doc.createdAt).toISOString() : ''}
    />
  )
}
