# Phase 6 — Journal Management (Tiptap) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the admin full CRUD over journal posts with a Tiptap rich-text body editor, backed by Mongo, and render those posts on the public `/blog` site.

**Architecture:** Same P4/P5 vertical (zod → service → auth-gated API → admin UI), plus a Tiptap editor. The body is edited as **Tiptap JSON** (stored in `Post.content`, the source of truth). At save time the service derives sanitized HTML from that JSON via `@tiptap/html` `generateHTML` using a **shared extension list** (`lib/tiptap-extensions.ts`), and stores it in a new `Post.contentHtml` field. The public blog page renders `contentHtml` directly; seeded/local posts (markdown only) keep rendering via the existing `renderMarkdown` fallback. Because HTML is regenerated from the constrained schema (not trusted from the client), it is safe to inject.

**Tech Stack:** Next.js 14 App Router, TypeScript, Mongoose, zod, Auth.js (`requireAdmin`), Tiptap v2 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`, `@tiptap/html`, `@tiptap/pm`), Vitest + in-memory Mongo (`setupTestDb`), Tailwind.

## Global Constraints

- All work stays on branch `feat/custom-cms`. Never touch `master` during implementation.
- Every admin API route: `requireAdmin` gate first; mutations also `rateLimit(\`${gate.userId}:posts\`, 60, 60000)` → 429 on limit; validate body with the zod schema, `badRequest` on failure.
- Body source of truth is Tiptap JSON in `Post.content`. `Post.contentHtml` is always **derived server-side** from that JSON — never store client-supplied HTML.
- The Tiptap extension list is defined **once** in `lib/tiptap-extensions.ts` and imported by both the client editor and the server serializer, so edit and render never drift.
- Toolbar scope (v1): bold, italic, H2, H3, bullet list, ordered list, link, blockquote, code block, image (via existing `MediaPicker`/R2). No tables/embeds.
- Media references (`coverMedia`, inline images) are 24-char ObjectId hex strings (cover) / R2 URLs (inline images in body).
- Gate must stay GREEN after every task: `npm run test` · `npm run type-check` · `npm run lint`.
- Match existing file style: 2-space indent, no semicolons, single quotes, `@/` path alias.
- Tiptap v2 only (React 18 / Next 14 compatible). Install with the `^2` major.

## File Structure

- Modify `lib/models/Post.ts` — add `contentHtml: { type: String, default: '' }`.
- Create `lib/tiptap-extensions.ts` — shared `tiptapExtensions` array (StarterKit + Link + Image).
- Create `lib/schemas/post.ts` — zod `postInputSchema` + `PostInput` type.
- Create `lib/posts-service.ts` — CRUD + `uniqueSlug` + list + JSON→HTML serialization on write.
- Create `lib/posts-service.test.ts` — service unit tests against in-memory Mongo.
- Create `app/api/admin/posts/route.ts` — GET (list) + POST (create).
- Create `app/api/admin/posts/[id]/route.ts` — GET + PUT + DELETE.
- Create `components/admin/RichTextEditor.tsx` — Tiptap editor + toolbar + image insert via MediaPicker.
- Create `components/admin/PostsTable.tsx` — client list (search / status filter / delete).
- Create `components/admin/PostEditor.tsx` — client create/edit form embedding RichTextEditor.
- Create `app/(admin)/admin/journal/page.tsx`, `.../new/page.tsx`, `.../[id]/page.tsx`.
- Modify `lib/content.ts` — `Post` type gains `contentHtml?: string`; `getPosts` maps it; `postFromLocal` leaves it undefined.
- Modify `app/(site)/blog/[slug]/page.tsx` — render `contentHtml` when present, else `renderMarkdown(content)`.
- Delete `scripts/seed-journal.ts` — stale Sanity seeder (wrong machine path, writes to Sanity which is removed at P9). Untracked; just remove the file.
- No modification needed: `components/admin/Sidebar.tsx` already links `/admin/journal`.

---

### Task 1: Deps + model field + shared extensions + schema + service + tests

**Files:**
- Modify: `lib/models/Post.ts`
- Create: `lib/tiptap-extensions.ts`
- Create: `lib/schemas/post.ts`
- Create: `lib/posts-service.ts`
- Test: `lib/posts-service.test.ts`

**Interfaces:**
- Consumes: `connectDb` from `@/lib/db`; `Post`, `PostDoc` from `@/lib/models/Post`; `setupTestDb` from `@/test/setup-db`; `generateHTML` from `@tiptap/html`; StarterKit/Link/Image extensions.
- Produces:
  - `tiptapExtensions` (array) exported from `lib/tiptap-extensions.ts`.
  - `postInputSchema: z.ZodType` and `type PostInput` (in `lib/schemas/post.ts`).
  - `type AdminPostRow = { id: string; title: string; slug: string; status: string; category: string; publishDate: Date; updatedAt: Date }`.
  - `slugify(s: string): string`, `uniqueSlug(base: string, excludeId?: string): Promise<string>`
  - `renderPostHtml(content: unknown): string` — JSON→HTML via `generateHTML(content, tiptapExtensions)`; returns `''` for empty/invalid input.
  - `createPost(input: PostInput): Promise<{ id: string }>`
  - `getPostById(id: string): Promise<PostDoc | null>`
  - `updatePost(id: string, input: PostInput): Promise<boolean>`
  - `deletePost(id: string): Promise<boolean>`
  - `listPosts(opts?: { search?: string; status?: 'draft' | 'published' }): Promise<AdminPostRow[]>`

- [ ] **Step 1: Install Tiptap dependencies**

Run:
```bash
npm install @tiptap/react@^2 @tiptap/pm@^2 @tiptap/starter-kit@^2 @tiptap/extension-link@^2 @tiptap/extension-image@^2 @tiptap/html@^2
```
Expected: packages added to `package.json` dependencies, no peer-dependency errors (all Tiptap v2, compatible with React 18).

- [ ] **Step 2: Add the `contentHtml` field to the Post model**

In `lib/models/Post.ts`, add the field immediately after the `contentMarkdown` line:

```ts
    contentMarkdown: { type: String, default: '' }, // interim body for reseed/public render
    contentHtml: { type: String, default: '' }, // derived from Tiptap JSON at save (P6)
```

- [ ] **Step 3: Create the shared extension list**

Create `lib/tiptap-extensions.ts`:

```ts
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import type { Extensions } from '@tiptap/core'

// Single source of truth for the editor schema. Imported by both the client
// editor (RichTextEditor) and the server serializer (posts-service), so what
// the admin edits and what the public renders can never drift.
export const tiptapExtensions: Extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
  }),
  Link.configure({ openOnClick: false, autolink: true }),
  Image,
]
```

- [ ] **Step 4: Create the zod schema**

Create `lib/schemas/post.ts`. The body is a Tiptap doc node — validated loosely as an object with `type: 'doc'`:

```ts
import { z } from 'zod'

const tiptapDoc = z
  .object({ type: z.literal('doc') })
  .passthrough()
  .nullable()
  .optional()

export const postInputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(200).optional(),
  excerpt: z.string().min(1).max(600),
  coverMedia: z.string().length(24).nullable().optional(),
  content: tiptapDoc,
  author: z.string().max(200).optional(),
  category: z.string().max(120).optional(),
  tags: z.array(z.string().max(60)).max(30).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
  publishDate: z.string().datetime().optional().or(z.literal('')),
  readTime: z.string().max(40).optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(400).optional(),
  ogImage: z.string().max(500).optional(),
})

export type PostInput = z.infer<typeof postInputSchema>
```

- [ ] **Step 5: Write the failing service tests**

Create `lib/posts-service.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import {
  slugify, uniqueSlug, renderPostHtml, createPost, updatePost,
  getPostById, listPosts, deletePost,
} from './posts-service'

const doc = (text: string) => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
})

const base = { excerpt: 'x', tags: [], status: 'draft' as const }

describe('posts-service', () => {
  setupTestDb()

  it('slugify normalizes', () => {
    expect(slugify('Hello World! 2024')).toBe('hello-world-2024')
  })

  it('renderPostHtml converts Tiptap JSON to HTML', () => {
    const html = renderPostHtml(doc('Hello body'))
    expect(html).toContain('Hello body')
    expect(html).toContain('<p>')
  })

  it('renderPostHtml returns empty string for nullish content', () => {
    expect(renderPostHtml(null)).toBe('')
    expect(renderPostHtml(undefined)).toBe('')
  })

  it('createPost stores generated slug, draft default, and derived HTML', async () => {
    const { id } = await createPost({ ...base, title: 'My Post', content: doc('Body text') })
    const stored = await getPostById(id)
    expect(stored?.slug).toBe('my-post')
    expect(stored?.status).toBe('draft')
    expect(stored?.contentHtml).toContain('Body text')
  })

  it('uniqueSlug avoids collisions', async () => {
    await createPost({ ...base, title: 'Alpha', content: doc('a') })
    expect(await uniqueSlug('alpha')).toBe('alpha-2')
  })

  it('updatePost changes fields, re-derives HTML, re-uniques slug excluding self', async () => {
    const { id } = await createPost({ ...base, title: 'Editable', content: doc('old') })
    const ok = await updatePost(id, { ...base, title: 'Editable', slug: 'editable', status: 'published', content: doc('new body') })
    expect(ok).toBe(true)
    const stored = await getPostById(id)
    expect(stored?.status).toBe('published')
    expect(stored?.slug).toBe('editable')
    expect(stored?.contentHtml).toContain('new body')
  })

  it('updatePost returns false for missing id', async () => {
    const ok = await updatePost('507f1f77bcf86cd799439011', { ...base, title: 'X', content: doc('y') })
    expect(ok).toBe(false)
  })

  it('listPosts filters by status and search', async () => {
    await createPost({ ...base, title: 'Published One', status: 'published', content: doc('a') })
    await createPost({ ...base, title: 'Draft One', status: 'draft', content: doc('b') })
    expect((await listPosts({ status: 'published' })).length).toBe(1)
    const found = await listPosts({ search: 'Draft' })
    expect(found.map((p) => p.title)).toContain('Draft One')
  })

  it('deletePost removes it', async () => {
    const { id } = await createPost({ ...base, title: 'Temp', content: doc('a') })
    expect(await deletePost(id)).toBe(true)
    expect(await getPostById(id)).toBeNull()
  })
})
```

- [ ] **Step 6: Run the tests to verify they fail**

Run: `npm run test -- posts-service`
Expected: FAIL — `Failed to resolve import "./posts-service"`.

- [ ] **Step 7: Write the service**

Create `lib/posts-service.ts`:

```ts
import { generateHTML } from '@tiptap/html'
import { connectDb } from './db'
import { Post, type PostDoc } from './models/Post'
import { tiptapExtensions } from './tiptap-extensions'
import type { PostInput } from './schemas/post'

export type AdminPostRow = {
  id: string
  title: string
  slug: string
  status: string
  category: string
  publishDate: Date
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
  const root = slugify(base) || 'post'
  let candidate = root
  let n = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await Post.findOne({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })
    if (!clash) return candidate
    n += 1
    candidate = `${root}-${n}`
  }
}

export function renderPostHtml(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  try {
    return generateHTML(content as Record<string, unknown>, tiptapExtensions)
  } catch {
    return ''
  }
}

function applyInput(doc: Record<string, unknown>, input: PostInput) {
  doc.title = input.title
  doc.excerpt = input.excerpt
  doc.coverMedia = input.coverMedia || undefined
  doc.content = input.content ?? undefined
  doc.contentHtml = renderPostHtml(input.content)
  doc.author = input.author || 'Naazware'
  doc.category = input.category ?? ''
  doc.tags = input.tags ?? []
  doc.status = input.status ?? 'draft'
  doc.publishDate = input.publishDate ? new Date(input.publishDate) : new Date()
  doc.readTime = input.readTime ?? ''
  doc.seoTitle = input.seoTitle || undefined
  doc.seoDescription = input.seoDescription || undefined
  doc.ogImage = input.ogImage || undefined
}

export async function createPost(input: PostInput): Promise<{ id: string }> {
  await connectDb()
  const slug = await uniqueSlug(input.slug || input.title)
  const doc: Record<string, unknown> = { slug }
  applyInput(doc, input)
  const created = await Post.create(doc)
  return { id: String(created._id) }
}

export async function getPostById(id: string): Promise<PostDoc | null> {
  await connectDb()
  return Post.findById(id).lean<PostDoc>()
}

export async function updatePost(id: string, input: PostInput): Promise<boolean> {
  await connectDb()
  const doc = await Post.findById(id)
  if (!doc) return false
  doc.slug = await uniqueSlug(input.slug || input.title, id)
  const patch: Record<string, unknown> = {}
  applyInput(patch, input)
  doc.set(patch)
  await doc.save()
  return true
}

export async function deletePost(id: string): Promise<boolean> {
  await connectDb()
  const res = await Post.findByIdAndDelete(id)
  return Boolean(res)
}

export async function listPosts(
  opts: { search?: string; status?: 'draft' | 'published' } = {}
): Promise<AdminPostRow[]> {
  await connectDb()
  const filter: Record<string, unknown> = {}
  if (opts.status) filter.status = opts.status
  if (opts.search) {
    const rx = new RegExp(opts.search, 'i')
    filter.$or = [{ title: rx }, { slug: rx }, { category: rx }]
  }
  const rows = await Post.find(filter)
    .sort({ publishDate: -1, updatedAt: -1 })
    .lean<(PostDoc & { _id: unknown; publishDate: Date; updatedAt: Date })[]>()
  return rows.map((p) => ({
    id: String(p._id),
    title: p.title,
    slug: p.slug,
    status: p.status,
    category: p.category ?? '',
    publishDate: p.publishDate,
    updatedAt: p.updatedAt,
  }))
}
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npm run test -- posts-service`
Expected: PASS (10 tests). If `generateHTML` throws about a missing DOM, confirm `@tiptap/html` (not `@tiptap/core`) is the import source — `@tiptap/html` bundles a server DOM (zeed-dom) and needs no jsdom.

- [ ] **Step 9: Verify gate**

Run: `npm run type-check` then `npm run lint`
Expected: both clean.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json lib/models/Post.ts lib/tiptap-extensions.ts lib/schemas/post.ts lib/posts-service.ts lib/posts-service.test.ts
git commit -m "feat: posts service + Tiptap deps, schema, JSON->HTML serialization (P6a)"
```

---

### Task 2: Admin API routes

**Files:**
- Create: `app/api/admin/posts/route.ts`
- Create: `app/api/admin/posts/[id]/route.ts`

**Interfaces:**
- Consumes: `requireAdmin`, `json`, `badRequest`, `errorResponse` from `@/lib/admin-api`; `rateLimit` from `@/lib/rate-limit`; `postInputSchema` from `@/lib/schemas/post`; Task 1 service functions.
- Produces (HTTP contract the UI consumes):
  - `GET /api/admin/posts?search=&status=draft|published` → `{ posts: AdminPostRow[] }`
  - `POST /api/admin/posts` (body = `PostInput`) → `{ id }` 201
  - `GET /api/admin/posts/[id]` → `{ post: PostDoc }` | 404
  - `PUT /api/admin/posts/[id]` (body = `PostInput`) → `{ ok: true }` | 404
  - `DELETE /api/admin/posts/[id]` → `{ ok: true }` | 404

- [ ] **Step 1: Write the list + create route**

Create `app/api/admin/posts/route.ts`:

```ts
import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { postInputSchema } from '@/lib/schemas/post'
import { listPosts, createPost } from '@/lib/posts-service'

export async function GET(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const rows = await listPosts({
    search: searchParams.get('search') || undefined,
    status: status === 'draft' || status === 'published' ? status : undefined,
  })
  return json({ posts: rows })
}

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:posts`, 60, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const parsed = postInputSchema.safeParse(body)
  if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())
  const { id } = await createPost(parsed.data)
  return json({ id }, 201)
}
```

- [ ] **Step 2: Write the id route**

Create `app/api/admin/posts/[id]/route.ts`:

```ts
import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { postInputSchema } from '@/lib/schemas/post'
import { getPostById, updatePost, deletePost } from '@/lib/posts-service'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  const doc = await getPostById(params.id)
  if (!doc) return errorResponse('Not found', 404)
  return json({ post: doc })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:posts`, 60, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const parsed = postInputSchema.safeParse(body)
  if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())
  const ok = await updatePost(params.id, parsed.data)
  if (!ok) return errorResponse('Not found', 404)
  return json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:posts`, 60, 60000)) return errorResponse('Too many requests', 429)
  const ok = await deletePost(params.id)
  if (!ok) return errorResponse('Not found', 404)
  return json({ ok: true })
}
```

