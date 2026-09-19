# Phase 5 — Testimonials Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the admin full CRUD + publish/feature/reorder control over testimonials, backed by Mongo and surfaced on the public site (already wired via `lib/content.ts`).

**Architecture:** Mirror the P4 Projects vertical exactly: a zod input schema → a service layer over the existing `Testimonial` mongoose model → auth-gated, rate-limited API route handlers → admin UI (list table + editor) reusing existing `components/admin` primitives and `MediaPicker`. No new dependencies. No public-site changes: `getTestimonials()` in `lib/content.ts` already reads published testimonials from Mongo, ordered by `order`.

**Tech Stack:** Next.js App Router, TypeScript, Mongoose, zod, Auth.js (`requireAdmin`), Vitest + in-memory Mongo (`setupTestDb`), Tailwind.

## Global Constraints

- All work stays on branch `feat/custom-cms`. Never touch `master`.
- Every admin API route: `requireAdmin` gate first; mutations also `rateLimit(\`${gate.userId}:testimonials\`, 60, 60000)` and return 429 on limit; validate body with the zod schema, `badRequest` on failure.
- Media references (`image`, `companyLogo`) are stored as 24-char ObjectId hex strings or null. UI resolves them to URLs via `getMediaByIds`.
- `order` is NOT part of the input schema — it is managed only by the reorder endpoint (same as projects).
- Gate must stay GREEN after every task: `npm run test` · `npm run type-check` · `npm run lint`.
- Match existing file style: 2-space indent, no semicolons, single quotes, `@/` path alias.

## File Structure

- Create `lib/schemas/testimonial.ts` — zod `testimonialInputSchema` + `TestimonialInput` type.
- Create `lib/testimonials-service.ts` — CRUD + list + reorder over the `Testimonial` model.
- Create `lib/testimonials-service.test.ts` — service unit tests against in-memory Mongo.
- Create `app/api/admin/testimonials/route.ts` — GET (list) + POST (create).
- Create `app/api/admin/testimonials/[id]/route.ts` — GET + PUT + DELETE.
- Create `app/api/admin/testimonials/reorder/route.ts` — POST (reorder).
- Create `components/admin/TestimonialsTable.tsx` — client list (search / publish filter / feature filter / move up-down / delete).
- Create `components/admin/TestimonialEditor.tsx` — client create/edit form.
- Create `app/(admin)/admin/testimonials/page.tsx` — server list page.
- Create `app/(admin)/admin/testimonials/new/page.tsx` — new form page.
- Create `app/(admin)/admin/testimonials/[id]/page.tsx` — edit form page.
- No modification needed: `components/admin/Sidebar.tsx` already links `/admin/testimonials`; `lib/content.ts` already reads Mongo.

---

### Task 1: Schema + service + service tests (backend logic)

**Files:**
- Create: `lib/schemas/testimonial.ts`
- Create: `lib/testimonials-service.ts`
- Test: `lib/testimonials-service.test.ts`

**Interfaces:**
- Consumes: `connectDb` from `@/lib/db`; `Testimonial`, `TestimonialDoc` from `@/lib/models/Testimonial`; `setupTestDb` from `@/test/setup-db`.
- Produces:
  - `testimonialInputSchema: z.ZodType` and `type TestimonialInput` (in `lib/schemas/testimonial.ts`).
  - `type AdminTestimonialRow = { id: string; name: string; company: string; quote: string; featured: boolean; published: boolean; order: number; updatedAt: Date }`.
  - `createTestimonial(input: TestimonialInput): Promise<{ id: string }>`
  - `getTestimonialById(id: string): Promise<TestimonialDoc | null>`
  - `updateTestimonial(id: string, input: TestimonialInput): Promise<boolean>`
  - `deleteTestimonial(id: string): Promise<boolean>`
  - `listTestimonials(opts?: { search?: string; published?: boolean; featured?: boolean }): Promise<AdminTestimonialRow[]>`
  - `reorderTestimonials(ids: string[]): Promise<void>`

- [ ] **Step 1: Write the schema**

Create `lib/schemas/testimonial.ts`:

```ts
import { z } from 'zod'

export const testimonialInputSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
  quote: z.string().min(1).max(2000),
  image: z.string().length(24).nullable().optional(),
  companyLogo: z.string().length(24).nullable().optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
})

export type TestimonialInput = z.infer<typeof testimonialInputSchema>
```

- [ ] **Step 2: Write the failing service tests**

