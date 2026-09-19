# Naazware CMS — Plan 4a: Projects Backend + Media API (Phase 4a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Build the authenticated admin backend for Projects (full CRUD + duplicate + reorder) and the media pipeline (signed-URL upload, register, list, delete), all zod-validated, auth-gated, and rate-limited. No admin UI in this plan (that is Plan 4b) — everything here is verified by tests and by hitting the routes.

**Architecture:** A small admin-API foundation (`lib/admin-api.ts` for auth+JSON helpers, `lib/rate-limit.ts` for a lightweight in-memory limiter) wraps every `/api/admin/*` route handler. A `lib/projects-service.ts` holds all Project data operations (used by routes and unit-tested directly against in-memory Mongo). Media routes issue R2 signed upload URLs (from P2 `lib/storage.ts`) and persist metadata via P2 `lib/media.ts`.

**Tech Stack:** Next.js Route Handlers, zod, Mongoose, Auth.js (`auth()`), Vitest.

## Global Constraints

- Node `>=18`, TS `strict`, `@/*` alias.
- Every `/api/admin/*` handler: (1) requires a valid session via `requireAdmin`, returning 401 otherwise; (2) validates input with zod, returning 400 on failure; (3) mutations are rate-limited.
- Never trust client input; sanitize slugs; cap payload sizes.
- R2 secrets server-only. Uploads go directly to R2 via signed PUT — file bytes never pass through the app server.
- Reuse Vitest infra; service logic is unit-tested against in-memory Mongo. Route handlers get thin integration tests where practical.
- Do not touch Sanity.

---

### Task 1: Admin API foundation (auth guard, JSON helpers, rate limit)

**Files:**
- Create: `lib/admin-api.ts`
- Create: `lib/rate-limit.ts`
- Create: `lib/rate-limit.test.ts`

**Interfaces:**
- `lib/rate-limit.ts` → `rateLimit(key: string, limit: number, windowMs: number): boolean` — returns true if allowed, false if over the limit (fixed-window, in-memory Map).
- `lib/admin-api.ts` →
  - `requireAdmin(): Promise<{ ok: true; userId: string } | { ok: false; response: Response }>` — uses `auth()`; on no session returns `{ ok:false, response: json 401 }`.
  - `json(data: unknown, status?: number): Response`.
  - `badRequest(message: string, issues?: unknown): Response` (400).
  - `errorResponse(message: string, status: number): Response`.

- [ ] **Step 1: Write failing test `lib/rate-limit.test.ts`**

```typescript
import { describe, expect, it } from 'vitest'
import { rateLimit } from './rate-limit'

describe('rateLimit', () => {
  it('allows up to limit then blocks within the window', () => {
    const key = 'test-' + Math.random()
    expect(rateLimit(key, 2, 1000)).toBe(true)
    expect(rateLimit(key, 2, 1000)).toBe(true)
    expect(rateLimit(key, 2, 1000)).toBe(false)
  })
})
```

- [ ] **Step 2: Run, verify fail** → `npm run test -- lib/rate-limit.test.ts` FAIL.

- [ ] **Step 3: Implement `lib/rate-limit.ts`**

```typescript
type Entry = { count: number; resetAt: number }
const buckets = new Map<string, Entry>()

/** Fixed-window in-memory limiter. Returns true if the call is allowed. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = buckets.get(key)
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}
```

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Implement `lib/admin-api.ts`**

```typescript
import { auth } from '@/auth'

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export function errorResponse(message: string, status: number): Response {
  return json({ error: message }, status)
}

export function badRequest(message: string, issues?: unknown): Response {
  return json({ error: message, issues }, 400)
}

type AdminOk = { ok: true; userId: string }
type AdminFail = { ok: false; response: Response }

export async function requireAdmin(): Promise<AdminOk | AdminFail> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, response: errorResponse('Unauthorized', 401) }
  }
  return { ok: true, userId: session.user.id }
}
```

