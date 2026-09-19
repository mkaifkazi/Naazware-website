# Phase 7 — Inbox + Contact Route → Mongo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist contact-form submissions as Mongo `Enquiry` documents and give the admin an inbox (list, read, mark status, delete). Repoint the public `/api/contact` route off Sanity onto Mongo.

**Architecture:** Same P4–P6 vertical (Mongo model → zod → service → API → admin UI). New `Enquiry` model + `enquiries-service`. The public `/api/contact` route (unauthenticated) validates + persists via `createEnquiry`, then sends the existing Resend notification; it returns 500 only if BOTH the DB save and the email fail (never silently drop a lead). Admin API routes are auth-gated. The admin inbox is a list page + a detail page that marks a `new` enquiry `read` on open.

**Tech Stack:** Next.js 14 App Router, TypeScript, Mongoose, zod, Auth.js (`requireAdmin`), Resend (existing), Vitest + in-memory Mongo (`setupTestDb`), Tailwind.

## Global Constraints

- All work stays on branch `feat/custom-cms`. Never touch `master` during implementation. (Note: `feat/custom-cms` and `master` are currently identical at the P6 tip; keep committing on `feat/custom-cms`.)
- Admin API routes: `requireAdmin` gate first; mutations also `rateLimit(\`${gate.userId}:enquiries\`, 60, 60000)` → 429; validate body, `badRequest` on failure.
- The public `/api/contact` route is NOT auth-gated (visitors use it). Keep the existing honeypot (`website`) and server-side validation. Add an IP-keyed `rateLimit` as a light spam guard.
- Enquiry status is `'new' | 'read' | 'archived'`, default `'new'`.
- Remove the Sanity write from `/api/contact` (Sanity leaves entirely at P9). Keep the Resend email block.
- Failure semantics on `/api/contact`: attempt DB save, then email; return 500 only if both fail; otherwise 200.
- Gate must stay GREEN after every task: `npm run test` · `npm run type-check` · `npm run lint`.
- Match existing file style: 2-space indent, no semicolons, single quotes, `@/` path alias.

## File Structure

- Create `lib/models/Enquiry.ts` — mongoose model + `EnquiryDoc` type.
- Create `lib/models/Enquiry.test.ts` — model smoke test (matches the existing per-model test convention).
- Create `lib/schemas/enquiry.ts` — zod `enquiryInputSchema` (contact payload) + `enquiryStatusSchema` + types.
- Create `lib/enquiries-service.ts` — `createEnquiry`, `listEnquiries`, `getEnquiryById`, `setEnquiryStatus`, `deleteEnquiry`.
- Create `lib/enquiries-service.test.ts` — service unit tests.
- Modify `app/api/contact/route.ts` — persist to Mongo instead of Sanity; new failure semantics; IP rate limit.
- Create `app/api/admin/enquiries/route.ts` — GET (list).
- Create `app/api/admin/enquiries/[id]/route.ts` — GET + PATCH (status) + DELETE.
- Create `components/admin/EnquiriesTable.tsx` — client list (search / status filter).
- Create `components/admin/EnquiryDetail.tsx` — client detail actions (mark read/unread/archived, delete).
- Create `app/(admin)/admin/inbox/page.tsx` — server list page.
- Create `app/(admin)/admin/inbox/[id]/page.tsx` — server detail page (marks `new` → `read` on open).
- Modify `docs/HANDOVER.md`, `docs/ROADMAP.md`.
- No modification needed: `components/admin/Sidebar.tsx` already links `/admin/inbox`.

## Budget label map (shared literal — copy verbatim where referenced)

```ts
const BUDGET_LABELS: Record<string, string> = {
  'under-10k': 'Under $10,000',
  '10k-25k': '$10,000 - $25,000',
  '25k-50k': '$25,000 - $50,000',
  '50k-100k': '$50,000 - $100,000',
  'over-100k': 'Over $100,000',
}
```

---

### Task 1: Enquiry model + schema + service + tests