Create `lib/testimonials-service.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import {
  createTestimonial, updateTestimonial, getTestimonialById,
  listTestimonials, deleteTestimonial, reorderTestimonials,
} from './testimonials-service'

const base = { featured: false, published: true }

describe('testimonials-service', () => {
  setupTestDb()

  it('createTestimonial stores with defaults', async () => {
    const { id } = await createTestimonial({ ...base, name: 'Ada', quote: 'Great work' })
    const doc = await getTestimonialById(id)
    expect(doc?.name).toBe('Ada')
    expect(doc?.published).toBe(true)
    expect(doc?.featured).toBe(false)
  })

  it('updateTestimonial changes fields', async () => {
    const { id } = await createTestimonial({ ...base, name: 'Grace', quote: 'Nice' })
    const ok = await updateTestimonial(id, { ...base, name: 'Grace H.', quote: 'Nice', published: false })
    expect(ok).toBe(true)
    const doc = await getTestimonialById(id)
    expect(doc?.name).toBe('Grace H.')
    expect(doc?.published).toBe(false)
  })

  it('updateTestimonial returns false for missing id', async () => {
    const ok = await updateTestimonial('507f1f77bcf86cd799439011', { ...base, name: 'X', quote: 'Y' })
    expect(ok).toBe(false)
  })

  it('listTestimonials filters by published, featured and search', async () => {
    await createTestimonial({ ...base, name: 'Pub Featured', company: 'Acme', quote: 'q', featured: true, published: true })
    await createTestimonial({ ...base, name: 'Hidden', company: 'Beta', quote: 'q', published: false })
    expect((await listTestimonials({ published: true })).length).toBe(1)
    expect((await listTestimonials({ featured: true })).length).toBe(1)
    const found = await listTestimonials({ search: 'Beta' })
    expect(found.map((t) => t.name)).toContain('Hidden')
  })

  it('deleteTestimonial removes it', async () => {
    const { id } = await createTestimonial({ ...base, name: 'Temp', quote: 'q' })
    expect(await deleteTestimonial(id)).toBe(true)
    expect(await getTestimonialById(id)).toBeNull()
  })

  it('reorderTestimonials sets order by index', async () => {
    const a = await createTestimonial({ ...base, name: 'A', quote: 'q' })
    const b = await createTestimonial({ ...base, name: 'B', quote: 'q' })
    await reorderTestimonials([b.id, a.id])
    expect((await getTestimonialById(b.id))?.order).toBe(0)
    expect((await getTestimonialById(a.id))?.order).toBe(1)
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm run test -- testimonials-service`
Expected: FAIL — `Failed to resolve import "./testimonials-service"` (module not created yet).

- [ ] **Step 4: Write the service**

Create `lib/testimonials-service.ts`:

```ts
import { connectDb } from './db'
import { Testimonial, type TestimonialDoc } from './models/Testimonial'
import type { TestimonialInput } from './schemas/testimonial'

export type AdminTestimonialRow = {
  id: string
  name: string
  company: string
  quote: string
  featured: boolean
  published: boolean
  order: number
  updatedAt: Date
}

function applyInput(doc: Record<string, unknown>, input: TestimonialInput) {
  doc.name = input.name
  doc.role = input.role ?? ''
  doc.company = input.company ?? ''
  doc.quote = input.quote
  doc.image = input.image || undefined
  doc.companyLogo = input.companyLogo || undefined
  doc.featured = input.featured ?? false
  doc.published = input.published ?? true
}

export async function createTestimonial(input: TestimonialInput): Promise<{ id: string }> {
  await connectDb()
  const doc: Record<string, unknown> = {}
  applyInput(doc, input)
  const created = await Testimonial.create(doc)
  return { id: String(created._id) }
}

export async function getTestimonialById(id: string): Promise<TestimonialDoc | null> {
  await connectDb()
  return Testimonial.findById(id).lean<TestimonialDoc>()
}

export async function updateTestimonial(id: string, input: TestimonialInput): Promise<boolean> {
  await connectDb()
  const doc = await Testimonial.findById(id)
  if (!doc) return false
  const patch: Record<string, unknown> = {}
  applyInput(patch, input)
  doc.set(patch)
  await doc.save()
  return true
}

export async function deleteTestimonial(id: string): Promise<boolean> {
  await connectDb()
  const res = await Testimonial.findByIdAndDelete(id)
  return Boolean(res)
}

export async function reorderTestimonials(ids: string[]): Promise<void> {
  await connectDb()
  await Promise.all(ids.map((id, index) => Testimonial.updateOne({ _id: id }, { $set: { order: index } })))
}

export async function listTestimonials(
  opts: { search?: string; published?: boolean; featured?: boolean } = {}
): Promise<AdminTestimonialRow[]> {
  await connectDb()
  const filter: Record<string, unknown> = {}
  if (typeof opts.published === 'boolean') filter.published = opts.published
  if (typeof opts.featured === 'boolean') filter.featured = opts.featured
  if (opts.search) {
    const rx = new RegExp(opts.search, 'i')
    filter.$or = [{ name: rx }, { company: rx }, { quote: rx }]
  }
  const rows = await Testimonial.find(filter)
    .sort({ order: 1, updatedAt: -1 })
    .lean<(TestimonialDoc & { _id: unknown; updatedAt: Date })[]>()
  return rows.map((t) => ({
    id: String(t._id),
    name: t.name,
    company: t.company ?? '',
    quote: t.quote,
    featured: Boolean(t.featured),
    published: Boolean(t.published),
    order: t.order ?? 0,
    updatedAt: t.updatedAt,
  }))
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test -- testimonials-service`
Expected: PASS (6 tests).