- [ ] **Step 6: Typecheck** → `npm run type-check` clean.

- [ ] **Step 7: Commit**

```bash
git add lib/admin-api.ts lib/rate-limit.ts lib/rate-limit.test.ts
git commit -m "feat: admin-api foundation (auth guard, json helpers, rate limit)"
```

---

### Task 2: Project zod schema + service layer

**Files:**
- Create: `lib/schemas/project.ts`
- Create: `lib/projects-service.ts`
- Create: `lib/projects-service.test.ts`

**Interfaces:**
- `lib/schemas/project.ts` → `projectInputSchema` (zod) + `type ProjectInput`. Fields (all optional except title/client/shortDescription): title, slug?, client, industry?, shortDescription, fullDescription?, challenge?, solution?, outcome?, services (string[]), technologies (string[]), metrics ({label,value}[]), coverMedia? (string id | null), gallery (string[] ids), videoUrl?, externalUrl?, testimonial? ({quote,author,role} | null), featured (bool), status ('draft'|'published'), seo ({title?,description?,ogImage?}).
- `lib/projects-service.ts`:
  - `slugify(s: string): string`
  - `uniqueSlug(base: string, excludeId?: string): Promise<string>` — appends `-2`, `-3`, … until free.
  - `listProjects(opts?: { search?: string; status?: 'draft'|'published'; featured?: boolean }): Promise<AdminProjectRow[]>` — newest-updated first; lightweight fields for the list.
  - `getProjectById(id): Promise<ProjectDoc | null>`
  - `createProject(input: ProjectInput): Promise<{ id: string }>` — generates a unique slug from input.slug||title.
  - `updateProject(id, input: ProjectInput): Promise<boolean>` — re-uniques slug excluding self.
  - `deleteProject(id): Promise<boolean>`
  - `duplicateProject(id): Promise<{ id: string } | null>` — copies doc, title+" (copy)", new unique slug, status forced 'draft'.
  - `reorderProjects(ids: string[]): Promise<void>` — sets `order` to array index.
  - `AdminProjectRow = { id, title, slug, client, status, featured, order, updatedAt }`.

- [ ] **Step 1: Write failing test `lib/projects-service.test.ts`**

```typescript
import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import {
  slugify, uniqueSlug, createProject, updateProject, getProjectById,
  listProjects, deleteProject, duplicateProject, reorderProjects,
} from './projects-service'
import { Project } from './models/Project'

const base = { client: 'Acme', shortDescription: 'x' }

describe('projects-service', () => {
  setupTestDb()

  it('slugify normalizes', () => {
    expect(slugify('Hello World! 2024')).toBe('hello-world-2024')
  })

  it('uniqueSlug avoids collisions', async () => {
    await createProject({ ...base, title: 'Alpha' })
    expect(await uniqueSlug('alpha')).toBe('alpha-2')
  })

  it('createProject stores with generated slug + draft default', async () => {
    const { id } = await createProject({ ...base, title: 'My Project' })
    const doc = await getProjectById(id)
    expect(doc?.slug).toBe('my-project')
    expect(doc?.status).toBe('draft')
  })

  it('updateProject changes fields and re-uniques slug excluding self', async () => {
    const { id } = await createProject({ ...base, title: 'Editable' })
    const ok = await updateProject(id, { ...base, title: 'Editable', slug: 'editable', status: 'published' })
    expect(ok).toBe(true)
    const doc = await getProjectById(id)
    expect(doc?.status).toBe('published')
    expect(doc?.slug).toBe('editable') // keeps its own slug, not editable-2
  })

  it('listProjects filters by status and search', async () => {
    await createProject({ ...base, title: 'Published One', status: 'published' })
    await createProject({ ...base, title: 'Draft One', status: 'draft' })
    expect((await listProjects({ status: 'published' })).length).toBe(1)
    const found = await listProjects({ search: 'Draft' })
    expect(found.map((p) => p.title)).toContain('Draft One')
  })

  it('duplicateProject creates a draft copy with a new slug', async () => {
    const { id } = await createProject({ ...base, title: 'Original', status: 'published' })
    const dup = await duplicateProject(id)
    const doc = await getProjectById(dup!.id)
    expect(doc?.title).toBe('Original (copy)')
    expect(doc?.slug).toBe('original-copy')
    expect(doc?.status).toBe('draft')
  })

  it('deleteProject removes it', async () => {
    const { id } = await createProject({ ...base, title: 'Temp' })
    expect(await deleteProject(id)).toBe(true)
    expect(await getProjectById(id)).toBeNull()
  })

  it('reorderProjects sets order by index', async () => {
    const a = await createProject({ ...base, title: 'A' })
    const b = await createProject({ ...base, title: 'B' })
    await reorderProjects([b.id, a.id])
    expect((await getProjectById(b.id))?.order).toBe(0)
    expect((await getProjectById(a.id))?.order).toBe(1)
  })
})
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement `lib/schemas/project.ts`**

```typescript
import { z } from 'zod'

