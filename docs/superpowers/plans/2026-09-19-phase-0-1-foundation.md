# Naazware CMS — Plan 1: Foundation (Phases 0–1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the repo-as-source-of-truth docs system, then move the public website's data layer from Sanity to MongoDB (Mongoose) so every public page renders from MongoDB, with local data as fallback.

**Architecture:** Add a cached Mongoose connection helper, define the content models needed for public reads (Media, Project, Post, Testimonial), reseed illustrative content into MongoDB, and rewrite `lib/content.ts` to read MongoDB while keeping its exported function signatures identical so public pages are untouched. Sanity files stay in place (removed later in Phase 9) — this plan does not delete them.

**Tech Stack:** Next.js 14 App Router, TypeScript, Mongoose 8, MongoDB Atlas, Vitest + mongodb-memory-server (tests), tsx (scripts).

## Global Constraints

- Node `>=18` (package.json engines).
- TypeScript `strict` is on — no `any` leaks; all model fields typed.
- Path alias `@/*` → repo root; use it in imports (e.g. `@/lib/db`).
- `tsconfig.json` currently `exclude`s `scripts` — keep scripts out of the typecheck build; run them via `tsx`.
- Env files are gitignored (`.env*.local`) — never commit secrets. Document names in `docs/ENV.md`.
- Docs under `docs/**` are un-ignored and committed — they are the source of truth.
- Do NOT remove any `sanity/` code, `next-sanity`, or `@sanity/*` deps in this plan (that is Phase 9, gated).
- New env var this plan: `MONGODB_URI`.
- Public function signatures in `lib/content.ts` must not change (existing pages consume them).

---

### Task 1: Repo-as-source-of-truth docs system + ADRs

Foundation for session handover. No automated tests — deliverable is the committed docs set, verified by inspection.

**Files:**
- Create: `docs/PROJECT.md`
- Create: `docs/ROADMAP.md`
- Create: `docs/HANDOVER.md`
- Create: `docs/ISSUES.md`
- Create: `docs/ENV.md`
- Create: `docs/decisions/0001-mongodb-with-mongoose.md`
- Create: `docs/decisions/0002-authjs-credentials.md`
- Create: `docs/decisions/0003-tiptap-journal-editor.md`
- Create: `docs/decisions/0004-r2-media-storage.md`
- Create: `docs/decisions/0005-reseed-not-export-migration.md`
- Create: `docs/decisions/0006-render-hosting.md`

**Interfaces:**
- Produces: the documentation contract every future session reads first. ROADMAP.md is the phase tracker; HANDOVER.md is current-state; ISSUES.md is tiered issue log; ENV.md lists env var names + purpose (no secrets); `decisions/` holds one ADR per decision.

- [ ] **Step 1: Write `docs/PROJECT.md`**