- [ ] **Step 6: Verify gate**

Run: `npm run type-check` then `npm run lint`
Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add lib/schemas/testimonial.ts lib/testimonials-service.ts lib/testimonials-service.test.ts
git commit -m "feat: testimonials zod schema + service layer (CRUD, list, reorder)"
```

---

### Task 2: Admin API routes

**Files:**
- Create: `app/api/admin/testimonials/route.ts`
- Create: `app/api/admin/testimonials/[id]/route.ts`
- Create: `app/api/admin/testimonials/reorder/route.ts`

**Interfaces:**
- Consumes: `requireAdmin`, `json`, `badRequest`, `errorResponse` from `@/lib/admin-api`; `rateLimit` from `@/lib/rate-limit`; `testimonialInputSchema` from `@/lib/schemas/testimonial`; the Task 1 service functions.
- Produces (HTTP contract the UI consumes):
  - `GET /api/admin/testimonials?search=&published=true|false&featured=true|false` → `{ testimonials: AdminTestimonialRow[] }`
  - `POST /api/admin/testimonials` (body = `TestimonialInput`) → `{ id }` 201
  - `GET /api/admin/testimonials/[id]` → `{ testimonial: TestimonialDoc }` | 404
  - `PUT /api/admin/testimonials/[id]` (body = `TestimonialInput`) → `{ ok: true }` | 404
  - `DELETE /api/admin/testimonials/[id]` → `{ ok: true }` | 404
  - `POST /api/admin/testimonials/reorder` (body = `{ ids: string[] }`) → `{ ok: true }`

- [ ] **Step 1: Write the list + create route**

Create `app/api/admin/testimonials/route.ts`:

```ts
import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { testimonialInputSchema } from '@/lib/schemas/testimonial'
import { listTestimonials, createTestimonial } from '@/lib/testimonials-service'

export async function GET(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  const { searchParams } = new URL(req.url)
  const published = searchParams.get('published')
  const featured = searchParams.get('featured')
  const rows = await listTestimonials({
    search: searchParams.get('search') || undefined,
    published: published === 'true' ? true : published === 'false' ? false : undefined,
    featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
  })
  return json({ testimonials: rows })
}

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:testimonials`, 60, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const parsed = testimonialInputSchema.safeParse(body)
  if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())
  const { id } = await createTestimonial(parsed.data)
  return json({ id }, 201)
}
```

- [ ] **Step 2: Write the id route**

Create `app/api/admin/testimonials/[id]/route.ts`:

```ts
import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { testimonialInputSchema } from '@/lib/schemas/testimonial'
import { getTestimonialById, updateTestimonial, deleteTestimonial } from '@/lib/testimonials-service'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  const doc = await getTestimonialById(params.id)
  if (!doc) return errorResponse('Not found', 404)
  return json({ testimonial: doc })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:testimonials`, 60, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const parsed = testimonialInputSchema.safeParse(body)
  if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())
  const ok = await updateTestimonial(params.id, parsed.data)
  if (!ok) return errorResponse('Not found', 404)
  return json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:testimonials`, 60, 60000)) return errorResponse('Too many requests', 429)
  const ok = await deleteTestimonial(params.id)
  if (!ok) return errorResponse('Not found', 404)
  return json({ ok: true })
}
```

