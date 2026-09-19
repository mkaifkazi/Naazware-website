'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiSend } from '@/lib/admin-client'
import { Button, Field, TextInput, TextArea, Select, Toggle, TagInput } from './ui'
import ImageField, { type ImageValue } from './ImageField'
import MediaPicker from './MediaPicker'

export type EditorValues = {
  title: string
  slug: string
  client: string
  industry: string
  shortDescription: string
  fullDescription: string
  challenge: string
  solution: string
  outcome: string
  services: string[]
  technologies: string[]
  metrics: { label: string; value: string }[]
  cover: ImageValue
  gallery: { id: string; url: string }[]
  videoUrl: string
  externalUrl: string
  testimonial: { quote: string; author: string; role: string }
  featured: boolean
  status: 'draft' | 'published'
  seo: { title: string; description: string; ogImage: ImageValue }
}

export const emptyValues: EditorValues = {
  title: '', slug: '', client: '', industry: '', shortDescription: '', fullDescription: '',
  challenge: '', solution: '', outcome: '', services: [], technologies: [], metrics: [],
  cover: null, gallery: [], videoUrl: '', externalUrl: '',
  testimonial: { quote: '', author: '', role: '' }, featured: false, status: 'draft',
  seo: { title: '', description: '', ogImage: null },
}

