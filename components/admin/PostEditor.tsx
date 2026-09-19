'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { JSONContent } from '@tiptap/react'
import { apiSend } from '@/lib/admin-client'
import { Button, Field, TextInput, TextArea, Select, TagInput } from './ui'
import ImageField, { type ImageValue } from './ImageField'
import RichTextEditor from './RichTextEditor'

export type EditorValues = {
  title: string
  slug: string
  excerpt: string
  cover: ImageValue
  content: JSONContent | null
  author: string
  category: string
  tags: string[]
  status: 'draft' | 'published'
  publishDate: string
  readTime: string
  seoTitle: string
  seoDescription: string
  ogImage: ImageValue
}

export const emptyValues: EditorValues = {
  title: '', slug: '', excerpt: '', cover: null, content: null,
  author: '', category: '', tags: [], status: 'draft',
  publishDate: '', readTime: '', seoTitle: '', seoDescription: '', ogImage: null,
}

export default function PostEditor({
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
      excerpt: v.excerpt,
      coverMedia: v.cover?.id || null,
      content: v.content ?? undefined,
      author: v.author || undefined,
      category: v.category || undefined,
      tags: v.tags,
      status: v.status,
      publishDate: v.publishDate ? new Date(v.publishDate).toISOString() : undefined,
      readTime: v.readTime || undefined,
      seoTitle: v.seoTitle || undefined,
      seoDescription: v.seoDescription || undefined,
      ogImage: v.ogImage?.url || undefined,
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (mode === 'create') {
        await apiSend('/api/admin/posts', 'POST', buildPayload())
      } else {
        await apiSend(`/api/admin/posts/${id}`, 'PUT', buildPayload())
      }
      router.push('/admin/journal')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-paper">{mode === 'create' ? 'New post' : 'Edit post'}</h1>
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" onClick={() => router.push('/admin/journal')}>Cancel</Button>
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
          <Field label="Category"><TextInput value={v.category} onChange={(e) => set('category', e.target.value)} /></Field>
        </div>
        <Field label="Excerpt"><TextArea value={v.excerpt} onChange={(e) => set('excerpt', e.target.value)} rows={2} required /></Field>
      </section>

      <section>
        <span className="mb-2 block text-sm font-medium text-paper-dim">Body</span>
        <RichTextEditor value={v.content} onChange={(json) => set('content', json)} />
      </section>

      <section className="space-y-4">
        <ImageField label="Cover image" folder="journal" value={v.cover} onChange={(val) => set('cover', val)} />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Field label="Author"><TextInput value={v.author} onChange={(e) => set('author', e.target.value)} placeholder="Naazware" /></Field>
        <Field label="Publish date"><TextInput type="date" value={v.publishDate} onChange={(e) => set('publishDate', e.target.value)} /></Field>
        <Field label="Read time"><TextInput value={v.readTime} onChange={(e) => set('readTime', e.target.value)} placeholder="5 min" /></Field>
      </section>

      <section>
        <Field label="Tags"><TagInput value={v.tags} onChange={(val) => set('tags', val)} placeholder="Add a tag" /></Field>
      </section>

      <section className="space-y-4">
        <span className="text-sm font-medium text-paper-dim">SEO</span>
        <Field label="SEO title"><TextInput value={v.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} /></Field>
        <Field label="SEO description"><TextArea value={v.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} rows={2} /></Field>
        <ImageField label="OG image" folder="og" value={v.ogImage} onChange={(val) => set('ogImage', val)} />
      </section>

      <section className="flex items-center gap-8">
        <Field label="Status">
          <Select value={v.status} onChange={(e) => set('status', e.target.value as 'draft' | 'published')}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </Field>
      </section>

      <div className="flex justify-end gap-3 border-t border-ink-600 pt-6">
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/journal')}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save post'}</Button>
      </div>
    </form>
  )
}