```markdown
# Naazware Website — Project Guide

Custom software studio site: Next.js 14 (App Router) + React 18 + TS + Tailwind.
Being migrated OFF Sanity ONTO a self-owned CMS (MongoDB + Cloudflare R2 + Resend), deployed on Render.

## Read this first (session start)
1. Read ROADMAP.md → current phase + what's done/pending.
2. Read HANDOVER.md → last session state, next step, blockers.
3. Read ISSUES.md → known issues.
4. Skim decisions/ → settled architecture (don't relitigate).
5. VERIFY docs against actual code. Code wins on conflict — then fix the docs.

## Stack
- Framework: Next.js 14.2, React 18, TypeScript (strict).
- Data: MongoDB Atlas via Mongoose 8 (`lib/db.ts`, `lib/models/*`).
- Media: Cloudflare R2 (S3 API) — from Phase 2.
- Email: Resend (contact notifications, password reset).
- Auth: Auth.js (next-auth v5) credentials, single admin — from Phase 3.
- Editor: Tiptap (journal) — from Phase 6.
- Hosting: Render.

## Commands
- `npm run dev` — local dev.
- `npm run build` — production build (must pass before a phase is done).
- `npm run type-check` — `tsc --noEmit`.
- `npm run lint` — next lint.
- `npm run test` — Vitest.
- `npm run seed:mongo` — reseed illustrative content into MongoDB.

## Source of truth
The repository, not chat history. Persist every decision/change into these docs.
```

- [ ] **Step 2: Write `docs/ROADMAP.md`**

```markdown
# Roadmap — Naazware Custom CMS (Spec 1)

Spec: docs/superpowers/specs/2026-09-19-naazware-cms-data-layer-design.md
Status legend: ☐ pending · ◐ partial · ☑ done+verified

## Phases
- ◐ P0 Docs/handover scaffold + ADRs
- ☐ P1 Mongoose models + `lib/content.ts` swap + reseed (public site on Mongo)
- ☐ P2 R2 storage interface + Media uploads
- ☐ P3 Auth.js + admin shell + create-admin script
- ☐ P4 Projects management
- ☐ P5 Testimonials management
- ☐ P6 Journal management (Tiptap)
- ☐ P7 Inbox + contact route rewired to Mongo
- ☐ P8 Settings
- ☐ P9 Sanity removal (gated: only after P1–P7 verified)
- ☐ P10 Render deployment

Then Spec 2: public website redesign (separate brainstorm).

## Dependencies
P1→(all). P2→P4,P5,P6 (media). P3→P4..P8 (auth). P9 needs P1+P7 verified. P10 last.
```

- [ ] **Step 3: Write `docs/HANDOVER.md`**

```markdown
# Handover — current state

**Last updated:** 2026-09-19
**Branch:** feat/custom-cms
**Current phase:** P0 → starting P1

## Done + verified
- Spec 1 approved and committed.
- Docs/handover system created (this file set).

## In progress
- Phase 1: models + content.ts swap.

## Tested
- Nothing runtime yet.

## Broken / blockers
- None. (R2 keys needed before P2 — user provisions.)

## Next step
- Execute Plan 1 Task 2 (deps + Vitest).

## Notes
- Sanity still live as fallback; do NOT remove until P9 gate.
```

- [ ] **Step 4: Write `docs/ISSUES.md`**

```markdown
# Known issues

Tiers: 🔴 critical · 🟠 important · 🟡 minor · 🔵 future

## Open
- 🔵 `styled-components` dep appears unused alongside Tailwind — remove during P9 cleanup.
- 🔵 Hosting split-brain (.netlify + .vercel present) — resolve at P10 (Render).

## Resolved
- (none yet)
```

- [ ] **Step 5: Write `docs/ENV.md`**

```markdown
# Environment variables (names + purpose only — NEVER commit values)

## Active
- NEXT_PUBLIC_SITE_URL — canonical site origin.
- MONGODB_URI — MongoDB Atlas connection string (server only).
- RESEND_API_KEY — Resend email API key (server only).
- CONTACT_NOTIFICATION_TO — inbox for contact notifications.
- RESEND_FROM — verified Resend sender.

## Added later
- P2: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL.
- P3: AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD (bootstrap only).

## Removed after P9
- NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_SANITY_API_VERSION, SANITY_API_WRITE_TOKEN.
```

- [ ] **Step 6: Write the six ADRs**

Each ADR uses this format. Write one file per decision with the content below.

`docs/decisions/0001-mongodb-with-mongoose.md`:
```markdown
# 0001 — MongoDB (Atlas) via Mongoose

Status: Accepted (2026-09-19)

## Decision
Use MongoDB Atlas as the datastore, accessed through Mongoose 8.

## Why
Data is simple documents (projects, posts, testimonials, enquiries) with no
complex relational needs. Mongoose gives schema, validation, hooks, and TS
types in one place — matching the "clean model structure" goal.

## Alternatives rejected
- Native driver: hand-rolled validation/types = more code, same result.
- Prisma (Mongo): weak Mongo support (no true transactions/relations); fights the document grain.
```

`docs/decisions/0002-authjs-credentials.md`:
```markdown
# 0002 — Auth.js (next-auth v5) Credentials provider

Status: Accepted (2026-09-19)

## Decision
Single-admin auth via Auth.js Credentials + MongoDB adapter; passwords hashed with argon2.

## Why
Session cookies + CSRF built in, cheap, battle-tested, extensible to roles later
without rewrite. Schema keeps a `role` field from day one.

## Alternatives rejected
- Hand-rolled JWT: owns every edge case.
- Clerk/Auth0: monthly cost, overkill for one admin.
```

`docs/decisions/0003-tiptap-journal-editor.md`:
```markdown
# 0003 — Tiptap for the journal editor

Status: Accepted (2026-09-19)

## Decision
Use Tiptap (headless) for the journal; store content as Tiptap JSON in Mongo.

## Why
Cleanest "modern writing app" UX; JSON renders to React/HTML on the public side.

## Alternatives rejected
- Lexical: more powerful but heavier integration.
- Raw markdown/textarea: fails the writing-experience bar.
```

`docs/decisions/0004-r2-media-storage.md`:
```markdown
# 0004 — Cloudflare R2 for media

Status: Accepted (2026-09-19)

## Decision
Store all uploaded media in Cloudflare R2 (S3 API). Mongo stores metadata + object key/URL only.

## Why
Cheap egress, S3-compatible, keeps binaries out of Mongo. Signed upload URLs let
large files skip the app server.

## Alternatives rejected
- Images in Mongo: bloats the DB, bad practice.
- Cloudinary/UploadThing: extra cost/vendor; R2 already chosen by user.
```

`docs/decisions/0005-reseed-not-export-migration.md`:
```markdown
# 0005 — Reseed instead of exporting Sanity content

Status: Accepted (2026-09-19)

## Decision
The Sanity content is illustrative/seeded, so reseed fresh into MongoDB from the
local data files rather than building a fragile Sanity export/import.

## Why
No real production content to preserve; local data files are the true source.
```

`docs/decisions/0006-render-hosting.md`:
```markdown
# 0006 — Render hosting

Status: Accepted (2026-09-19)

## Decision
Deploy on Render (user has an account). Retire Netlify/Vercel configs at P10.

## Why
Single simple host for the Next.js app; user preference; cost-conscious.
```

- [ ] **Step 7: Commit**

```bash
git add docs/
git commit -m "docs: add repo-as-source-of-truth handover system + ADRs (P0)"
```

---

### Task 2: Add dependencies + Vitest test infrastructure

**Files:**
- Modify: `package.json` (deps + scripts)
- Create: `vitest.config.ts`
- Create: `test/setup-db.ts`
- Create: `test/smoke.test.ts`

**Interfaces:**
- Produces: `npm run test` (Vitest) works; `withTestDb()` helper in `test/setup-db.ts` spins an in-memory Mongo for model/content tests. Signature: `withTestDb(): { uri: string }` via Vitest `beforeAll`/`afterAll` hooks exported as `setupTestDb()`.

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm install mongoose@^8
npm install -D vitest@^2 mongodb-memory-server@^10
```
Expected: added to package.json, no peer-dep errors that block install.

- [ ] **Step 2: Add scripts to `package.json`**

Add these entries to the `"scripts"` object:
```json
"test": "vitest run",
"test:watch": "vitest",
"seed:mongo": "tsx --env-file=.env.local scripts/seed-mongo.ts"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'lib/**/*.test.ts'],
    testTimeout: 30000, // mongodb-memory-server first download can be slow
  },
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 4: Create `test/setup-db.ts`**

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll } from 'vitest'