- [ ] **Step 3: Verify gate**

Run: `npm run type-check` then `npm run lint`
Expected: both clean.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/posts
git commit -m "feat: journal posts admin API routes (auth-gated, validated, rate-limited)"
```

---

### Task 3: Admin UI — Tiptap editor + table + form + pages

**Files:**
- Create: `components/admin/RichTextEditor.tsx`
- Create: `components/admin/PostsTable.tsx`
- Create: `components/admin/PostEditor.tsx`
- Create: `app/(admin)/admin/journal/page.tsx`
- Create: `app/(admin)/admin/journal/new/page.tsx`
- Create: `app/(admin)/admin/journal/[id]/page.tsx`

**Interfaces:**
- Consumes: `apiGet`, `apiSend` from `@/lib/admin-client`; `Button`, `Field`, `TextInput`, `TextArea`, `Select`, `TagInput` from `@/components/admin/ui`; `ImageField`, `ImageValue` from `@/components/admin/ImageField`; `MediaPicker` from `@/components/admin/MediaPicker`; `useEditor`, `EditorContent` from `@tiptap/react`; `tiptapExtensions` from `@/lib/tiptap-extensions`; `listPosts` + `getPostById` from `@/lib/posts-service`; `getMediaByIds` from `@/lib/media`; Task 2 HTTP contract.
- Produces:
  - `RichTextEditor` default export — props `{ value: JSONContent | null; onChange: (json: JSONContent) => void }` where `JSONContent` is Tiptap's document JSON type (re-exported: `import type { JSONContent } from '@tiptap/react'`).
  - `PostRow = { id; title; slug; status; category; publishDate: string; updatedAt: string }` (exported from `PostsTable.tsx`).
  - `EditorValues` + `emptyValues` + default export `PostEditor` (from `PostEditor.tsx`).

- [ ] **Step 1: Write the Tiptap editor component**

Create `components/admin/RichTextEditor.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useEditor, EditorContent, type JSONContent, type Editor } from '@tiptap/react'
import { tiptapExtensions } from '@/lib/tiptap-extensions'
import MediaPicker from './MediaPicker'