**Files:**
- Create: `lib/models/Enquiry.ts`
- Create: `lib/models/Enquiry.test.ts`
- Create: `lib/schemas/enquiry.ts`
- Create: `lib/enquiries-service.ts`
- Test: `lib/enquiries-service.test.ts`

**Interfaces:**
- Consumes: `connectDb` from `@/lib/db`; `setupTestDb` from `@/test/setup-db`.
- Produces:
  - `Enquiry`, `EnquiryDoc` (from `lib/models/Enquiry.ts`).
  - `enquiryInputSchema`, `type EnquiryInput`, `enquiryStatusSchema`, `type EnquiryStatus` (from `lib/schemas/enquiry.ts`).
  - `type AdminEnquiryRow = { id: string; name: string; email: string; company: string; budget: string; status: EnquiryStatus; createdAt: Date }`.
  - `createEnquiry(input: EnquiryInput): Promise<{ id: string }>`
  - `getEnquiryById(id: string): Promise<EnquiryDoc | null>`
  - `setEnquiryStatus(id: string, status: EnquiryStatus): Promise<boolean>`
  - `deleteEnquiry(id: string): Promise<boolean>`
  - `listEnquiries(opts?: { search?: string; status?: EnquiryStatus }): Promise<AdminEnquiryRow[]>`

- [ ] **Step 1: Create the model**

Create `lib/models/Enquiry.ts`:

```ts
import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

const enquirySchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    company: { type: String, default: '' },
    budget: { type: String, default: '' },
    message: { type: String, required: true },
    status: { type: String, enum: ['new', 'read', 'archived'], default: 'new' },
  },
  { timestamps: true }
)

export type EnquiryDoc = InferSchemaType<typeof enquirySchema>
export const Enquiry: Model<EnquiryDoc> =
  (models.Enquiry as Model<EnquiryDoc>) ?? model<EnquiryDoc>('Enquiry', enquirySchema)
```

- [ ] **Step 2: Create the zod schemas**

Create `lib/schemas/enquiry.ts`:

```ts
import { z } from 'zod'

// Mirrors the public ContactForm payload (client-side zod) + defence-in-depth.
export const enquiryInputSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(320),
  company: z.string().max(200).optional(),
  budget: z.string().min(1).max(120),
  message: z.string().min(10).max(5000),
  consent: z.literal(true),
  website: z.string().max(0).optional(), // honeypot — must be empty
})

export type EnquiryInput = z.infer<typeof enquiryInputSchema>

export const enquiryStatusSchema = z.object({
  status: z.enum(['new', 'read', 'archived']),
})

export type EnquiryStatus = z.infer<typeof enquiryStatusSchema>['status']
```

- [ ] **Step 3: Write the model smoke test**

Create `lib/models/Enquiry.test.ts` (mirrors the existing per-model test convention):

```ts
import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import { Enquiry } from './Enquiry'

describe('Enquiry model', () => {
  setupTestDb()

  it('defaults status to new and stamps timestamps', async () => {
    const doc = await Enquiry.create({ name: 'Ada', email: 'ada@example.com', message: 'Hello there' })
    expect(doc.status).toBe('new')
    expect(doc.createdAt).toBeInstanceOf(Date)
  })

  it('rejects a document missing required fields', async () => {
    await expect(Enquiry.create({ name: 'NoEmail' })).rejects.toBeTruthy()
  })
})
```

- [ ] **Step 4: Write the failing service tests**

