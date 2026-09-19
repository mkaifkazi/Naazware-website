'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiSend } from '@/lib/admin-client'
import { Button } from './ui'

const BUDGET_LABELS: Record<string, string> = {
  'under-10k': 'Under $10,000',
  '10k-25k': '$10,000 - $25,000',
  '25k-50k': '$25,000 - $50,000',
  '50k-100k': '$50,000 - $100,000',
  'over-100k': 'Over $100,000',
}

export default function EnquiryDetail({
  id, name, email, company, budget, message, status, createdAt,
}: {
  id: string
  name: string
  email: string
  company: string
  budget: string
  message: string
  status: string
  createdAt: string
}) {
  const router = useRouter()
  const [current, setCurrent] = useState(status)
  const [busy, setBusy] = useState(false)

  async function setStatus(next: 'new' | 'read' | 'archived') {
    setBusy(true)
    try {
      await apiSend(`/api/admin/enquiries/${id}`, 'PATCH', { status: next })
      setCurrent(next)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!confirm(`Delete the enquiry from "${name}"? This cannot be undone.`)) return
    setBusy(true)
    try {
      await apiSend(`/api/admin/enquiries/${id}`, 'DELETE')
      router.push('/admin/inbox')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/inbox')}>← Inbox</Button>
        <div className="flex items-center gap-2">
          {current !== 'read' && <Button type="button" variant="ghost" disabled={busy} onClick={() => setStatus('read')}>Mark read</Button>}
          {current !== 'new' && <Button type="button" variant="ghost" disabled={busy} onClick={() => setStatus('new')}>Mark unread</Button>}
          {current !== 'archived' && <Button type="button" variant="ghost" disabled={busy} onClick={() => setStatus('archived')}>Archive</Button>}
          <Button type="button" variant="danger" disabled={busy} onClick={remove}>Delete</Button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-ink-600 bg-ink-800/40 p-6">
        <h1 className="text-2xl font-semibold text-paper">{name}</h1>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-paper-dim">
          <a href={`mailto:${email}`} className="hover:text-accent-soft">{email}</a>
          {company && <span>· {company}</span>}
          <span>· {BUDGET_LABELS[budget] || budget || 'No budget'}</span>
          <span>· {createdAt ? new Date(createdAt).toLocaleString() : ''}</span>
          <span>· <span className="text-paper-faint">{current}</span></span>
        </div>
        <hr className="my-5 border-ink-600" />
        <p className="whitespace-pre-wrap text-paper">{message}</p>
      </div>

      <div className="mt-6">
        <a href={`mailto:${email}?subject=Re: your enquiry`} className="btn-accent inline-block">Reply by email</a>
      </div>
    </div>
  )
}