function ToolbarButton({
  active, onClick, children,
}: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 text-sm transition-colors ${
        active ? 'bg-accent/20 text-accent-soft' : 'text-paper-dim hover:bg-ink-700 hover:text-paper'
      }`}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor, onPickImage }: { editor: Editor; onPickImage: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-ink-600 p-2">
      <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></ToolbarButton>
      <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></ToolbarButton>
      <span className="mx-1 h-5 w-px bg-ink-600" />
      <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
      <ToolbarButton active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarButton>
      <span className="mx-1 h-5 w-px bg-ink-600" />
      <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</ToolbarButton>
      <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</ToolbarButton>
      <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>&ldquo; Quote</ToolbarButton>
      <ToolbarButton active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>&lt;/&gt;</ToolbarButton>
      <span className="mx-1 h-5 w-px bg-ink-600" />
      <ToolbarButton active={editor.isActive('link')} onClick={() => {
        const prev = editor.getAttributes('link').href as string | undefined
        const url = window.prompt('Link URL', prev || 'https://')
        if (url === null) return
        if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run()
        else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
      }}>Link</ToolbarButton>
      <ToolbarButton onClick={onPickImage}>Image</ToolbarButton>
    </div>
  )
}

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: JSONContent | null
  onChange: (json: JSONContent) => void
}) {
  const [picking, setPicking] = useState(false)
  const editor = useEditor({
    extensions: tiptapExtensions,
    content: value ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: {
      attributes: {
        class: 'prose-dark min-h-[16rem] max-w-none px-4 py-3 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    immediatelyRender: false,
  })

  if (!editor) return null

  return (
    <div className="overflow-hidden rounded-lg border border-ink-600 bg-ink-900">
      <Toolbar editor={editor} onPickImage={() => setPicking(true)} />
      <EditorContent editor={editor} />
      {picking && (
        <MediaPicker
          folder="journal"
          onClose={() => setPicking(false)}
          onSelect={(m) => {
            editor.chain().focus().setImage({ src: m.url }).run()
            setPicking(false)
          }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write the posts table**

Create `components/admin/PostsTable.tsx`:

```tsx
'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { apiGet, apiSend } from '@/lib/admin-client'
import { TextInput, Select } from './ui'

export type PostRow = {
  id: string
  title: string
  slug: string
  status: string
  category: string
  publishDate: string
  updatedAt: string
}

export default function PostsTable({ initial }: { initial: PostRow[] }) {
  const [rows, setRows] = useState<PostRow[]>(initial)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

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
        const { posts } = await apiGet<{ posts: PostRow[] }>(`/api/admin/posts${query}`)
        setRows(posts)
      } catch {
        /* keep current rows on transient error */
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setBusy(true)
    try {
      await apiSend(`/api/admin/posts/${id}`, 'DELETE')
      setRows((prev) => prev.filter((r) => r.id !== id))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <TextInput
          placeholder="Search posts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[10rem]">
          <option value="">All status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </Select>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-ink-600">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-800/60 text-paper-dim">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-paper-faint">
                  No posts. Write your first one.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-ink-600/60 hover:bg-ink-800/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/journal/${r.id}`} className="font-medium text-paper hover:text-accent-soft">
                    {r.title}
                  </Link>
                  <div className="text-xs text-paper-faint">/{r.slug}</div>
                </td>
                <td className="px-4 py-3 text-paper-dim">{r.category || '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      r.status === 'published' ? 'bg-accent/15 text-accent-soft' : 'bg-ink-700 text-paper-dim'
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-paper-dim">{r.publishDate ? r.publishDate.slice(0, 10) : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/journal/${r.id}`}
                      className="rounded-lg border border-ink-600 px-3 py-1 text-xs text-paper-dim hover:bg-ink-700 hover:text-paper"
                    >
                      Edit
                    </Link>
                    <button
                      disabled={busy}
                      onClick={() => remove(r.id, r.title)}
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
    </div>
  )
}
```

- [ ] **Step 3: Write the post editor form**

Create `components/admin/PostEditor.tsx`:

```tsx
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
```

- [ ] **Step 4: Write the list page**

Create `app/(admin)/admin/journal/page.tsx`:

```tsx
import Link from 'next/link'
import { listPosts } from '@/lib/posts-service'
import PostsTable, { type PostRow } from '@/components/admin/PostsTable'