let mongod: MongoMemoryServer

/** Call inside a describe block to get an isolated in-memory Mongo per test file. */
export function setupTestDb() {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    await mongoose.connect(mongod.getUri())
  })

  afterEach(async () => {
    const { collections } = mongoose.connection
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({})
    }
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongod.stop()
  })
}
```

- [ ] **Step 5: Write a smoke test at `test/smoke.test.ts`**

```typescript
import { describe, expect, it } from 'vitest'
import mongoose from 'mongoose'
import { setupTestDb } from './setup-db'

describe('test infra', () => {
  setupTestDb()

  it('connects to an in-memory mongo', () => {
    expect(mongoose.connection.readyState).toBe(1) // connected
  })
})
```

- [ ] **Step 6: Run the smoke test**

Run: `npm run test`
Expected: PASS (1 test). First run may download the mongod binary — allow time.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts test/
git commit -m "test: add Vitest + in-memory Mongo infra"
```

---

### Task 3: Mongoose connection helper

**Files:**
- Create: `lib/db.ts`
- Create: `lib/db.test.ts`

**Interfaces:**
- Produces: `export async function connectDb(): Promise<typeof import('mongoose')>` — connects using `process.env.MONGODB_URI`, caches the connection across hot reloads / serverless invocations, throws if `MONGODB_URI` is missing.

- [ ] **Step 1: Write the failing test `lib/db.test.ts`**

```typescript
import { describe, expect, it, vi } from 'vitest'

describe('connectDb', () => {
  it('throws when MONGODB_URI is missing', async () => {
    vi.stubEnv('MONGODB_URI', '')
    const { connectDb } = await import('./db')
    await expect(connectDb()).rejects.toThrow(/MONGODB_URI/)
    vi.unstubAllEnvs()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test -- lib/db.test.ts`
Expected: FAIL (cannot resolve `./db`).

- [ ] **Step 3: Implement `lib/db.ts`**

```typescript
import mongoose from 'mongoose'

// Cache across hot reloads (dev) and serverless invocations (prod) to avoid
// exhausting connections. Standard Next.js + Mongoose pattern.
type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
const g = globalThis as unknown as { _mongoose?: Cache }
const cache: Cache = g._mongoose ?? { conn: null, promise: null }
g._mongoose = cache

export async function connectDb(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')
  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, { bufferCommands: false })
  }
  cache.conn = await cache.promise
  return cache.conn
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- lib/db.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/db.ts lib/db.test.ts
git commit -m "feat: add cached Mongoose connection helper"
```

---

### Task 4: Media model

Defined now so Project/Post/Testimonial can reference it; R2 upload wiring is Phase 2. Reseeded content leaves media refs empty (illustrative content has no real images).

**Files:**
- Create: `lib/models/Media.ts`
- Create: `lib/models/Media.test.ts`

**Interfaces:**
- Produces: `Media` Mongoose model + `MediaDoc` type. Fields: `key: string` (required, unique), `url: string` (required), `type: string`, `size: number`, `width?: number`, `height?: number`, `alt?: string`, `filename?: string`, timestamps.

- [ ] **Step 1: Write the failing test `lib/models/Media.test.ts`**

```typescript
import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import { Media } from './Media'

describe('Media model', () => {
  setupTestDb()

  it('requires key and url', async () => {
    await expect(Media.create({})).rejects.toThrow()
  })

  it('creates with key + url', async () => {
    const m = await Media.create({ key: 'covers/a.png', url: 'https://cdn/a.png', type: 'image/png', size: 10 })
    expect(m.key).toBe('covers/a.png')
    expect(m.url).toBe('https://cdn/a.png')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test -- lib/models/Media.test.ts`
