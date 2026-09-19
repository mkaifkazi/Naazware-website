# Naazware CMS — Plan 2: R2 Storage + Media (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (or subagent-driven-development). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add a thin Cloudflare R2 storage layer and Media-record helpers so the CMS can store uploaded media in R2 and its metadata in MongoDB, with large files uploading directly to R2 via signed URLs.

**Architecture:** `lib/storage.ts` wraps the AWS S3 SDK pointed at the R2 S3 endpoint and exposes a minimal interface (key generation, signed upload URL, delete, public URL). `lib/media.ts` ties uploads to the `Media` Mongoose model (create/list/delete, deleting the R2 object alongside the record). No HTTP upload route yet — that arrives in Phase 3 once admin auth exists (an unauthenticated upload endpoint would be abuse-prone). A live round-trip script verifies R2 connectivity.

**Tech Stack:** `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, Mongoose, Vitest.

## Global Constraints

- Node `>=18`, TypeScript `strict`, `@/*` path alias.
- R2 secrets are server-only — never imported into client components.
- Env vars (already in `.env.local`, documented in ENV.md): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`.
- R2 S3 endpoint = `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`, region `auto`.
- Do NOT build a public HTTP upload route in this phase (deferred to P3, auth-gated).
- Reuse the existing Vitest infra (`test/setup-db.ts`, system mongod binary).

---

### Task 1: Install AWS S3 SDK

**Files:** Modify `package.json`.

- [ ] **Step 1: Install**

Run:
```bash
npm install @aws-sdk/client-s3@^3 @aws-sdk/s3-request-presigner@^3
```
Expected: both added to dependencies.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add AWS S3 SDK for R2 storage"
```

---

### Task 2: Storage layer (`lib/storage.ts`)

**Files:**
- Create: `lib/storage.ts`
- Create: `lib/storage.test.ts`

**Interfaces:**
- Produces:
  - `r2Configured(): boolean` — true when all R2 env vars are present.
  - `buildObjectKey(folder: string, filename: string): string` — sanitizes filename, prefixes folder + a short random id, returns e.g. `projects/1699-ab12_my-file.png`.
  - `publicUrl(key: string): string` — `${R2_PUBLIC_URL}/${key}`.
  - `getSignedUploadUrl(key: string, contentType: string, expiresSeconds?: number): Promise<string>` — presigned PUT URL.
  - `deleteObject(key: string): Promise<void>`.
  - `putObject(key: string, body: Uint8Array | Buffer | string, contentType: string): Promise<void>` — server-side upload (used by the round-trip test and small server uploads).

- [ ] **Step 1: Write the failing test `lib/storage.test.ts`** (pure-logic units; no network)

```typescript
import { describe, expect, it, vi } from 'vitest'

describe('storage helpers (pure)', () => {
  it('buildObjectKey sanitizes and namespaces', async () => {
    const { buildObjectKey } = await import('./storage')
    const key = buildObjectKey('projects', 'My Cover Photo!.PNG')
    expect(key).toMatch(/^projects\/[a-z0-9]+_my-cover-photo-.png$/i)
    expect(key).not.toContain(' ')
    expect(key).not.toContain('!')
  })

  it('publicUrl joins base and key', async () => {
    vi.stubEnv('R2_PUBLIC_URL', 'https://pub-x.r2.dev')
    const { publicUrl } = await import('./storage')
    expect(publicUrl('projects/a.png')).toBe('https://pub-x.r2.dev/projects/a.png')
    vi.unstubAllEnvs()
  })

  it('r2Configured is false when a var is missing', async () => {
    vi.stubEnv('R2_ACCOUNT_ID', '')
    const { r2Configured } = await import('./storage')
    expect(r2Configured()).toBe(false)
    vi.unstubAllEnvs()
  })
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npm run test -- lib/storage.test.ts`
Expected: FAIL (cannot resolve `./storage`).

- [ ] **Step 3: Implement `lib/storage.ts`**

```typescript
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const {
  R2_ACCOUNT_ID = '',
  R2_ACCESS_KEY_ID = '',
  R2_SECRET_ACCESS_KEY = '',
  R2_BUCKET = '',
  R2_PUBLIC_URL = '',
} = process.env

export function r2Configured(): boolean {
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET && R2_PUBLIC_URL)
}

// Lazily created so importing this module never throws when R2 is unconfigured.
let _client: S3Client | null = null
function client(): S3Client {
  if (!r2Configured()) throw new Error('R2 is not configured')
  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      },
    })
  }
  return _client
}

const slugifyFilename = (name: string) => {
  const dot = name.lastIndexOf('.')
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const ext = dot > 0 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, '') : ''
  return `${base || 'file'}${ext}`
}

export function buildObjectKey(folder: string, filename: string): string {
  const id = Math.random().toString(36).slice(2, 8)
  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, '').replace(/^\/+|\/+$/g, '') || 'uploads'
  return `${safeFolder}/${id}_${slugifyFilename(filename)}`
}

export function publicUrl(key: string): string {
  return `${(process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '')}/${key}`
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresSeconds = 300
): Promise<string> {
  const cmd = new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, ContentType: contentType })
  return getSignedUrl(client(), cmd, { expiresIn: expiresSeconds })
}

export async function putObject(
  key: string,
  body: Uint8Array | Buffer | string,
  contentType: string
): Promise<void> {
  await client().send(
    new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: body, ContentType: contentType })
  )
}

export async function deleteObject(key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }))
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npm run test -- lib/storage.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/storage.ts lib/storage.test.ts
git commit -m "feat: add R2 storage layer (signed uploads, delete, public URLs)"
```

---

### Task 3: Media helpers (`lib/media.ts`)

**Files:**
- Create: `lib/media.ts`
- Create: `lib/media.test.ts`

**Interfaces:**
- Consumes: `Media` model, `deleteObject`, `publicUrl` from storage.
- Produces:
  - `type MediaInput = { key: string; type: string; size: number; width?: number; height?: number; alt?: string; filename?: string }`
  - `createMedia(input: MediaInput): Promise<{ id: string; url: string; key: string }>` — sets `url = publicUrl(key)`, saves a Media doc.
  - `listMedia(search?: string): Promise<Array<{ id: string; key: string; url: string; type: string; size: number; alt?: string; filename?: string; createdAt: Date }>>` — newest first; optional case-insensitive filename/alt filter.
  - `deleteMedia(id: string): Promise<boolean>` — deletes the R2 object then the Mongo doc; returns false if not found. R2 delete failures are swallowed (logged) so a missing object never blocks removing the record.

- [ ] **Step 1: Write the failing test `lib/media.test.ts`**

```typescript
import { describe, expect, it, vi } from 'vitest'
import { setupTestDb } from '@/test/setup-db'

// Stub the R2 side effects — these tests exercise the Mongo record logic only.
vi.mock('./storage', () => ({
  publicUrl: (key: string) => `https://pub-x.r2.dev/${key}`,
  deleteObject: vi.fn(async () => {}),
}))

import { createMedia, listMedia, deleteMedia } from './media'
import { Media } from './models/Media'

describe('media helpers', () => {
  setupTestDb()

  it('createMedia stores a record with a public url', async () => {
    const res = await createMedia({ key: 'projects/a.png', type: 'image/png', size: 100, filename: 'a.png' })
    expect(res.url).toBe('https://pub-x.r2.dev/projects/a.png')
    expect(await Media.countDocuments()).toBe(1)
  })

  it('listMedia returns newest first and filters by search', async () => {
    await createMedia({ key: 'k1', type: 'image/png', size: 1, filename: 'alpha.png' })
    await createMedia({ key: 'k2', type: 'image/png', size: 1, filename: 'beta.png' })
    const all = await listMedia()
    expect(all).toHaveLength(2)
    const filtered = await listMedia('alpha')
    expect(filtered.map((m) => m.filename)).toEqual(['alpha.png'])
  })

  it('deleteMedia removes the record and returns true; false when missing', async () => {
    const { id } = await createMedia({ key: 'k3', type: 'image/png', size: 1 })
    expect(await deleteMedia(id)).toBe(true)
    expect(await Media.countDocuments()).toBe(0)
    expect(await deleteMedia('64b7f9f9f9f9f9f9f9f9f9f9')).toBe(false)
  })
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npm run test -- lib/media.test.ts`
Expected: FAIL (cannot resolve `./media`).

- [ ] **Step 3: Implement `lib/media.ts`**

```typescript
import { connectDb } from './db'
import { Media } from './models/Media'
import { deleteObject, publicUrl } from './storage'

export type MediaInput = {
  key: string
  type: string
  size: number
  width?: number
  height?: number
  alt?: string
  filename?: string
}

export async function createMedia(input: MediaInput): Promise<{ id: string; url: string; key: string }> {
  await connectDb()
  const url = publicUrl(input.key)
  const doc = await Media.create({ ...input, url })
  return { id: String(doc._id), url, key: input.key }
}

export async function listMedia(search?: string) {
  await connectDb()
  const filter = search
    ? { $or: [{ filename: new RegExp(search, 'i') }, { alt: new RegExp(search, 'i') }] }
    : {}
  const rows = await Media.find(filter).sort({ createdAt: -1 }).lean()
  return rows.map((m) => ({
    id: String(m._id),
    key: m.key,
    url: m.url,
    type: m.type,
    size: m.size,
    alt: m.alt,
    filename: m.filename,
    createdAt: m.createdAt as Date,
  }))
}

export async function deleteMedia(id: string): Promise<boolean> {
  await connectDb()
  const doc = await Media.findById(id)
  if (!doc) return false
  try {
    await deleteObject(doc.key)
  } catch (err) {
    console.error('R2 delete failed (removing record anyway):', err)
  }
  await doc.deleteOne()
  return true
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npm run test -- lib/media.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/media.ts lib/media.test.ts
git commit -m "feat: add Media helpers (create/list/delete, R2 object cleanup)"
```

---

### Task 4: Live R2 round-trip verification script

**Files:** Create `scripts/verify-r2.ts`.

**Interfaces:** Consumes storage functions. Puts a tiny object, fetches it via the public URL, then deletes it — proving credentials, bucket, and public access all work.

- [ ] **Step 1: Write `scripts/verify-r2.ts`**

```typescript
/**
 * Live R2 round-trip check. Run: npm run verify:r2  (requires R2_* in .env.local)
 * Puts a tiny object, fetches it via the public URL, deletes it.
 */