export const dynamic = 'force-dynamic'

export default async function JournalPage() {
  const rows = await listPosts()
  const initial: PostRow[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    status: r.status,
    category: r.category,
    publishDate: r.publishDate ? new Date(r.publishDate).toISOString() : '',
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : '',
  }))
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-paper">Journal</h1>
          <p className="mt-1 text-sm text-paper-dim">Write and manage blog posts.</p>
        </div>
        <Link
          href="/admin/journal/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-contrast hover:opacity-90"
        >
          New post
        </Link>
      </div>
      <div className="mt-8">
        <PostsTable initial={initial} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write the new page**

Create `app/(admin)/admin/journal/new/page.tsx`:

```tsx
import PostEditor, { emptyValues } from '@/components/admin/PostEditor'

export const dynamic = 'force-dynamic'

export default function NewPostPage() {
  return <PostEditor mode="create" initial={emptyValues} />
}
```

- [ ] **Step 6: Write the edit page**

Create `app/(admin)/admin/journal/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import type { JSONContent } from '@tiptap/react'
import { getPostById } from '@/lib/posts-service'
import { getMediaByIds } from '@/lib/media'
import PostEditor, { emptyValues, type EditorValues } from '@/components/admin/PostEditor'

export const dynamic = 'force-dynamic'

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const doc = await getPostById(params.id)
  if (!doc) notFound()

  const coverId = doc.coverMedia ? String(doc.coverMedia) : ''
  const resolved = coverId ? await getMediaByIds([coverId]) : []
  const coverUrl = resolved[0]?.url

  const initial: EditorValues = {
    ...emptyValues,
    title: doc.title ?? '',
    slug: doc.slug ?? '',
    excerpt: doc.excerpt ?? '',
    cover: coverId && coverUrl ? { id: coverId, url: coverUrl } : null,
    content: (doc.content as JSONContent | undefined) ?? null,
    author: doc.author ?? '',
    category: doc.category ?? '',
    tags: doc.tags ?? [],
    status: (doc.status as 'draft' | 'published') ?? 'draft',
    publishDate: doc.publishDate ? new Date(doc.publishDate).toISOString().slice(0, 10) : '',
    readTime: doc.readTime ?? '',
    seoTitle: doc.seoTitle ?? '',
    seoDescription: doc.seoDescription ?? '',
    ogImage: doc.ogImage ? { id: '', url: doc.ogImage } : null,
  }

  return <PostEditor mode="edit" id={params.id} initial={initial} />
}
```