Expected: FAIL (cannot resolve `./Media`).

- [ ] **Step 3: Implement `lib/models/Media.ts`**

```typescript
import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

const mediaSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    type: { type: String, default: '' },
    size: { type: Number, default: 0 },
    width: { type: Number },
    height: { type: Number },
    alt: { type: String },
    filename: { type: String },
  },
  { timestamps: true }
)

export type MediaDoc = InferSchemaType<typeof mediaSchema>
export const Media: Model<MediaDoc> =
  (models.Media as Model<MediaDoc>) ?? model<MediaDoc>('Media', mediaSchema)
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- lib/models/Media.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/models/Media.ts lib/models/Media.test.ts
git commit -m "feat: add Media model"
```

---

### Task 5: Project model

**Files:**
- Create: `lib/models/Project.ts`
- Create: `lib/models/Project.test.ts`

**Interfaces:**
- Consumes: `Media` (ref by ObjectId).
- Produces: `Project` model + `ProjectDoc` type. Fields: `title` (req), `slug` (req, unique), `client` (req), `industry`, `shortDescription` (req), `fullDescription`, `challenge`, `solution`, `outcome`, `services: string[]`, `technologies: string[]`, `metrics: {label,value}[]`, `coverMedia?: ObjectId→Media`, `gallery: ObjectId[]→Media`, `videoUrl`, `externalUrl`, `testimonial?: {quote,author,role}`, `featured: boolean`, `order: number`, `status: 'draft'|'published'`, `seo: {title,description,ogImage}`, timestamps.

- [ ] **Step 1: Write the failing test `lib/models/Project.test.ts`**

```typescript
import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import { Project } from './Project'

describe('Project model', () => {
  setupTestDb()

  it('requires title, slug, client, shortDescription', async () => {
    await expect(Project.create({})).rejects.toThrow()
  })

  it('defaults status=draft, featured=false, order=0', async () => {
    const p = await Project.create({ title: 'A', slug: 'a', client: 'C', shortDescription: 'x' })
    expect(p.status).toBe('draft')
    expect(p.featured).toBe(false)
    expect(p.order).toBe(0)
    expect(p.services).toEqual([])
  })

  it('rejects invalid status', async () => {
    await expect(
      Project.create({ title: 'A', slug: 'a2', client: 'C', shortDescription: 'x', status: 'bogus' })
    ).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test -- lib/models/Project.test.ts`
Expected: FAIL (cannot resolve `./Project`).

- [ ] **Step 3: Implement `lib/models/Project.ts`**

```typescript
import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose'

const metricSchema = new Schema(
  { label: { type: String, default: '' }, value: { type: String, default: '' } },
  { _id: false }
)

const seoSchema = new Schema(
  { title: { type: String }, description: { type: String }, ogImage: { type: String } },
  { _id: false }
)

const embeddedTestimonial = new Schema(
  { quote: { type: String }, author: { type: String }, role: { type: String } },
  { _id: false }
)

const projectSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    client: { type: String, required: true },
    industry: { type: String, default: '' },
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, default: '' },
    challenge: { type: String, default: '' },
    solution: { type: String, default: '' },
    outcome: { type: String, default: '' },
    services: { type: [String], default: [] },
    technologies: { type: [String], default: [] },
    metrics: { type: [metricSchema], default: [] },
    coverMedia: { type: Types.ObjectId, ref: 'Media' },
    gallery: { type: [Types.ObjectId], ref: 'Media', default: [] },
    videoUrl: { type: String },
    externalUrl: { type: String },
    testimonial: { type: embeddedTestimonial },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    seo: { type: seoSchema, default: {} },
  },
  { timestamps: true }
)

export type ProjectDoc = InferSchemaType<typeof projectSchema>
export const Project: Model<ProjectDoc> =
  (models.Project as Model<ProjectDoc>) ?? model<ProjectDoc>('Project', projectSchema)
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- lib/models/Project.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/models/Project.ts lib/models/Project.test.ts
git commit -m "feat: add Project model"
```

---

### Task 6: Post model

**Files:**
- Create: `lib/models/Post.ts`
- Create: `lib/models/Post.test.ts`

**Interfaces:**
- Consumes: `Media` (ref).
- Produces: `Post` model + `PostDoc`. Fields: `title` (req), `slug` (req, unique), `excerpt` (req), `coverMedia?: ObjectId→Media`, `content?: Mixed` (Tiptap JSON, optional until P6), `contentMarkdown?: string` (interim body for reseed/public render before Tiptap), `author` (default 'Naazware'), `category`, `tags: string[]`, `status: 'draft'|'published'`, `publishDate: Date`, `readTime`, `seoTitle`, `seoDescription`, `ogImage`, timestamps.

- [ ] **Step 1: Write the failing test `lib/models/Post.test.ts`**