- [ ] **Step 3: Write the reorder route**

Create `app/api/admin/testimonials/reorder/route.ts`:

```ts
import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { reorderTestimonials } from '@/lib/testimonials-service'

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:testimonials`, 60, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const ids = (body as { ids?: unknown }).ids
  if (!Array.isArray(ids) || !ids.every((x) => typeof x === 'string')) return badRequest('ids must be a string array')
  await reorderTestimonials(ids as string[])
  return json({ ok: true })
}
```

- [ ] **Step 4: Verify gate**

Run: `npm run type-check` then `npm run lint`
Expected: both clean (routes compile; no tests added — HTTP paths verified live in Task 4).

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/testimonials
git commit -m "feat: testimonials admin API routes (auth-gated, validated, rate-limited)"
```

---

### Task 3: Admin UI — table + editor + pages

**Files:**
- Create: `components/admin/TestimonialsTable.tsx`
- Create: `components/admin/TestimonialEditor.tsx`
- Create: `app/(admin)/admin/testimonials/page.tsx`
- Create: `app/(admin)/admin/testimonials/new/page.tsx`
- Create: `app/(admin)/admin/testimonials/[id]/page.tsx`

**Interfaces:**
- Consumes: `apiGet`, `apiSend` from `@/lib/admin-client`; `Button`, `Field`, `TextInput`, `TextArea`, `Select`, `Toggle` from `@/components/admin/ui`; `ImageField`, `ImageValue` from `@/components/admin/ImageField`; `listTestimonials` + `getTestimonialById` from `@/lib/testimonials-service`; `getMediaByIds` from `@/lib/media`; the Task 2 HTTP contract.
- Produces:
  - `TestimonialRow = { id; name; company; quote; featured; published; order; updatedAt: string }` (exported from `TestimonialsTable.tsx`).
  - `EditorValues` + `emptyValues` + default export `TestimonialEditor` (from `TestimonialEditor.tsx`).

- [ ] **Step 1: Write the table component**

Create `components/admin/TestimonialsTable.tsx`. Ordering is edited with Move up / Move down buttons that POST the reordered id list to `/api/admin/testimonials/reorder` (dependency-free; drag-and-drop can be layered on later without changing the API):

```tsx
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

  async function refresh() {
    const { testimonials } = await apiGet<{ testimonials: TestimonialRow[] }>(`/api/admin/testimonials${query}`)
    setRows(testimonials)
  }

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
```

- [ ] **Step 2: Write the editor component**

Create `components/admin/TestimonialEditor.tsx`:

```tsx
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
```

- [ ] **Step 3: Write the list page**

Create `app/(admin)/admin/testimonials/page.tsx`:

```tsx
import Link from 'next/link'
import { listTestimonials } from '@/lib/testimonials-service'
import TestimonialsTable, { type TestimonialRow } from '@/components/admin/TestimonialsTable'

export const dynamic = 'force-dynamic'

export default async function TestimonialsPage() {
  const rows = await listTestimonials()
  const initial: TestimonialRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    company: r.company,
    quote: r.quote,
    featured: r.featured,
    published: r.published,
    order: r.order,
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : '',
  }))
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-paper">Testimonials</h1>
          <p className="mt-1 text-sm text-paper-dim">Manage client quotes shown on the site.</p>
        </div>
        <Link
          href="/admin/testimonials/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-contrast hover:opacity-90"
        >
          New testimonial
        </Link>
      </div>
      <div className="mt-8">
        <TestimonialsTable initial={initial} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write the new page**

Create `app/(admin)/admin/testimonials/new/page.tsx`:

```tsx
import TestimonialEditor, { emptyValues } from '@/components/admin/TestimonialEditor'

export const dynamic = 'force-dynamic'

export default function NewTestimonialPage() {
  return <TestimonialEditor mode="create" initial={emptyValues} />
}
```

- [ ] **Step 5: Write the edit page**

Create `app/(admin)/admin/testimonials/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { getTestimonialById } from '@/lib/testimonials-service'
import { getMediaByIds } from '@/lib/media'
import TestimonialEditor, { emptyValues, type EditorValues } from '@/components/admin/TestimonialEditor'

export const dynamic = 'force-dynamic'

