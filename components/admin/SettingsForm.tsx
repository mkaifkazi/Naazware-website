'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiSend } from '@/lib/admin-client'
import { Button, Field, TextInput, TextArea } from './ui'

export type SettingsValues = {
  tagline: string
  description: string
  email: string
  phone: string
  location: string
  linkedin: string
  twitter: string
  github: string
}

export default function SettingsForm({ initial }: { initial: SettingsValues }) {
  const router = useRouter()
  const [v, setV] = useState<SettingsValues>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const set = <K extends keyof SettingsValues>(k: K, val: SettingsValues[K]) =>
    setV((prev) => ({ ...prev, [k]: val }))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await apiSend('/api/admin/settings', 'PUT', v)
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-paper">Settings</h1>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </div>

      {error && <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</p>}
      {saved && <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">Saved.</p>}

      <section className="space-y-4">
        <span className="text-sm font-medium text-paper-dim">Brand</span>
        <Field label="Tagline"><TextInput value={v.tagline} onChange={(e) => set('tagline', e.target.value)} /></Field>
        <Field label="Description"><TextArea value={v.description} onChange={(e) => set('description', e.target.value)} rows={3} /></Field>
      </section>

      <section className="space-y-4">
        <span className="text-sm font-medium text-paper-dim">Contact</span>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email"><TextInput type="email" value={v.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Phone"><TextInput value={v.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
        </div>
        <Field label="Location"><TextInput value={v.location} onChange={(e) => set('location', e.target.value)} /></Field>
      </section>

      <section className="space-y-4">
        <span className="text-sm font-medium text-paper-dim">Social links</span>
        <Field label="LinkedIn URL"><TextInput value={v.linkedin} onChange={(e) => set('linkedin', e.target.value)} placeholder="https://…" /></Field>
        <Field label="X (Twitter) URL"><TextInput value={v.twitter} onChange={(e) => set('twitter', e.target.value)} placeholder="https://…" /></Field>
        <Field label="GitHub URL"><TextInput value={v.github} onChange={(e) => set('github', e.target.value)} placeholder="https://…" /></Field>
      </section>

      <div className="flex justify-end border-t border-ink-600 pt-6">
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</Button>
      </div>
    </form>
  )
}