const metric = z.object({ label: z.string().max(120).default(''), value: z.string().max(120).default('') })
const seo = z
  .object({
    title: z.string().max(200).optional(),
    description: z.string().max(400).optional(),
    ogImage: z.string().max(500).optional(),
  })
  .default({})

export const projectInputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  client: z.string().min(1).max(200),
  industry: z.string().max(200).optional(),
  shortDescription: z.string().min(1).max(600),
  fullDescription: z.string().max(20000).optional(),
  challenge: z.string().max(10000).optional(),
  solution: z.string().max(10000).optional(),
  outcome: z.string().max(10000).optional(),
  services: z.array(z.string().max(120)).max(50).default([]),
  technologies: z.array(z.string().max(120)).max(100).default([]),
  metrics: z.array(metric).max(20).default([]),
  coverMedia: z.string().length(24).nullable().optional(),
  gallery: z.array(z.string().length(24)).max(50).default([]),
  videoUrl: z.string().url().max(500).optional().or(z.literal('')),
  externalUrl: z.string().url().max(500).optional().or(z.literal('')),
  testimonial: z
    .object({ quote: z.string().max(2000), author: z.string().max(200), role: z.string().max(200).optional() })
    .nullable()
    .optional(),
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('draft'),
  seo,
})

export type ProjectInput = z.infer<typeof projectInputSchema>
```

- [ ] **Step 4: Implement `lib/projects-service.ts`**

```typescript
import { connectDb } from './db'
import { Project, type ProjectDoc } from './models/Project'
import type { ProjectInput } from './schemas/project'

export type AdminProjectRow = {
  id: string
  title: string
  slug: string
  client: string
  status: string
  featured: boolean
  order: number
  updatedAt: Date
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  await connectDb()
  const root = slugify(base) || 'project'
  let candidate = root
  let n = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await Project.findOne({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })
    if (!clash) return candidate
    n += 1
    candidate = `${root}-${n}`
  }
}

function applyInput(doc: Record<string, unknown>, input: ProjectInput) {
  doc.title = input.title
  doc.client = input.client
  doc.industry = input.industry ?? ''
  doc.shortDescription = input.shortDescription
  doc.fullDescription = input.fullDescription ?? ''
  doc.challenge = input.challenge ?? ''
  doc.solution = input.solution ?? ''
  doc.outcome = input.outcome ?? ''
  doc.services = input.services ?? []
  doc.technologies = input.technologies ?? []
  doc.metrics = input.metrics ?? []
  doc.coverMedia = input.coverMedia || undefined
  doc.gallery = input.gallery ?? []
  doc.videoUrl = input.videoUrl || undefined
  doc.externalUrl = input.externalUrl || undefined
  doc.testimonial = input.testimonial || undefined
  doc.featured = input.featured ?? false
  doc.status = input.status ?? 'draft'
  doc.seo = input.seo ?? {}
}

