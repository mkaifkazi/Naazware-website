'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiSend } from '@/lib/admin-client'
import { Button, Field, TextInput, TextArea, Toggle } from './ui'
import ImageField, { type ImageValue } from './ImageField'

export type EditorValues = {
  name: string
  role: string
  company: string
  quote: string
  image: ImageValue
  companyLogo: ImageValue
  featured: boolean
  published: boolean
}

export const emptyValues: EditorValues = {
  name: '', role: '', company: '', quote: '',
  image: null, companyLogo: null, featured: false, published: true,
}

export default function TestimonialEditor({
  mode,
  id,
  initial,
}: {
  mode: 'create' | 'edit'
  id?: string
  initial: EditorValues
}) {
  const router = useRouter()
  const [v, setV] = useState<EditorValues>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof EditorValues>(k: K, val: EditorValues[K]) => setV((prev) => ({ ...prev, [k]: val }))

  function buildPayload() {
    return {
      name: v.name,
      role: v.role || undefined,
      company: v.company || undefined,
      quote: v.quote,
      image: v.image?.id || null,
      companyLogo: v.companyLogo?.id || null,
      featured: v.featured,
      published: v.published,
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (mode === 'create') {
        await apiSend('/api/admin/testimonials', 'POST', buildPayload())
      } else {
        await apiSend(`/api/admin/testimonials/${id}`, 'PUT', buildPayload())
      }
      router.push('/admin/testimonials')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-paper">{mode === 'create' ? 'New testimonial' : 'Edit testimonial'}</h1>
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={() => router.push('/admin/testimonials')}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>

      {error && <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>}

      <section className="space-y-4">
        <Field label="Quote"><TextArea value={v.quote} onChange={(e) => set('quote', e.target.value)} rows={3} required /></Field>
        <Field label="Name"><TextInput value={v.name} onChange={(e) => set('name', e.target.value)} required /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role"><TextInput value={v.role} onChange={(e) => set('role', e.target.value)} /></Field>
          <Field label="Company"><TextInput value={v.company} onChange={(e) => set('company', e.target.value)} /></Field>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <ImageField label="Portrait" folder="testimonials" value={v.image} onChange={(val) => set('image', val)} />
        <ImageField label="Company logo" folder="testimonials" value={v.companyLogo} onChange={(val) => set('companyLogo', val)} />
      </section>

      <section className="flex items-center gap-8">
        <Toggle checked={v.featured} onChange={(val) => set('featured', val)} label="Featured" />
        <Toggle checked={v.published} onChange={(val) => set('published', val)} label="Published" />
      </section>

      <div className="flex justify-end gap-3 border-t border-ink-600 pt-6">
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/testimonials')}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save testimonial'}</Button>
      </div>
    </form>
  )
}