- [ ] **Step 7: Verify gate**

Run: `npm run type-check` then `npm run lint`
Expected: both clean. If `useEditor` triggers an SSR hydration lint/type issue, confirm `immediatelyRender: false` is set (already in the code) — that is the Next.js App Router requirement for Tiptap v2.

- [ ] **Step 8: Commit**

```bash
git add "app/(admin)/admin/journal" components/admin/RichTextEditor.tsx components/admin/PostsTable.tsx components/admin/PostEditor.tsx
git commit -m "feat: journal admin UI with Tiptap editor (list, editor, image insert)"
```

---

### Task 4: Public render + live verification + docs

**Files:**
- Modify: `lib/content.ts`
- Modify: `app/(site)/blog/[slug]/page.tsx`
- Delete: `scripts/seed-journal.ts`
- Modify: `docs/HANDOVER.md`, `docs/ROADMAP.md`

**Interfaces:**
- Consumes: `getPosts` Mongo rows now include `contentHtml`.
- Produces: public `Post` type gains `contentHtml?: string`.

- [ ] **Step 1: Add `contentHtml` to the public Post type + mapping**

In `lib/content.ts`:

Add the field to the `Post` type (after the existing `content?` line):

```ts
  content?: string // markdown body (interim, until Tiptap on public side)
  contentHtml?: string // Tiptap-derived HTML (Mongo posts, P6+)
```