Create `lib/enquiries-service.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import {
  createEnquiry, listEnquiries, getEnquiryById, setEnquiryStatus, deleteEnquiry,
} from './enquiries-service'

const base = { budget: '10k-25k', consent: true as const }

describe('enquiries-service', () => {
  setupTestDb()

  it('createEnquiry stores with status new', async () => {
    const { id } = await createEnquiry({ ...base, name: 'Ada', email: 'ada@example.com', message: 'Hello there' })
    const doc = await getEnquiryById(id)
    expect(doc?.name).toBe('Ada')
    expect(doc?.status).toBe('new')
  })

  it('createEnquiry drops the honeypot field', async () => {
    const { id } = await createEnquiry({ ...base, name: 'Bot', email: 'bot@example.com', message: 'spam message', website: '' })
    const doc = await getEnquiryById(id)
    expect((doc as Record<string, unknown>).website).toBeUndefined()
  })

  it('setEnquiryStatus updates status', async () => {
    const { id } = await createEnquiry({ ...base, name: 'Grace', email: 'grace@example.com', message: 'Question here' })
    expect(await setEnquiryStatus(id, 'read')).toBe(true)
    expect((await getEnquiryById(id))?.status).toBe('read')
  })

  it('setEnquiryStatus returns false for missing id', async () => {
    expect(await setEnquiryStatus('507f1f77bcf86cd799439011', 'read')).toBe(false)
  })

  it('listEnquiries filters by status and search, newest first', async () => {
    await createEnquiry({ ...base, name: 'Alpha Co', email: 'a@acme.com', message: 'first message' })
    const second = await createEnquiry({ ...base, name: 'Beta Co', email: 'b@beta.com', message: 'second message' })
    await setEnquiryStatus(second.id, 'archived')
    expect((await listEnquiries({ status: 'archived' })).length).toBe(1)
    const found = await listEnquiries({ search: 'beta' })
    expect(found.map((e) => e.name)).toContain('Beta Co')
    const all = await listEnquiries()
    expect(all[0].name).toBe('Beta Co') // newest first
  })

  it('deleteEnquiry removes it', async () => {
    const { id } = await createEnquiry({ ...base, name: 'Temp', email: 't@t.com', message: 'delete me please' })
    expect(await deleteEnquiry(id)).toBe(true)
    expect(await getEnquiryById(id)).toBeNull()
  })
})
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `npm run test -- enquiries-service`
Expected: FAIL — `Failed to resolve import "./enquiries-service"`.

- [ ] **Step 6: Write the service**

Create `lib/enquiries-service.ts`:

```ts
import { connectDb } from './db'
import { Enquiry, type EnquiryDoc } from './models/Enquiry'
import type { EnquiryInput, EnquiryStatus } from './schemas/enquiry'

export type AdminEnquiryRow = {
  id: string
  name: string
  email: string
  company: string
  budget: string
  status: EnquiryStatus
  createdAt: Date
}

export async function createEnquiry(input: EnquiryInput): Promise<{ id: string }> {
  await connectDb()
  const created = await Enquiry.create({
    name: input.name,
    email: input.email,
    company: input.company ?? '',
    budget: input.budget,
    message: input.message,
    status: 'new',
  })
  return { id: String(created._id) }
}

export async function getEnquiryById(id: string): Promise<EnquiryDoc | null> {
  await connectDb()
  return Enquiry.findById(id).lean<EnquiryDoc>()
}

export async function setEnquiryStatus(id: string, status: EnquiryStatus): Promise<boolean> {
  await connectDb()
  const res = await Enquiry.findByIdAndUpdate(id, { $set: { status } })
  return Boolean(res)
}

export async function deleteEnquiry(id: string): Promise<boolean> {
  await connectDb()
  const res = await Enquiry.findByIdAndDelete(id)
  return Boolean(res)
}

