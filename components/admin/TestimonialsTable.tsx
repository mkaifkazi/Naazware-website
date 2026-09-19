'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { apiGet, apiSend } from '@/lib/admin-client'
import { TextInput, Select } from './ui'

export type TestimonialRow = {
  id: string
  name: string
  company: string
  quote: string
  featured: boolean
  published: boolean
  order: number
  updatedAt: string
}

export default function TestimonialsTable({ initial }: { initial: TestimonialRow[] }) {
  const [rows, setRows] = useState<TestimonialRow[]>(initial)
  const [search, setSearch] = useState('')
  const [published, setPublished] = useState('')
  const [featured, setFeatured] = useState('')
  const [busy, setBusy] = useState(false)

  const query = useMemo(() => {
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (published) p.set('published', published)
    if (featured) p.set('featured', featured)
    const s = p.toString()
    return s ? `?${s}` : ''
  }, [search, published, featured])

  const filtering = query !== ''

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const { testimonials } = await apiGet<{ testimonials: TestimonialRow[] }>(`/api/admin/testimonials${query}`)
        setRows(testimonials)
      } catch {
        /* keep current rows on transient error */
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  async function move(index: number, dir: -1 | 1) {
    const next = [...rows]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setRows(next)
    setBusy(true)
    try {
      await apiSend('/api/admin/testimonials/reorder', 'POST', { ids: next.map((r) => r.id) })
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete testimonial from "${name}"? This cannot be undone.`)) return
    setBusy(true)
    try {
      await apiSend(`/api/admin/testimonials/${id}`, 'DELETE')
      setRows((prev) => prev.filter((r) => r.id !== id))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <TextInput
          placeholder="Search testimonials…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={published} onChange={(e) => setPublished(e.target.value)} className="max-w-[10rem]">
          <option value="">All</option>
          <option value="true">Published</option>
          <option value="false">Hidden</option>
        </Select>
        <Select value={featured} onChange={(e) => setFeatured(e.target.value)} className="max-w-[10rem]">
          <option value="">All</option>
          <option value="true">Featured</option>
          <option value="false">Not featured</option>
        </Select>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-ink-600">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-800/60 text-paper-dim">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Published</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-paper-faint">
                  No testimonials. Create your first one.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t border-ink-600/60 hover:bg-ink-800/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/testimonials/${r.id}`} className="font-medium text-paper hover:text-accent-soft">
                    {r.name}
                  </Link>
                  <div className="max-w-xs truncate text-xs text-paper-faint">{r.quote}</div>
                </td>
                <td className="px-4 py-3 text-paper-dim">{r.company || '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      r.published ? 'bg-accent/15 text-accent-soft' : 'bg-ink-700 text-paper-dim'
                    }`}
                  >
                    {r.published ? 'published' : 'hidden'}
                  </span>
                </td>
                <td className="px-4 py-3">{r.featured ? '★' : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      disabled={busy || filtering || i === 0}
                      onClick={() => move(i, -1)}
                      title={filtering ? 'Clear filters to reorder' : 'Move up'}
                      className="rounded-lg border border-ink-600 px-2 py-1 text-xs text-paper-dim hover:bg-ink-700 hover:text-paper disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      disabled={busy || filtering || i === rows.length - 1}
                      onClick={() => move(i, 1)}
                      title={filtering ? 'Clear filters to reorder' : 'Move down'}
                      className="rounded-lg border border-ink-600 px-2 py-1 text-xs text-paper-dim hover:bg-ink-700 hover:text-paper disabled:opacity-40"
                    >
                      ↓
                    </button>
                    <Link
                      href={`/admin/testimonials/${r.id}`}
                      className="rounded-lg border border-ink-600 px-3 py-1 text-xs text-paper-dim hover:bg-ink-700 hover:text-paper"
                    >
                      Edit
                    </Link>
                    <button
                      disabled={busy}
                      onClick={() => remove(r.id, r.name)}
                      className="rounded-lg border border-red-500/40 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtering && <p className="mt-3 text-xs text-paper-faint">Clear search and filters to reorder testimonials.</p>}
    </div>
  )
}
