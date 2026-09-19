'use client'
import { useEffect, useState } from 'react'
import { apiGet, apiSend } from '@/lib/admin-client'
import { Button, TextInput } from './ui'
import UploadButton, { type UploadedMedia } from './UploadButton'

export type MediaItem = {
  id: string
  key: string
  url: string
  type: string
  size: number
  alt?: string
  filename?: string
}

export default function MediaPicker({
  folder = 'uploads',
  onSelect,
  onClose,
}: {
  folder?: string
  onSelect: (m: { id: string; url: string }) => void
  onClose: () => void
}) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function load(q = '') {
    setLoading(true)
    try {
      const { media } = await apiGet<{ media: MediaItem[] }>(`/api/admin/media${q ? `?search=${encodeURIComponent(q)}` : ''}`)
      setItems(media)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function remove(id: string) {
    if (!confirm('Delete this file permanently?')) return
    await apiSend(`/api/admin/media/${id}`, 'DELETE')
    setItems((prev) => prev.filter((m) => m.id !== id))
  }

  function added(m: UploadedMedia) {
    setItems((prev) => [{ id: m.id, key: m.key, url: m.url, type: '', size: 0 }, ...prev])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-ink-600 bg-ink-800 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-paper">Media library</h2>
          <div className="flex items-center gap-2">
            <UploadButton folder={folder} onUploaded={added} label="Upload new" />
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>
        <div className="mt-3">
          <TextInput
            placeholder="Search by filename or alt…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(search)}
          />
        </div>
        <div className="mt-4 grid flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
          {loading && <p className="text-sm text-paper-faint">Loading…</p>}
          {!loading && items.length === 0 && <p className="text-sm text-paper-faint">No media yet. Upload something.</p>}
          {items.map((m) => (
            <div key={m.id} className="group relative overflow-hidden rounded-lg border border-ink-600 bg-ink-900">
              <button type="button" onClick={() => onSelect({ id: m.id, url: m.url })} className="block w-full">
                {m.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(m.url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.alt || m.filename || ''} className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square items-center justify-center text-xs text-paper-faint">
                    {m.filename || 'file'}
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => remove(m.id)}
                className="absolute right-1 top-1 hidden rounded bg-black/60 px-1.5 py-0.5 text-xs text-red-300 group-hover:block"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