```typescript
import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import { Post } from './Post'

describe('Post model', () => {
  setupTestDb()

  it('requires title, slug, excerpt', async () => {
    await expect(Post.create({})).rejects.toThrow()
  })

  it('defaults author=Naazware, status=draft, tags=[]', async () => {
    const p = await Post.create({ title: 'T', slug: 't', excerpt: 'e' })
    expect(p.author).toBe('Naazware')
    expect(p.status).toBe('draft')
    expect(p.tags).toEqual([])
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test -- lib/models/Post.test.ts`
Expected: FAIL (cannot resolve `./Post`).

- [ ] **Step 3: Implement `lib/models/Post.ts`**

```typescript
import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose'

const postSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    coverMedia: { type: Types.ObjectId, ref: 'Media' },
    content: { type: Schema.Types.Mixed }, // Tiptap JSON (from P6)
    contentMarkdown: { type: String, default: '' }, // interim body for reseed/public render
    author: { type: String, default: 'Naazware' },
    category: { type: String, default: '' },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishDate: { type: Date, default: Date.now },
    readTime: { type: String, default: '' },
    seoTitle: { type: String },
    seoDescription: { type: String },
    ogImage: { type: String },
  },
  { timestamps: true }
)

export type PostDoc = InferSchemaType<typeof postSchema>
export const Post: Model<PostDoc> =
  (models.Post as Model<PostDoc>) ?? model<PostDoc>('Post', postSchema)
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- lib/models/Post.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/models/Post.ts lib/models/Post.test.ts
git commit -m "feat: add Post model"
```

---

### Task 7: Testimonial model

**Files:**
- Create: `lib/models/Testimonial.ts`
- Create: `lib/models/Testimonial.test.ts`

**Interfaces:**
- Consumes: `Media` (ref).
- Produces: `Testimonial` model + `TestimonialDoc`. Fields: `name` (req), `role`, `company`, `quote` (req), `image?: ObjectId→Media`, `companyLogo?: ObjectId→Media`, `featured: boolean`, `published: boolean` (default true), `order: number`, timestamps.

- [ ] **Step 1: Write the failing test `lib/models/Testimonial.test.ts`**

```typescript
import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import { Testimonial } from './Testimonial'

describe('Testimonial model', () => {
  setupTestDb()

  it('requires name and quote', async () => {
    await expect(Testimonial.create({})).rejects.toThrow()
  })

  it('defaults published=true, featured=false, order=0', async () => {
    const t = await Testimonial.create({ name: 'Sarah', quote: 'Great' })
    expect(t.published).toBe(true)
    expect(t.featured).toBe(false)
    expect(t.order).toBe(0)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test -- lib/models/Testimonial.test.ts`
Expected: FAIL (cannot resolve `./Testimonial`).

- [ ] **Step 3: Implement `lib/models/Testimonial.ts`**

```typescript
import { Schema, model, models, Types, type InferSchemaType, type Model } from 'mongoose'

const testimonialSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, default: '' },
    company: { type: String, default: '' },
    quote: { type: String, required: true },
    image: { type: Types.ObjectId, ref: 'Media' },
    companyLogo: { type: Types.ObjectId, ref: 'Media' },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export type TestimonialDoc = InferSchemaType<typeof testimonialSchema>
export const Testimonial: Model<TestimonialDoc> =
  (models.Testimonial as Model<TestimonialDoc>) ??
  model<TestimonialDoc>('Testimonial', testimonialSchema)
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test -- lib/models/Testimonial.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/models/Testimonial.ts lib/models/Testimonial.test.ts
git commit -m "feat: add Testimonial model"
```

---

### Task 8: Reseed script — illustrative content into MongoDB

**Files:**
- Create: `scripts/seed-mongo.ts`

**Interfaces:**
- Consumes: `connectDb`, `Project`, `Post`, `Testimonial`; local data `@/lib/case-studies-data` (`caseStudies`), `@/lib/blog-posts-data` (`blogPosts`), and the local testimonials array (copied into the script — the array currently lives inside `lib/content.ts` as `localTestimonials`; move it to `lib/testimonials-data.ts` in Task 9 Step 1 and import from there).
- Produces: an idempotent seed (upsert by `slug` for projects/posts, by `name`+`order` for testimonials) so re-running updates instead of duplicating.

- [ ] **Step 1: Create `lib/testimonials-data.ts`** (extract the inline array so both the seed and content layer share it)

```typescript
export type LocalTestimonial = { name: string; role?: string; company?: string; quote: string; order: number }

export const testimonialsData: LocalTestimonial[] = [
  {
    name: 'Sarah Chen',
    role: 'Director of E-commerce',
    company: 'RetailCo',
    quote:
      'The new checkout flow paid for itself in the first month. Our customers love how fast and simple it is.',
    order: 0,
  },
  {
    name: 'Dr. Michael Torres',
    role: 'CTO',
    company: 'MediHealth',
    quote:
      'Security and accessibility were both critical. The team delivered on both without compromise.',
    order: 1,
  },
  {
    name: 'James Park',
    role: 'Operations Manager',
    company: 'QuickShip',
    quote: "Our drivers actually love using this app. That's never happened before.",
    order: 2,
  },
]
```