import { r2Configured, buildObjectKey, putObject, publicUrl, deleteObject } from '../lib/storage'

async function main() {
  if (!r2Configured()) throw new Error('R2 not configured — check .env.local')
  const key = buildObjectKey('_healthcheck', 'ping.txt')
  const body = `naazware r2 ok ${new Date().toISOString()}`
  await putObject(key, body, 'text/plain')
  console.log('PUT ok:', key)

  const url = publicUrl(key)
  const res = await fetch(url)
  const text = await res.text()
  console.log('GET', res.status, url)
  if (res.status !== 200 || text !== body) {
    throw new Error(`Public fetch mismatch (status ${res.status}). Is public access enabled?`)
  }
  console.log('Public URL serves the object ✓')

  await deleteObject(key)
  console.log('DELETE ok — round trip complete.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
```

- [ ] **Step 2: Add script to `package.json`**

Add to `"scripts"`: `"verify:r2": "tsx --env-file=.env.local scripts/verify-r2.ts"`

- [ ] **Step 3: Run the round trip**

Run: `npm run verify:r2`
Expected: `PUT ok` → `GET 200` → `Public URL serves the object ✓` → `DELETE ok`. (Needs network + real R2 keys.)

- [ ] **Step 4: Commit**

```bash
git add package.json scripts/verify-r2.ts
git commit -m "chore: add live R2 round-trip verification script"
```

---

### Task 5: Gate + docs update

- [ ] **Step 1: Full gate**

Run: `npm run test && npm run type-check && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 2: Update `docs/ROADMAP.md`** — mark P2 ☑.

- [ ] **Step 3: Update `docs/HANDOVER.md`** — record: storage + media helpers done, R2 round-trip verified; note the HTTP upload route is deferred to P3 (auth). Next step = Plan 3 (P3 auth + admin shell).

- [ ] **Step 4: Commit**

```bash
git add docs/
git commit -m "docs: mark P2 complete (R2 storage + media helpers verified)"
```

---

## Self-Review

- **Spec coverage:** P2 = R2 storage interface (`lib/storage.ts`, Task 2) + Media uploads plumbing (`lib/media.ts`, Task 3) + signed upload URLs (Task 2) + live verification (Task 4). HTTP upload route intentionally deferred to P3 (auth) — noted in Global Constraints and Task 5. ✓
- **Placeholder scan:** none. ✓
- **Type consistency:** `buildObjectKey`, `publicUrl`, `getSignedUploadUrl`, `deleteObject`, `putObject`, `r2Configured` used consistently between storage, media, and the verify script. `Media` model fields (key/url/type/size/alt/filename/createdAt) match `MediaInput` + `listMedia` mapping. ✓
