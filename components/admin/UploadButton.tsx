'use client'
import { useRef, useState } from 'react'
import { apiSend } from '@/lib/admin-client'
import { Button } from './ui'

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf']
const MAX = 50 * 1024 * 1024

export type UploadedMedia = { id: string; url: string; key: string }

async function imageDimensions(file: File): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return {}
  try {
    const bitmap = await createImageBitmap(file)
    const dims = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return dims
  } catch {
    return {}
  }
}

export default function UploadButton({
  folder = 'uploads',
  onUploaded,
  label = 'Upload',
}: {
  folder?: string
  onUploaded: (m: UploadedMedia) => void
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File) {
    setError('')
    if (!ALLOWED.includes(file.type)) return setError('Unsupported file type')
    if (file.size > MAX) return setError('File too large (max 50MB)')
    setBusy(true)
    try {
      const { uploadUrl, key } = await apiSend<{ uploadUrl: string; key: string; publicUrl: string }>(
        '/api/admin/media/sign',
        'POST',
        { filename: file.name, contentType: file.type, folder }
      )
      const put = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'content-type': file.type } })
      if (!put.ok) throw new Error('Upload to storage failed')
      const dims = await imageDimensions(file)
      const media = await apiSend<UploadedMedia>('/api/admin/media', 'POST', {
        key,
        type: file.type,
        size: file.size,
        filename: file.name,
        ...dims,
      })
      onUploaded(media)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(',')}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
      <Button type="button" variant="ghost" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? 'Uploading…' : label}
      </Button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