- [ ] **Step 2: Write `scripts/seed-mongo.ts`**

```typescript
/**
 * Reseed illustrative content into MongoDB. Idempotent: upserts by slug (projects/posts)
 * and by name+order (testimonials), so re-running updates instead of duplicating.
 *
 * Run:  npm run seed:mongo   (requires MONGODB_URI in .env.local)
 */
import { connectDb } from '../lib/db'
import { Project } from '../lib/models/Project'
import { Post } from '../lib/models/Post'
import { Testimonial } from '../lib/models/Testimonial'
import { caseStudies } from '../lib/case-studies-data'
import { blogPosts } from '../lib/blog-posts-data'
import { testimonialsData } from '../lib/testimonials-data'
import mongoose from 'mongoose'

async function main() {
  await connectDb()

  for (const c of caseStudies) {
    await Project.updateOne(
      { slug: c.slug },
      {
        $set: {
          title: c.title,
          slug: c.slug,
          client: c.client,
          industry: c.industry,
          shortDescription: c.excerpt,
          challenge: c.challenge,
          solution: c.solution,
          outcome: c.outcome,
          metrics: c.metrics,
          technologies: c.technologies,
          testimonial: c.testimonial,
          featured: c.featured,
          status: 'published',
        },
      },
      { upsert: true }
    )
  }
  console.log(`Seeded ${caseStudies.length} projects`)

  for (const p of blogPosts) {
    await Post.updateOne(
      { slug: p.slug },
      {
        $set: {
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          author: p.author,
          publishDate: new Date(p.date),
          readTime: p.readTime,
          tags: p.tags,
          contentMarkdown: p.content,
          status: p.published ? 'published' : 'draft',
        },
      },
      { upsert: true }
    )
  }
  console.log(`Seeded ${blogPosts.length} posts`)

  for (const t of testimonialsData) {
    await Testimonial.updateOne(
      { name: t.name, order: t.order },
      { $set: { name: t.name, role: t.role, company: t.company, quote: t.quote, order: t.order, published: true } },
      { upsert: true }
    )
  }
  console.log(`Seeded ${testimonialsData.length} testimonials`)

  await mongoose.disconnect()
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 3: Verify the seed runs against Atlas**

Run: `npm run seed:mongo`
Expected: logs `Seeded N projects/posts/testimonials` then `Done.` (requires a real `MONGODB_URI`). If `MONGODB_URI` is not yet set locally, note it in HANDOVER.md as the blocking manual step and continue; the content-layer tests in Task 9 use in-memory Mongo and do not need Atlas.

- [ ] **Step 4: Commit**

```bash
git add lib/testimonials-data.ts scripts/seed-mongo.ts
git commit -m "feat: add MongoDB reseed script + shared testimonials data"
```

---

### Task 9: Rewrite `lib/content.ts` to read MongoDB (signatures preserved)

**Files:**
- Modify: `lib/content.ts` (full rewrite of the fetch internals; keep exported names/shapes)
- Create: `lib/content.test.ts`

**Interfaces:**
- Consumes: `connectDb`, `Project`, `Post`, `Testimonial`, `Media`, `testimonialsData`; local fallbacks `caseStudies`, `blogPosts`.
- Produces: **unchanged** exports — `getTestimonials()`, `getProjects()`, `getFeaturedProjects()`, `getProject(slug)`, `getProjectSlugs()`, `getPosts()`, `getPost(slug)`, `getPostSlugs()`, `getRelatedPosts(slug, tags, limit?)`, plus types `Project`, `Post`, `Testimonial`, `Metric`, `Quote`. Return shapes match today's (superset): `coverUrl: string | null` resolved from `coverMedia` when populated. Falls back to local data when Mongo is empty/unavailable.

- [ ] **Step 1: Write the failing test `lib/content.test.ts`**

```typescript
import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import { Project } from './models/Project'
import { Post } from './models/Post'
import { Testimonial } from './models/Testimonial'
import { getProjects, getFeaturedProjects, getPosts, getTestimonials } from './content'