In `getPosts`, add `contentHtml` to the Mongo mapping (alongside `content: p.contentMarkdown ?? ''`):

```ts
    content: p.contentMarkdown ?? '',
    contentHtml: p.contentHtml || undefined,
```

`postFromLocal` needs no change — local posts have no `contentHtml`, so it stays `undefined` and the markdown fallback renders.

- [ ] **Step 2: Render `contentHtml` on the public post page**

In `app/(site)/blog/[slug]/page.tsx`, replace the body render line:

```tsx
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content ?? '') }} />
```

with:

```tsx
            <div dangerouslySetInnerHTML={{ __html: post.contentHtml || renderMarkdown(post.content ?? '') }} />
```

Leave `renderMarkdown` in place — it is still the fallback for seeded/local markdown posts.

- [ ] **Step 3: Remove the stale Sanity seeder**

Run: `rm scripts/seed-journal.ts`
(It is untracked and targets Sanity with a dead machine-specific path — superseded by the Mongo-backed admin editor. Nothing imports it.)

- [ ] **Step 4: Full gate**

Run: `npm run test` then `npm run type-check` then `npm run lint`
Expected: all tests pass (49 total: prior 39 + 10 new), type-check + lint clean.

- [ ] **Step 5: Live HTTP smoke test**

Start the dev server (`npm run dev`) with the DIRECT (non-SRV) `MONGODB_URI` from `.env.local` (see HANDOVER env note). Log in at `/admin/login` (kaifkazi40@gmail.com / `Naazware@2026`) to get a session cookie, then verify with that cookie:
- `GET /api/admin/posts` → 200 `{ posts: [...] }`
- unauthenticated `GET /api/admin/posts` → 401
- `POST /api/admin/posts` with a real Tiptap doc body, e.g.
  `{ "title": "Hello Tiptap", "excerpt": "First rich post", "status": "published", "content": { "type": "doc", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Bold body here." }] }] } }`
  → 201 `{ id }`