export default async function EditTestimonialPage({ params }: { params: { id: string } }) {
  const doc = await getTestimonialById(params.id)
  if (!doc) notFound()

  const imageId = doc.image ? String(doc.image) : ''
  const logoId = doc.companyLogo ? String(doc.companyLogo) : ''
  const wanted = [imageId, logoId].filter(Boolean)
  const resolved = await getMediaByIds(wanted)
  const urlById = new Map(resolved.map((m) => [m.id, m.url]))

  const initial: EditorValues = {
    ...emptyValues,
    name: doc.name ?? '',
    role: doc.role ?? '',
    company: doc.company ?? '',
    quote: doc.quote ?? '',
    image: imageId && urlById.has(imageId) ? { id: imageId, url: urlById.get(imageId) as string } : null,
    companyLogo: logoId && urlById.has(logoId) ? { id: logoId, url: urlById.get(logoId) as string } : null,
    featured: Boolean(doc.featured),
    published: Boolean(doc.published),
  }

  return <TestimonialEditor mode="edit" id={params.id} initial={initial} />
}
```

- [ ] **Step 6: Verify gate**

Run: `npm run type-check` then `npm run lint`
Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add "app/(admin)/admin/testimonials" components/admin/TestimonialsTable.tsx components/admin/TestimonialEditor.tsx
git commit -m "feat: testimonials admin UI (list, editor, reorder, media picker)"
```

---

### Task 4: Live verification + docs

**Files:**
- Modify: `docs/HANDOVER.md` (RESUME + status)
- Modify: `docs/ROADMAP.md` (mark P5 done, note next = P6)

- [ ] **Step 1: Full gate**

Run: `npm run test` then `npm run type-check` then `npm run lint`
Expected: all tests pass (39 total: prior 33 + 6 new), type-check + lint clean.

- [ ] **Step 2: Live HTTP smoke test**

Start the dev server (`npm run dev`) with the DIRECT (non-SRV) `MONGODB_URI` from `.env.local` (see HANDOVER env note). Log in at `/admin/login` (kaifkazi40@gmail.com / `Naazware@2026`) to get a session cookie, then verify with that cookie:
- `GET /api/admin/testimonials` → 200 `{ testimonials: [...] }`
- unauthenticated `GET /api/admin/testimonials` → 401
- `POST /api/admin/testimonials` with `{ "name": "Test Co", "quote": "Excellent partner", "published": true }` → 201 `{ id }`
- created testimonial appears in `GET /api/admin/testimonials` and on the public site (`getTestimonials()` — check the public page that renders testimonials)
- `POST /api/admin/testimonials/reorder` with `{ "ids": [<id2>, <id1>] }` → 200; confirm order flips in the list
- `DELETE /api/admin/testimonials/[id]` → 200; gone from list

Record the exact results (status codes + observed effects) in the commit message / HANDOVER.

- [ ] **Step 3: Update docs**

In `docs/ROADMAP.md`: change `☐ P5 Testimonials management` to `☑ P5 Testimonials management — VERIFIED LIVE`, and add the plan filename under "Plans written". In `docs/HANDOVER.md`: update RESUME "Next task" to **P6 Journal management (Tiptap)**, bump "Current phase" and "Last updated", and record P5 under "Done + verified" with the live-test results.

- [ ] **Step 4: Commit**

```bash
git add docs/HANDOVER.md docs/ROADMAP.md
git commit -m "docs: P5 testimonials complete + verified; next P6 journal"
```

---

## Self-Review

- **Spec coverage:** Handover P5 asks for CRUD + publish + featured + drag-order + admin UI with media. Covered: create/get/update/delete/list/reorder (Task 1–2), `published`/`featured` toggles (Task 3 editor + filters), reorder via up/down (dependency-free stand-in for drag; API supports full drag later), portrait + logo via `MediaPicker`/`ImageField` (Task 3). Public reflection already handled by `lib/content.ts` — verified in Task 4.
- **Placeholder scan:** none — all code blocks complete.
- **Type consistency:** `AdminTestimonialRow`, `TestimonialInput`, `TestimonialRow`, `EditorValues`, `ImageValue` names consistent across tasks. HTTP contract keys (`testimonials`, `testimonial`, `id`, `ok`, `ids`) match between routes (Task 2) and UI (Task 3). Service function names identical in interfaces, tests, and routes.
- **Deviation from handover:** drag-and-drop is implemented as move up/down (no new dependency); reorder API accepts a full ordered id list so a drag UI can replace the buttons later with zero backend change. Reorder disabled while search/filters active (order only meaningful over the full list).