describe('content layer (Mongo-backed)', () => {
  setupTestDb()

  it('returns published projects from Mongo, ordered', async () => {
    await Project.create({ title: 'B', slug: 'b', client: 'C', shortDescription: 'x', status: 'published', order: 1 })
    await Project.create({ title: 'A', slug: 'a', client: 'C', shortDescription: 'x', status: 'published', order: 0, featured: true })
    const projects = await getProjects()
    expect(projects.map((p) => p.slug)).toEqual(['a', 'b'])
    expect(projects[0].coverUrl).toBeNull()
    const featured = await getFeaturedProjects()
    expect(featured.map((p) => p.slug)).toEqual(['a'])
  })

  it('excludes draft posts and orders by publishDate desc', async () => {
    await Post.create({ title: 'Old', slug: 'old', excerpt: 'e', status: 'published', publishDate: new Date('2020-01-01') })
    await Post.create({ title: 'New', slug: 'new', excerpt: 'e', status: 'published', publishDate: new Date('2024-01-01') })
    await Post.create({ title: 'Draft', slug: 'draft', excerpt: 'e', status: 'draft' })
    const posts = await getPosts()
    expect(posts.map((p) => p.slug)).toEqual(['new', 'old'])
  })

  it('returns published testimonials ordered', async () => {
    await Testimonial.create({ name: 'Z', quote: 'q', order: 1, published: true })
    await Testimonial.create({ name: 'A', quote: 'q', order: 0, published: true })
    await Testimonial.create({ name: 'Hidden', quote: 'q', order: 2, published: false })
    const rows = await getTestimonials()
    expect(rows.map((t) => t.author)).toEqual(['A', 'Z'])
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test -- lib/content.test.ts`
Expected: FAIL (content.ts still imports Sanity `client`; `getProjects` reads Sanity, not the models).

- [ ] **Step 3: Rewrite `lib/content.ts`**

Replace the file with the following. Types and export names are unchanged from today; only the data source changes (Mongo instead of Sanity), and `content?: string` on `Post` now carries `contentMarkdown`.

```typescript
import { connectDb } from './db'
import { Project as ProjectModel } from './models/Project'
import { Post as PostModel } from './models/Post'
import { Testimonial as TestimonialModel } from './models/Testimonial'
import { Media } from './models/Media'
import { caseStudies as localProjects } from './case-studies-data'
import { blogPosts as localPosts } from './blog-posts-data'
import { testimonialsData } from './testimonials-data'

// ─── Shared shapes (superset of local data + Mongo) ───
export type Metric = { label: string; value: string }
export type Quote = { quote: string; author: string; role?: string }

export type Project = {
  slug: string
  title: string
  client: string
  industry: string
  excerpt: string
  challenge: string
  solution: string
  outcome: string
  metrics: Metric[]
  technologies: string[]
  testimonial?: Quote
  featured: boolean
  coverUrl: string | null
}

export type Post = {
  slug: string
  title: string
  excerpt: string
  author: string
  date: string
  readTime: string
  tags: string[]
  coverUrl: string | null
  content?: string // markdown body (interim, until Tiptap on public side)
}

export type Testimonial = Quote

// ─── Local fallback mappers ───
const projectFromLocal = (c: (typeof localProjects)[number]): Project => ({
  slug: c.slug,
  title: c.title,
  client: c.client,
  industry: c.industry,
  excerpt: c.excerpt,
  challenge: c.challenge,
  solution: c.solution,
  outcome: c.outcome,
  metrics: c.metrics,
  technologies: c.technologies,
  testimonial: c.testimonial,
  featured: c.featured,
  coverUrl: null,
})

const postFromLocal = (p: (typeof localPosts)[number]): Post => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  author: p.author,
  date: p.date,
  readTime: p.readTime,
  tags: p.tags,
  coverUrl: null,
  content: p.content,
})

const localTestimonials: Testimonial[] = testimonialsData.map((t) => ({
  quote: t.quote,
  author: t.name,
  role: [t.role, t.company].filter(Boolean).join(', ') || undefined,
}))

// Resolve a populated coverMedia (or null) to a URL.
const coverUrlOf = (cover: unknown): string | null =>
  cover && typeof cover === 'object' && 'url' in cover ? String((cover as { url: string }).url) : null

// Best-effort DB connect; on failure, callers fall back to local data.
async function tryDb(): Promise<boolean> {
  try {
    await connectDb()
    return true
  } catch {
    return false
  }
}

// ─── Public API (Mongo when available + non-empty, else local) ───

export async function getTestimonials(): Promise<Testimonial[]> {
  if (!(await tryDb())) return localTestimonials
  const rows = await TestimonialModel.find({ published: true }).sort({ order: 1 }).lean()
  if (!rows.length) return localTestimonials
  return rows.map((t) => ({
    quote: t.quote,
    author: t.name,
    role: [t.role, t.company].filter(Boolean).join(', ') || undefined,
  }))
}

export async function getProjects(): Promise<Project[]> {
  if (!(await tryDb())) return localProjects.map(projectFromLocal)
  const rows = await ProjectModel.find({ status: 'published' })
    .sort({ order: 1 })
    .populate({ path: 'coverMedia', model: Media })
    .lean()
  if (!rows.length) return localProjects.map(projectFromLocal)
  return rows.map((p) => ({
    slug: p.slug,
    title: p.title,
    client: p.client,
    industry: p.industry ?? '',
    excerpt: p.shortDescription,
    challenge: p.challenge ?? '',
    solution: p.solution ?? '',
    outcome: p.outcome ?? '',
    metrics: (p.metrics ?? []).map((m) => ({ label: m.label ?? '', value: m.value ?? '' })),
    technologies: p.technologies ?? [],
    testimonial: p.testimonial?.quote
      ? { quote: p.testimonial.quote, author: p.testimonial.author ?? '', role: p.testimonial.role }
      : undefined,
    featured: Boolean(p.featured),
    coverUrl: coverUrlOf(p.coverMedia),
  }))
}

export async function getFeaturedProjects(): Promise<Project[]> {
  return (await getProjects()).filter((p) => p.featured)
}

export async function getProject(slug: string): Promise<Project | null> {
  return (await getProjects()).find((p) => p.slug === slug) ?? null
}

export async function getProjectSlugs(): Promise<string[]> {
  return (await getProjects()).map((p) => p.slug)
}

export async function getPosts(): Promise<Post[]> {
  if (!(await tryDb())) return localPosts.filter((p) => p.published).map(postFromLocal)
  const rows = await PostModel.find({ status: 'published' })
    .sort({ publishDate: -1 })
    .populate({ path: 'coverMedia', model: Media })
    .lean()
  if (!rows.length) return localPosts.filter((p) => p.published).map(postFromLocal)
  return rows.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    author: p.author ?? 'Naazware',
    date: (p.publishDate ?? p.createdAt ?? new Date()).toISOString().slice(0, 10),
    readTime: p.readTime ?? '',
    tags: p.tags ?? [],
    coverUrl: coverUrlOf(p.coverMedia),
    content: p.contentMarkdown ?? '',
  }))
}