- `GET /api/admin/posts/[id]` → 200; confirm the stored doc has non-empty `contentHtml` containing `Bold body here.`
- visit public `/blog/hello-tiptap` → the paragraph renders as HTML (not raw markdown)
- `PUT` to change the body → `contentHtml` updates
- `DELETE /api/admin/posts/[id]` → 200; gone from list and public

Record exact results (status codes + observed effects).

- [ ] **Step 6: Update docs**

In `docs/ROADMAP.md`: change `☐ P6 Journal management (Tiptap)` to `☑ P6 Journal management (Tiptap) — VERIFIED LIVE`, and add this plan filename under "Plans written". In `docs/HANDOVER.md`: update RESUME "Next task" to **P7 Inbox + contact route rewired to Mongo**, bump "Current phase"/"Last updated"/gate count (49), and record P6 under "Done + verified" with live-test results. Remove the `scripts/seed-journal.ts` note (file deleted).

- [ ] **Step 7: Commit**

```bash
git add lib/content.ts "app/(site)/blog/[slug]/page.tsx" docs/HANDOVER.md docs/ROADMAP.md docs/superpowers/plans/2026-09-19-phase-6-journal-tiptap.md
git rm scripts/seed-journal.ts 2>/dev/null || true
git commit -m "feat: render Tiptap HTML on public blog; P6 complete + verified; next P7"
```