export default function ProjectEditor({
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
      title: v.title,
      slug: v.slug || undefined,
      client: v.client,
      industry: v.industry || undefined,
      shortDescription: v.shortDescription,
      fullDescription: v.fullDescription || undefined,
      challenge: v.challenge || undefined,
      solution: v.solution || undefined,
      outcome: v.outcome || undefined,
      services: v.services,
      technologies: v.technologies,
      metrics: v.metrics.filter((m) => m.label || m.value),
      coverMedia: v.cover?.id || null,
      gallery: v.gallery.map((g) => g.id),
      videoUrl: v.videoUrl || undefined,
      externalUrl: v.externalUrl || undefined,
      testimonial: v.testimonial.quote ? v.testimonial : null,
      featured: v.featured,
      status: v.status,
      seo: {
        title: v.seo.title || undefined,
        description: v.seo.description || undefined,
        ogImage: v.seo.ogImage?.url || undefined,
      },
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (mode === 'create') {
        await apiSend('/api/admin/projects', 'POST', buildPayload())
      } else {
        await apiSend(`/api/admin/projects/${id}`, 'PUT', buildPayload())
      }
      router.push('/admin/projects')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-paper">{mode === 'create' ? 'New project' : 'Edit project'}</h1>
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={() => router.push('/admin/projects')}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </div>

      {error && <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>}

      <section className="space-y-4">
        <Field label="Title"><TextInput value={v.title} onChange={(e) => set('title', e.target.value)} required /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug" hint="Leave blank to auto-generate from title.">
            <TextInput value={v.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto" />
          </Field>
          <Field label="Client"><TextInput value={v.client} onChange={(e) => set('client', e.target.value)} required /></Field>
        </div>
        <Field label="Industry"><TextInput value={v.industry} onChange={(e) => set('industry', e.target.value)} /></Field>
        <Field label="Short description"><TextArea value={v.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} rows={2} required /></Field>
        <Field label="Full description"><TextArea value={v.fullDescription} onChange={(e) => set('fullDescription', e.target.value)} rows={5} /></Field>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Field label="Challenge"><TextArea value={v.challenge} onChange={(e) => set('challenge', e.target.value)} /></Field>
        <Field label="Solution"><TextArea value={v.solution} onChange={(e) => set('solution', e.target.value)} /></Field>
        <Field label="Outcome"><TextArea value={v.outcome} onChange={(e) => set('outcome', e.target.value)} /></Field>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Services"><TagInput value={v.services} onChange={(val) => set('services', val)} placeholder="Add a service" /></Field>
        <Field label="Technologies"><TagInput value={v.technologies} onChange={(val) => set('technologies', val)} placeholder="Add a technology" /></Field>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-paper-dim">Metrics</span>
          <Button type="button" variant="ghost" onClick={() => set('metrics', [...v.metrics, { label: '', value: '' }])}>
            Add metric
          </Button>
        </div>
        <div className="space-y-2">
          {v.metrics.map((m, i) => (
            <div key={i} className="flex gap-2">
              <TextInput
                placeholder="Label"
                value={m.label}
                onChange={(e) => set('metrics', v.metrics.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
              <TextInput
                placeholder="Value"
                value={m.value}
                onChange={(e) => set('metrics', v.metrics.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
              />
              <Button type="button" variant="ghost" onClick={() => set('metrics', v.metrics.filter((_, j) => j !== i))}>×</Button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <ImageField label="Cover image" folder="projects" value={v.cover} onChange={(val) => set('cover', val)} />
        <GalleryField value={v.gallery} onChange={(val) => set('gallery', val)} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Video URL"><TextInput value={v.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} placeholder="https://…" /></Field>
        <Field label="External URL"><TextInput value={v.externalUrl} onChange={(e) => set('externalUrl', e.target.value)} placeholder="https://…" /></Field>
      </section>

      <section className="space-y-4">
        <span className="text-sm font-medium text-paper-dim">Testimonial (optional)</span>
        <Field label="Quote"><TextArea value={v.testimonial.quote} onChange={(e) => set('testimonial', { ...v.testimonial, quote: e.target.value })} rows={2} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Author"><TextInput value={v.testimonial.author} onChange={(e) => set('testimonial', { ...v.testimonial, author: e.target.value })} /></Field>
          <Field label="Role"><TextInput value={v.testimonial.role} onChange={(e) => set('testimonial', { ...v.testimonial, role: e.target.value })} /></Field>
        </div>
      </section>

      <section className="space-y-4">
        <span className="text-sm font-medium text-paper-dim">SEO</span>
        <Field label="SEO title"><TextInput value={v.seo.title} onChange={(e) => set('seo', { ...v.seo, title: e.target.value })} /></Field>
        <Field label="SEO description"><TextArea value={v.seo.description} onChange={(e) => set('seo', { ...v.seo, description: e.target.value })} rows={2} /></Field>
        <ImageField label="OG image" folder="og" value={v.seo.ogImage} onChange={(val) => set('seo', { ...v.seo, ogImage: val })} />
      </section>

      <section className="flex items-center gap-8">
        <Toggle checked={v.featured} onChange={(val) => set('featured', val)} label="Featured on home" />
        <Field label="Status">
          <Select value={v.status} onChange={(e) => set('status', e.target.value as 'draft' | 'published')}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </Field>
      </section>

      <div className="flex justify-end gap-3 border-t border-ink-600 pt-6">
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/projects')}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save project'}</Button>
      </div>
    </form>
  )
}

function GalleryField({ value, onChange }: { value: { id: string; url: string }[]; onChange: (v: { id: string; url: string }[]) => void }) {
  return (
    <Field label="Gallery">
      <div className="flex flex-wrap gap-3">
        {value.map((g) => (
          <div key={g.id} className="relative h-20 w-20 overflow-hidden rounded-lg border border-ink-600">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x.id !== g.id))}
              className="absolute right-0.5 top-0.5 rounded bg-black/60 px-1 text-xs text-red-300"
            >
              ×
            </button>
          </div>
        ))}
        <GalleryAdd onAdd={(m) => !value.some((x) => x.id === m.id) && onChange([...value, m])} />
      </div>
    </Field>
  )
}

function GalleryAdd({ onAdd }: { onAdd: (m: { id: string; url: string }) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-ink-600 text-2xl text-paper-faint hover:border-accent hover:text-accent-soft"
      >
        +
      </button>
      {open && <MediaPicker folder="projects" onClose={() => setOpen(false)} onSelect={(m) => { onAdd(m); setOpen(false) }} />}
    </>
  )
}
