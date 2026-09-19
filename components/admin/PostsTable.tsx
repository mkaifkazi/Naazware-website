'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { apiGet, apiSend } from '@/lib/admin-client'
import { TextInput, Select } from './ui'

export type PostRow = {
  id: string
  title: string
  slug: string
  status: string
  category: string
  publishDate: string
  updatedAt: string
}

export default function PostsTable({ initial }: { initial: PostRow[] }) {
  const [rows, setRows] = useState<PostRow[]>(initial)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

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
        const { posts } = await apiGet<{ posts: PostRow[] }>(`/api/admin/posts${query}`)
        setRows(posts)
      } catch {
        /* keep current rows on transient error */
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setBusy(true)
    try {
      await apiSend(`/api/admin/posts/${id}`, 'DELETE')
      setRows((prev) => prev.filter((r) => r.id !== id))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <TextInput
          placeholder="Search posts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[10rem]">
          <option value="">All status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </Select>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-ink-600">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-800/60 text-paper-dim">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-paper-faint">
                  No posts. Write your first one.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-ink-600/60 hover:bg-ink-800/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/journal/${r.id}`} className="font-medium text-paper hover:text-accent-soft">
                    {r.title}
                  </Link>
                  <div className="text-xs text-paper-faint">/{r.slug}</div>
                </td>
                <td className="px-4 py-3 text-paper-dim">{r.category || '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      r.status === 'published' ? 'bg-accent/15 text-accent-soft' : 'bg-ink-700 text-paper-dim'
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-paper-dim">{r.publishDate ? r.publishDate.slice(0, 10) : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/journal/${r.id}`}
                      className="rounded-lg border border-ink-600 px-3 py-1 text-xs text-paper-dim hover:bg-ink-700 hover:text-paper"
                    >
                      Edit
                    </Link>
                    <button
                      disabled={busy}
                      onClick={() => remove(r.id, r.title)}
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
    </div>
  )
}