---

## Self-Review

- **Spec coverage:** Handover P6 asks for service + zod + auth-gated API + admin UI with a Tiptap rich-text body editor. Covered: service with JSON→HTML serialization (Task 1), API CRUD (Task 2), admin UI with Tiptap editor + toolbar + image insert (Task 3), public render swap (Task 4). Post model already had `content` (JSON) — this plan adds the derived `contentHtml`.
- **Placeholder scan:** none — all code blocks complete.
- **Type consistency:** `PostInput`, `AdminPostRow`, `PostRow`, `EditorValues`, `JSONContent`, `ImageValue` used consistently across tasks. HTTP contract keys (`posts`, `post`, `id`, `ok`) match between routes (Task 2) and UI (Task 3). Service function names (`createPost`/`updatePost`/`getPostById`/`listPosts`/`deletePost`/`renderPostHtml`/`slugify`/`uniqueSlug`) identical in interfaces, tests, service, routes, and pages. `tiptapExtensions` is the single shared schema for editor (Task 3) and serializer (Task 1).
- **Design decisions (from brainstorm):** body stored as Tiptap JSON (source of truth) + server-derived `contentHtml` (safe: regenerated from constrained schema, never trust client HTML); core toolbar only (StarterKit heading levels 2–3 + Link + Image); inline images via existing MediaPicker/R2. Public keeps markdown fallback for seeded/local posts.
- **Risk note:** `@tiptap/html` `generateHTML` must run in the vitest `node` env and in the Node route handler — `@tiptap/html` bundles a server DOM (zeed-dom) so no jsdom is needed. Step 8 of Task 1 calls this out. If a future Tiptap major drops zeed-dom, switch to sending `editor.getHTML()` from the client plus server-side sanitize.