export async function createProject(input: ProjectInput): Promise<{ id: string }> {
  await connectDb()
  const slug = await uniqueSlug(input.slug || input.title)
  const doc: Record<string, unknown> = { slug }
  applyInput(doc, input)
  const created = await Project.create(doc)
  return { id: String(created._id) }
}

export async function getProjectById(id: string): Promise<ProjectDoc | null> {
  await connectDb()
  return Project.findById(id).lean<ProjectDoc>()
}

export async function updateProject(id: string, input: ProjectInput): Promise<boolean> {
  await connectDb()
  const doc = await Project.findById(id)
  if (!doc) return false
  doc.slug = await uniqueSlug(input.slug || input.title, id)
  const patch: Record<string, unknown> = {}
  applyInput(patch, input)
  doc.set(patch)
  await doc.save()
  return true
}

export async function deleteProject(id: string): Promise<boolean> {
  await connectDb()
  const res = await Project.findByIdAndDelete(id)
  return Boolean(res)
}

export async function duplicateProject(id: string): Promise<{ id: string } | null> {
  await connectDb()
  const src = await Project.findById(id).lean<ProjectDoc>()
  if (!src) return null
  const title = `${src.title} (copy)`
  const slug = await uniqueSlug(title)
  const { _id, createdAt, updatedAt, ...rest } = src as Record<string, unknown>
  void _id
  void createdAt
  void updatedAt
  const created = await Project.create({ ...rest, title, slug, status: 'draft', featured: false })
  return { id: String(created._id) }
}

export async function reorderProjects(ids: string[]): Promise<void> {
  await connectDb()
  await Promise.all(ids.map((id, index) => Project.updateOne({ _id: id }, { $set: { order: index } })))
}

export async function listProjects(opts: {
  search?: string
  status?: 'draft' | 'published'
  featured?: boolean
} = {}): Promise<AdminProjectRow[]> {
  await connectDb()
  const filter: Record<string, unknown> = {}
  if (opts.status) filter.status = opts.status
  if (typeof opts.featured === 'boolean') filter.featured = opts.featured
  if (opts.search) {
    const rx = new RegExp(opts.search, 'i')
    filter.$or = [{ title: rx }, { client: rx }, { slug: rx }]
  }
  const rows = await Project.find(filter).sort({ order: 1, updatedAt: -1 }).lean<ProjectDoc[]>()
  return rows.map((p) => ({
    id: String((p as { _id: unknown })._id),
    title: p.title,
    slug: p.slug,
    client: p.client,
    status: p.status,
    featured: Boolean(p.featured),
    order: p.order ?? 0,
    updatedAt: (p as { updatedAt: Date }).updatedAt,
  }))
}
```

- [ ] **Step 5: Run tests, verify pass** → `npm run test -- lib/projects-service.test.ts` PASS (8).

- [ ] **Step 6: Commit**

```bash
git add lib/schemas/project.ts lib/projects-service.ts lib/projects-service.test.ts
git commit -m "feat: project zod schema + service layer (CRUD, slug, duplicate, reorder)"
```

---

### Task 3: Projects API route handlers

**Files:**
- Create: `app/api/admin/projects/route.ts` (GET list, POST create)
- Create: `app/api/admin/projects/[id]/route.ts` (GET, PUT, DELETE)
- Create: `app/api/admin/projects/[id]/duplicate/route.ts` (POST)
- Create: `app/api/admin/projects/reorder/route.ts` (PUT)

**Interfaces:** Each handler: `requireAdmin` → parse/validate → call service → `json`. Mutations call `rateLimit(userId + ':projects', 60, 60000)`.

- [ ] **Step 1: Implement `app/api/admin/projects/route.ts`**

```typescript
import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { projectInputSchema } from '@/lib/schemas/project'
import { listProjects, createProject } from '@/lib/projects-service'