export async function listEnquiries(
  opts: { search?: string; status?: EnquiryStatus } = {}
): Promise<AdminEnquiryRow[]> {
  await connectDb()
  const filter: Record<string, unknown> = {}
  if (opts.status) filter.status = opts.status
  if (opts.search) {
    const rx = new RegExp(opts.search, 'i')
    filter.$or = [{ name: rx }, { email: rx }, { company: rx }, { message: rx }]
  }
  const rows = await Enquiry.find(filter)
    .sort({ createdAt: -1 })
    .lean<(EnquiryDoc & { _id: unknown; createdAt: Date })[]>()
  return rows.map((e) => ({
    id: String(e._id),
    name: e.name,
    email: e.email,
    company: e.company ?? '',
    budget: e.budget ?? '',
    status: (e.status ?? 'new') as EnquiryStatus,
    createdAt: e.createdAt,
  }))
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm run test -- enquiries-service Enquiry`
Expected: PASS (service 6 tests + model 2 tests = 8).

- [ ] **Step 8: Verify gate**

Run: `npm run type-check` then `npm run lint`
Expected: both clean.

- [ ] **Step 9: Commit**

```bash
git add lib/models/Enquiry.ts lib/models/Enquiry.test.ts lib/schemas/enquiry.ts lib/enquiries-service.ts lib/enquiries-service.test.ts
git commit -m "feat: Enquiry model + service + schema (P7a)"
```

---

### Task 2: Rewire the public contact route to Mongo

**Files:**
- Modify: `app/api/contact/route.ts`

**Interfaces:**
- Consumes: `createEnquiry` from `@/lib/enquiries-service`; `enquiryInputSchema` from `@/lib/schemas/enquiry`; `rateLimit` from `@/lib/rate-limit`; existing `Resend`.
- Produces: `POST /api/contact` → `{ success: true }` 200 | `{ error }` 400/429/500.

- [ ] **Step 1: Rewrite the route**

Replace the entire contents of `app/api/contact/route.ts` with (removes the Sanity `writeClient` import + write block; adds Mongo persist, IP rate limit, and the both-failed 500 semantics):

```ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { enquiryInputSchema } from '@/lib/schemas/enquiry'
import { createEnquiry } from '@/lib/enquiries-service'
import { rateLimit } from '@/lib/rate-limit'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const NOTIFY_TO = process.env.CONTACT_NOTIFICATION_TO
const FROM = process.env.RESEND_FROM || 'Naazware <onboarding@resend.dev>'

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!rateLimit(`contact:${ip}`, 5, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()

    // Honeypot: real users never fill this hidden field. Pretend success for bots.
    if (body.website) return NextResponse.json({ success: true }, { status: 200 })

    const parsed = enquiryInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
    }
    const { name, email, company, budget, message } = parsed.data
    const createdAt = new Date().toISOString()

    // 1) Persist to Mongo (primary store — surfaces in the admin inbox).
    let saved = false
    try {
      await createEnquiry(parsed.data)
      saved = true
    } catch (err) {
      console.error('Enquiry DB write failed:', err)
    }

    // 2) Email notification via Resend — best effort.
    let emailed = false
    if (resend && NOTIFY_TO) {
      try {
        await resend.emails.send({
          from: FROM,
          to: NOTIFY_TO,
          replyTo: email,
          subject: `New project enquiry — ${name}`,
          html: `
            <h2>New contact submission</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Company:</strong> ${escapeHtml(company || 'N/A')}</p>
            <p><strong>Budget:</strong> ${escapeHtml(budget)}</p>
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
            <hr/><p style="color:#888">Received ${createdAt}</p>
          `,
        })
        emailed = true
      } catch (err) {
        console.error('Resend email failed:', err)
      }
    }

    // Never silently lose a lead: if it was neither stored nor emailed, tell the visitor.
    if (!saved && !emailed) {
      return NextResponse.json({ error: 'Could not send your message. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify gate**

Run: `npm run type-check` then `npm run lint`
Expected: both clean. Note: nothing else imports `@/sanity/lib/writeClient` for contact anymore; leave the Sanity files in place (removed wholesale at P9).

- [ ] **Step 3: Commit**

```bash
git add app/api/contact/route.ts
git commit -m "feat: contact route persists enquiries to Mongo (drop Sanity write, IP rate limit, no silent loss)"
```

---

### Task 3: Admin enquiries API routes

**Files:**
- Create: `app/api/admin/enquiries/route.ts`
- Create: `app/api/admin/enquiries/[id]/route.ts`

**Interfaces:**
- Consumes: `requireAdmin`, `json`, `badRequest`, `errorResponse` from `@/lib/admin-api`; `rateLimit` from `@/lib/rate-limit`; `enquiryStatusSchema` from `@/lib/schemas/enquiry`; Task 1 service functions.
- Produces (HTTP contract the UI consumes):
  - `GET /api/admin/enquiries?search=&status=new|read|archived` → `{ enquiries: AdminEnquiryRow[] }`
  - `GET /api/admin/enquiries/[id]` → `{ enquiry: EnquiryDoc }` | 404
  - `PATCH /api/admin/enquiries/[id]` (body = `{ status }`) → `{ ok: true }` | 404
  - `DELETE /api/admin/enquiries/[id]` → `{ ok: true }` | 404

- [ ] **Step 1: Write the list route**

Create `app/api/admin/enquiries/route.ts`:

```ts
import { requireAdmin, json } from '@/lib/admin-api'
import { listEnquiries } from '@/lib/enquiries-service'
import type { EnquiryStatus } from '@/lib/schemas/enquiry'

export async function GET(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const valid = status === 'new' || status === 'read' || status === 'archived'
  const rows = await listEnquiries({
    search: searchParams.get('search') || undefined,
    status: valid ? (status as EnquiryStatus) : undefined,
  })
  return json({ enquiries: rows })
}
```

- [ ] **Step 2: Write the id route**

Create `app/api/admin/enquiries/[id]/route.ts`:

```ts
import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { enquiryStatusSchema } from '@/lib/schemas/enquiry'
import { getEnquiryById, setEnquiryStatus, deleteEnquiry } from '@/lib/enquiries-service'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  const doc = await getEnquiryById(params.id)
  if (!doc) return errorResponse('Not found', 404)
  return json({ enquiry: doc })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:enquiries`, 60, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const parsed = enquiryStatusSchema.safeParse(body)
  if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())
  const ok = await setEnquiryStatus(params.id, parsed.data.status)
  if (!ok) return errorResponse('Not found', 404)
  return json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:enquiries`, 60, 60000)) return errorResponse('Too many requests', 429)
  const ok = await deleteEnquiry(params.id)
  if (!ok) return errorResponse('Not found', 404)
  return json({ ok: true })
}
```

- [ ] **Step 3: Verify gate**

Run: `npm run type-check` then `npm run lint`
Expected: both clean.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/enquiries
git commit -m "feat: admin enquiries API routes (list, get, patch status, delete)"
```

---

### Task 4: Admin inbox UI

**Files:**
- Create: `components/admin/EnquiriesTable.tsx`
- Create: `components/admin/EnquiryDetail.tsx`
- Create: `app/(admin)/admin/inbox/page.tsx`
- Create: `app/(admin)/admin/inbox/[id]/page.tsx`

**Interfaces:**
- Consumes: `apiGet`, `apiSend` from `@/lib/admin-client`; `TextInput`, `Select`, `Button` from `@/components/admin/ui`; `listEnquiries` + `getEnquiryById` + `setEnquiryStatus` from `@/lib/enquiries-service`; Task 3 HTTP contract.
- Produces:
  - `EnquiryRow = { id; name; email; company; budget; status; createdAt: string }` (exported from `EnquiriesTable.tsx`).
  - `EnquiryDetail` default export — props `{ id; name; email; company; budget; message; status; createdAt: string }`.

Note: `apiSend` supports `'POST' | 'PUT' | 'DELETE'` today. Add `'PATCH'` to its method union.

- [ ] **Step 1: Allow PATCH in the admin client**

In `lib/admin-client.ts`, widen the `apiSend` method type:

```ts
export async function apiSend<T>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown
): Promise<T> {
```

- [ ] **Step 2: Write the enquiries table**

Create `components/admin/EnquiriesTable.tsx`:

```tsx
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
```

- [ ] **Step 3: Write the detail actions component**

Create `components/admin/EnquiryDetail.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiSend } from '@/lib/admin-client'
import { Button } from './ui'

const BUDGET_LABELS: Record<string, string> = {
  'under-10k': 'Under $10,000',
  '10k-25k': '$10,000 - $25,000',
  '25k-50k': '$25,000 - $50,000',
  '50k-100k': '$50,000 - $100,000',
  'over-100k': 'Over $100,000',
}

export default function EnquiryDetail({
  id, name, email, company, budget, message, status, createdAt,
}: {
  id: string
  name: string
  email: string
  company: string
  budget: string
  message: string
  status: string
  createdAt: string
}) {
  const router = useRouter()
  const [current, setCurrent] = useState(status)
  const [busy, setBusy] = useState(false)

  async function setStatus(next: 'new' | 'read' | 'archived') {
    setBusy(true)
    try {
      await apiSend(`/api/admin/enquiries/${id}`, 'PATCH', { status: next })
      setCurrent(next)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!confirm(`Delete the enquiry from "${name}"? This cannot be undone.`)) return
    setBusy(true)
    try {
      await apiSend(`/api/admin/enquiries/${id}`, 'DELETE')
      router.push('/admin/inbox')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => router.push('/admin/inbox')}>← Inbox</Button>
        <div className="flex items-center gap-2">
          {current !== 'read' && <Button type="button" variant="ghost" disabled={busy} onClick={() => setStatus('read')}>Mark read</Button>}
          {current !== 'new' && <Button type="button" variant="ghost" disabled={busy} onClick={() => setStatus('new')}>Mark unread</Button>}
          {current !== 'archived' && <Button type="button" variant="ghost" disabled={busy} onClick={() => setStatus('archived')}>Archive</Button>}
          <Button type="button" variant="danger" disabled={busy} onClick={remove}>Delete</Button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-ink-600 bg-ink-800/40 p-6">
        <h1 className="text-2xl font-semibold text-paper">{name}</h1>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-paper-dim">
          <a href={`mailto:${email}`} className="hover:text-accent-soft">{email}</a>
          {company && <span>· {company}</span>}
          <span>· {BUDGET_LABELS[budget] || budget || 'No budget'}</span>
          <span>· {createdAt ? new Date(createdAt).toLocaleString() : ''}</span>
          <span>· <span className="text-paper-faint">{current}</span></span>
        </div>
        <hr className="my-5 border-ink-600" />
        <p className="whitespace-pre-wrap text-paper">{message}</p>
      </div>

      <div className="mt-6">
        <a href={`mailto:${email}?subject=Re: your enquiry`} className="btn-accent inline-block">Reply by email</a>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write the inbox list page**

Create `app/(admin)/admin/inbox/page.tsx`:

```tsx
import { listEnquiries } from '@/lib/enquiries-service'
import EnquiriesTable, { type EnquiryRow } from '@/components/admin/EnquiriesTable'

export const dynamic = 'force-dynamic'

export default async function InboxPage() {
  const rows = await listEnquiries()
  const initial: EnquiryRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    company: r.company,
    budget: r.budget,
    status: r.status,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : '',
  }))
  const unread = initial.filter((r) => r.status === 'new').length
  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-paper">Enquiries</h1>
        <p className="mt-1 text-sm text-paper-dim">
          {unread > 0 ? `${unread} new · ` : ''}Contact-form submissions.
        </p>
      </div>
      <div className="mt-8">
        <EnquiriesTable initial={initial} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write the detail page (marks new → read on open)**

Create `app/(admin)/admin/inbox/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { getEnquiryById, setEnquiryStatus } from '@/lib/enquiries-service'
import EnquiryDetail from '@/components/admin/EnquiryDetail'

export const dynamic = 'force-dynamic'

export default async function EnquiryPage({ params }: { params: { id: string } }) {
  const doc = await getEnquiryById(params.id)
  if (!doc) notFound()

  // Auto-mark as read on open.
  const status = doc.status ?? 'new'
  if (status === 'new') {
    await setEnquiryStatus(params.id, 'read')
  }

  return (
    <EnquiryDetail
      id={params.id}
      name={doc.name}
      email={doc.email}
      company={doc.company ?? ''}
      budget={doc.budget ?? ''}
      message={doc.message}
      status={status === 'new' ? 'read' : status}
      createdAt={doc.createdAt ? new Date(doc.createdAt).toISOString() : ''}
    />
  )
}
```

- [ ] **Step 6: Verify gate**

Run: `npm run type-check` then `npm run lint`
Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add "app/(admin)/admin/inbox" components/admin/EnquiriesTable.tsx components/admin/EnquiryDetail.tsx lib/admin-client.ts
git commit -m "feat: admin inbox UI (list, detail, mark read/archived, delete)"
```

---

### Task 5: Live verification + docs

**Files:**
- Modify: `docs/HANDOVER.md`, `docs/ROADMAP.md`

- [ ] **Step 1: Full gate**

Run: `npm run test` then `npm run type-check` then `npm run lint`
Expected: all tests pass (56 total: prior 48 + 8 new), type-check + lint clean.

- [ ] **Step 2: Live HTTP smoke test**

Start the dev server (`npm run dev`) with the DIRECT (non-SRV) `MONGODB_URI` from `.env.local` (see HANDOVER env note). Verify:
- Public (no auth) `POST /api/contact` with a valid body
  `{ "name": "Jane Tester", "email": "jane@example.com", "budget": "10k-25k", "message": "Interested in a build.", "consent": true }`
  → 200 `{ success: true }`
- honeypot: same body plus `"website": "x"` → 200 but NOT stored
- invalid: `{ "name": "x", "email": "bad", "consent": false }` → 400
- Log in at `/admin/login` (kaifkazi40@gmail.com / `Naazware@2026`) for a session cookie, then with that cookie:
  - `GET /api/admin/enquiries` → 200, includes Jane (status `new`), excludes the honeypot one
  - unauthenticated `GET /api/admin/enquiries` → 401
  - `GET /api/admin/enquiries/[jane-id]` → 200
  - `PATCH /api/admin/enquiries/[jane-id]` `{ "status": "archived" }` → 200; `GET ?status=archived` includes Jane
  - `DELETE /api/admin/enquiries/[jane-id]` → 200; gone from list
- Confirm opening `/admin/inbox/[id]` flips a `new` enquiry to `read` (via the API or by re-reading after the detail page fetch).

Record exact results (status codes + observed effects).

- [ ] **Step 3: Update docs**

In `docs/ROADMAP.md`: change `☐ P7 Inbox + contact route rewired to Mongo` to `☑ P7 … — VERIFIED LIVE`, and add this plan filename under "Plans written". In `docs/HANDOVER.md`: update RESUME "Next task" to **P8 Settings**, bump "Current phase"/"Last updated"/gate count (56), and record P7 under "Done + verified" with live-test results. Note that `/api/contact` no longer writes to Sanity.

- [ ] **Step 4: Commit**

```bash
git add docs/HANDOVER.md docs/ROADMAP.md docs/superpowers/plans/2026-09-19-phase-7-inbox.md
git commit -m "docs: P7 inbox complete + verified; next P8 settings"
```

---

## Self-Review

- **Spec coverage:** Handover P7 = "enquiry model + admin inbox UI (list/read/mark/delete), and repoint the public contact form submit at a Mongo-backed route." Covered: Enquiry model + service (Task 1), contact route → Mongo (Task 2), admin API (Task 3), inbox list + detail with mark read/unread/archived + delete (Task 4), verify + docs (Task 5). Contact form component itself is unchanged — its fields already match the schema.
- **Placeholder scan:** none — all code blocks complete.
- **Type consistency:** `EnquiryInput`, `EnquiryStatus`, `AdminEnquiryRow`, `EnquiryRow`, `EnquiryDoc` consistent across tasks. HTTP contract keys (`enquiries`, `enquiry`, `ok`, `status`) match between routes (Task 3) and UI (Task 4). Service names (`createEnquiry`/`listEnquiries`/`getEnquiryById`/`setEnquiryStatus`/`deleteEnquiry`) identical in interfaces, tests, service, routes, and pages. `apiSend` gains `'PATCH'` (Task 4 step 1) before the inbox uses it.
- **Design decisions (from brainstorm):** Mongo-only persistence + Resend email (Sanity write removed from the contact path); 500 only if BOTH DB and email fail (no silent lead loss); IP-keyed rate limit as a spam guard on the public route; status enum `new/read/archived`; detail page auto-marks `new` → `read` on open.
- **Risk note:** `x-forwarded-for` may be absent in pure local dev — the code falls back to `'unknown'`, so a local burst of >5/min all share one bucket. That is acceptable for a spam guard; on Render the real client IP is present. The honeypot remains the first-line bot filter.