export async function getPost(slug: string): Promise<Post | null> {
  return (await getPosts()).find((p) => p.slug === slug) ?? null
}

export async function getPostSlugs(): Promise<string[]> {
  return (await getPosts()).map((p) => p.slug)
}

/** Posts most related to `slug`, ranked by shared tags then recency. */
export async function getRelatedPosts(slug: string, tags: string[], limit = 3): Promise<Post[]> {
  const others = (await getPosts()).filter((p) => p.slug !== slug)
  return others
    .map((p) => ({ p, score: p.tags.filter((t) => tags.includes(t)).length }))
    .sort((a, b) => b.score - a.score || +new Date(b.p.date) - +new Date(a.p.date))
    .slice(0, limit)
    .map((s) => s.p)
}
```

- [ ] **Step 4: Run the content tests to verify they pass**

Run: `npm run test -- lib/content.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full test suite + typecheck + build**

Run: `npm run test && npm run type-check && npm run build`
Expected: all tests pass; `tsc` clean; `next build` succeeds. (Build reads no live DB at build time for these pages only if pages are dynamic; if a page statically generates and Mongo is unreachable, the `tryDb()` fallback returns local data — build still succeeds.)

- [ ] **Step 6: Commit**

```bash
git add lib/content.ts lib/content.test.ts
git commit -m "feat: read content from MongoDB with local fallback (signatures preserved)"
```

---

### Task 10: Manual verification + handover update

**Files:**
- Modify: `docs/ROADMAP.md`, `docs/HANDOVER.md`

- [ ] **Step 1: Run the site against a seeded Atlas DB**

Ensure `.env.local` has a real `MONGODB_URI`. Run `npm run seed:mongo`, then `npm run dev`. Visit `/`, `/work`, `/work/[slug]`, `/blog`, `/blog/[slug]`. Confirm projects, testimonials, and posts render from Mongo (temporarily add a distinctive test project via the seed to confirm it's live data, then remove it).

- [ ] **Step 2: Update `docs/ROADMAP.md`** — mark P0 ☑ and P1 ☑ (or ◐ with notes if the Atlas run is still pending keys).

- [ ] **Step 3: Update `docs/HANDOVER.md`** — record: models + content swap done and verified; tests green; Sanity still present (removal deferred to P9); next step = Plan 2 (Phase 2: R2 storage), which needs the R2 env vars.

- [ ] **Step 4: Commit**

```bash
git add docs/ROADMAP.md docs/HANDOVER.md
git commit -m "docs: mark P0–P1 complete; record content-layer verification"
```

---

## Self-Review

**Spec coverage (Phases 0–1 only — this plan's scope):**
- P0 docs/handover + ADRs → Task 1. ✓
- P1 Mongoose models → Tasks 4–7 (Media, Project, Post, Testimonial). ✓
- P1 `lib/content.ts` swap with preserved signatures → Task 9. ✓
- P1 reseed → Task 8. ✓
- Test infra (needed for TDD gate) → Task 2; DB helper → Task 3. ✓
- Per-phase gate (build+typecheck+lint+tests) → Task 9 Step 5 + Task 10. Note: `npm run lint` should also be run in Task 9 Step 5 — run `npm run test && npm run type-check && npm run lint && npm run build`.
- Enquiry/Settings/Admin models are NOT in this plan — correct; they belong to P3/P7/P8 per spec.

**Placeholder scan:** No TBD/TODO; every code step has full code. ✓

**Type consistency:** Model export names (`Project`, `Post`, `Testimonial`, `Media`) used consistently across Tasks 4–9. `content.ts` imports models with aliases (`ProjectModel` etc.) to avoid colliding with its own exported `Project`/`Post`/`Testimonial` types — intentional and consistent. `coverMedia` (not `coverImage`) used in models and in `content.ts` populate calls. ✓

**Correction applied:** Task 9 Step 5 command should include `npm run lint`. When executing, use: `npm run test && npm run type-check && npm run lint && npm run build`.