export async function GET(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const featured = searchParams.get('featured')
  const rows = await listProjects({
    search: searchParams.get('search') || undefined,
    status: status === 'draft' || status === 'published' ? status : undefined,
    featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
  })
  return json({ projects: rows })
}

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:projects`, 60, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const parsed = projectInputSchema.safeParse(body)
  if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())
  const { id } = await createProject(parsed.data)
  return json({ id }, 201)
}
```

- [ ] **Step 2: Implement `app/api/admin/projects/[id]/route.ts`**

```typescript
import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { projectInputSchema } from '@/lib/schemas/project'
import { getProjectById, updateProject, deleteProject } from '@/lib/projects-service'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  const doc = await getProjectById(params.id)
  if (!doc) return errorResponse('Not found', 404)
  return json({ project: doc })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:projects`, 60, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const parsed = projectInputSchema.safeParse(body)
  if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())
  const ok = await updateProject(params.id, parsed.data)
  if (!ok) return errorResponse('Not found', 404)
  return json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:projects`, 60, 60000)) return errorResponse('Too many requests', 429)
  const ok = await deleteProject(params.id)
  if (!ok) return errorResponse('Not found', 404)
  return json({ ok: true })
}
```

- [ ] **Step 3: Implement `app/api/admin/projects/[id]/duplicate/route.ts`**

```typescript
import { requireAdmin, json, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { duplicateProject } from '@/lib/projects-service'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:projects`, 60, 60000)) return errorResponse('Too many requests', 429)
  const res = await duplicateProject(params.id)
  if (!res) return errorResponse('Not found', 404)
  return json({ id: res.id }, 201)
}
```

- [ ] **Step 4: Implement `app/api/admin/projects/reorder/route.ts`**

```typescript
import { z } from 'zod'
import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { reorderProjects } from '@/lib/projects-service'

const schema = z.object({ ids: z.array(z.string().length(24)).max(500) })

export async function PUT(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:projects`, 60, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())
  await reorderProjects(parsed.data.ids)
  return json({ ok: true })
}
```

- [ ] **Step 5: Typecheck** → `npm run type-check` clean.

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/projects
git commit -m "feat: admin projects API (CRUD, duplicate, reorder) — auth-gated + validated"
```

---

### Task 4: Media API routes (signed upload, register, list, delete)

**Files:**
- Create: `lib/schemas/media.ts`
- Create: `app/api/admin/media/route.ts` (GET list, POST register)
- Create: `app/api/admin/media/sign/route.ts` (POST → signed upload URL + key)
- Create: `app/api/admin/media/[id]/route.ts` (DELETE)

**Interfaces:**
- `lib/schemas/media.ts` → `signSchema = { filename, contentType, folder? }`; `registerSchema = { key, type, size, width?, height?, alt?, filename? }`.
- `POST /api/admin/media/sign` → `{ uploadUrl, key, publicUrl }`. Restricts content types to images + common docs; caps declared size in register.
- `POST /api/admin/media` → creates a Media record (via `createMedia`), returns `{ id, url, key }`.
- `GET /api/admin/media?search=` → `{ media: [...] }` (via `listMedia`).
- `DELETE /api/admin/media/[id]` → `{ ok }` (via `deleteMedia`, also removes the R2 object).

- [ ] **Step 1: Implement `lib/schemas/media.ts`**

```typescript
import { z } from 'zod'

const ALLOWED = [
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf',
]

export const signSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().refine((t) => ALLOWED.includes(t), 'Unsupported file type'),
  folder: z.string().max(60).regex(/^[a-z0-9/_-]*$/i).optional(),
})

