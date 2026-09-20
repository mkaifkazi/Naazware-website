'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { apiGet } from '@/lib/admin-client'
import { TextInput, Select } from './ui'

export type EnquiryRow = {
  id: string
  name: string
  email: string
  company: string
  budget: string
  prefersCall: boolean
  phone: string
  preferredTime: string
  status: string
  createdAt: string
}

const BUDGET_LABELS: Record<string, string> = {
  'under-10k': 'Under $10,000',
  '10k-25k': '$10,000 - $25,000',
  '25k-50k': '$25,000 - $50,000',
  '50k-100k': '$50,000 - $100,000',
  'over-100k': 'Over $100,000',
}

export default function EnquiriesTable({ initial }: { initial: EnquiryRow[] }) {
  const [rows, setRows] = useState<EnquiryRow[]>(initial)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const query = useMemo(() => {
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (status) p.set('status', status)
    const s = p.toString()
    return s ? `?${s}` : ''
  }, [search, status])

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const { enquiries } = await apiGet<{ enquiries: EnquiryRow[] }>(`/api/admin/enquiries${query}`)
        setRows(enquiries)
      } catch {
        /* keep current rows on transient error */
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <TextInput
          placeholder="Search enquiries…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[10rem]">
          <option value="">All status</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-ink-600">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-800/60 text-paper-dim">
            <tr>
              <th className="px-4 py-3 font-medium">From</th>
              <th className="px-4 py-3 font-medium">Budget</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Received</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-paper-faint">
                  No enquiries yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-ink-600/60 hover:bg-ink-800/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/inbox/${r.id}`} className="font-medium text-paper hover:text-accent-soft">
                    {r.name}
                    {r.status === 'new' && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-accent align-middle" />}
                  </Link>
                  <div className="text-xs text-paper-faint">{r.email}{r.company ? ` · ${r.company}` : ''}</div>
                  {r.prefersCall && (
                    <span className="mt-1 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent-soft">
                      📞 wants a call
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-paper-dim">{BUDGET_LABELS[r.budget] || r.budget || '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      r.status === 'new'
                        ? 'bg-accent/15 text-accent-soft'
                        : r.status === 'archived'
                          ? 'bg-ink-700 text-paper-faint'
                          : 'bg-ink-700 text-paper-dim'
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-paper-dim">{r.createdAt ? r.createdAt.slice(0, 10) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