export const registerSchema = z.object({
  key: z.string().min(1).max(300),
  type: z.string().max(120),
  size: z.number().int().nonnegative().max(50 * 1024 * 1024), // 50MB cap
  width: z.number().int().positive().max(20000).optional(),
  height: z.number().int().positive().max(20000).optional(),
  alt: z.string().max(400).optional(),
  filename: z.string().max(200).optional(),
})
```

- [ ] **Step 2: Implement `app/api/admin/media/sign/route.ts`**

```typescript
import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { signSchema } from '@/lib/schemas/media'
import { r2Configured, buildObjectKey, getSignedUploadUrl, publicUrl } from '@/lib/storage'

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!r2Configured()) return errorResponse('Storage not configured', 500)
  if (!rateLimit(`${gate.userId}:upload`, 120, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const parsed = signSchema.safeParse(body)
  if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())
  const key = buildObjectKey(parsed.data.folder || 'uploads', parsed.data.filename)
  const uploadUrl = await getSignedUploadUrl(key, parsed.data.contentType)
  return json({ uploadUrl, key, publicUrl: publicUrl(key) })
}
```

- [ ] **Step 3: Implement `app/api/admin/media/route.ts`**

```typescript
import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { registerSchema } from '@/lib/schemas/media'
import { createMedia, listMedia } from '@/lib/media'

export async function GET(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  const { searchParams } = new URL(req.url)
  const media = await listMedia(searchParams.get('search') || undefined)
  return json({ media })
}

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:upload`, 120, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())
  const res = await createMedia(parsed.data)
  return json(res, 201)
}
```

- [ ] **Step 4: Implement `app/api/admin/media/[id]/route.ts`**

```typescript
import { requireAdmin, json, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { deleteMedia } from '@/lib/media'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:upload`, 120, 60000)) return errorResponse('Too many requests', 429)
  const ok = await deleteMedia(params.id)
  if (!ok) return errorResponse('Not found', 404)
  return json({ ok: true })
}
```

- [ ] **Step 5: Typecheck + full test + build**

Run: `npm run type-check && npm run test && npm run lint`
Expected: all green. (Build run in Task 5.)

- [ ] **Step 6: Commit**

```bash
git add lib/schemas/media.ts app/api/admin/media
git commit -m "feat: admin media API (signed upload, register, list, delete)"
```

---

### Task 5: Route smoke via build + docs

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: success; `/api/admin/projects`, `/api/admin/media`, etc. listed as dynamic route handlers.

- [ ] **Step 2: Live route smoke (optional, needs dev server + login cookie)**

With `npm run dev` and an authenticated session, `POST /api/admin/projects` with a minimal body creates a project; `GET` lists it; unauthenticated requests return 401. (Can be deferred to Plan 4b when the UI exercises these.)

- [ ] **Step 3: Update `docs/ROADMAP.md`** — add a P4a line marked ☑ (projects backend + media API), keep P4b (UI) pending.

- [ ] **Step 4: Update `docs/HANDOVER.md`** — record backend + media API done and tested; next = Plan 4b (projects admin UI + media picker + upload widget wiring these routes).

- [ ] **Step 5: Commit**

```bash
git add docs/
git commit -m "docs: P4a complete (projects backend + media API)"
```

---

## Self-Review

- **Spec coverage (backend slice):** projects CRUD + duplicate + reorder + search/filter/status/featured (Tasks 2–3); media upload via signed URLs + register + list + delete (Task 4); every route auth-gated + zod-validated + rate-limited (Tasks 1,3,4). UI is Plan 4b. ✓
- **Placeholder scan:** none; full code throughout. ✓
- **Type consistency:** `projectInputSchema`/`ProjectInput` shared by service + routes; service function names match test + route imports; `requireAdmin`/`json`/`badRequest`/`errorResponse` used uniformly; media helpers (`createMedia`/`listMedia`/`deleteMedia`) and storage helpers (`buildObjectKey`/`getSignedUploadUrl`/`publicUrl`/`r2Configured`) match P2 signatures. ✓
- **Security note:** signed-URL uploads keep bytes off the app server; content-type allowlist on sign; size cap on register; rate limits on all mutations; 401 on missing session. ✓
