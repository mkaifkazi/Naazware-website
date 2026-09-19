# Phase 8 — Site Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the admin edit site-wide settings (contact email/phone, location, tagline, description, social links) stored as a single Mongo document, and reflect them on the server-rendered public surfaces.

**Architecture:** A Mongo `Settings` singleton (one document). `getSettings()` returns a full site-config object = the static `lib/site.ts` defaults with the stored editable fields layered on top (a stored field wins only when non-empty). Admin edits via an auth-gated form. Server consumers that show editable fields — `Footer`, the contact/privacy/terms pages, and the root layout's Organization/WebSite JSON-LD — call `await getSettings()` instead of importing the static `site`. Client components (`Header`, `ContactForm`) and structural-only consumers (`sitemap.ts`, `robots.ts`, `seo.ts` metadata) keep the static `site` for now (documented scope boundary).

**Tech Stack:** Next.js 14 App Router, TypeScript, Mongoose, zod, Auth.js (`requireAdmin`), Vitest + in-memory Mongo (`setupTestDb`), Tailwind.

## Global Constraints

- All work stays on branch `feat/custom-cms`. Never touch `master` during implementation.
- Admin API mutations: `requireAdmin` gate first; also `rateLimit(\`${gate.userId}:settings\`, 60, 60000)` → 429; validate body, `badRequest` on failure.
- `Settings` is a singleton: exactly one document, upserted with an empty filter `{}`.
- `getSettings()` merges over `lib/site.ts` — a stored field applies only when it is a non-empty trimmed string; structural fields (`name`, `legalName`, `url`, `nav`) always come from `site`.
- `phoneHref` is derived, never stored: `tel:` + phone with non-`[0-9+]` stripped.
- Scope boundary (documented, intentional): client `Header`/`ContactForm` and `sitemap.ts`/`robots.ts`/`seo.ts` page-metadata keep static `site`. Only server consumers of editable fields are rewired (Footer, contact/privacy/terms pages, layout JSON-LD).
- Gate must stay GREEN after every task: `npm run test` · `npm run type-check` · `npm run lint`.
- Match existing file style: 2-space indent, no semicolons, single quotes, `@/` path alias.

## File Structure

- Create `lib/models/Settings.ts` — mongoose singleton model + `SettingsDoc` type.
- Create `lib/schemas/settings.ts` — zod `settingsInputSchema` + `SettingsInput` type.
- Create `lib/settings-service.ts` — `getSettingsDoc`, `updateSettings`, `getSettings` (merged), `SiteSettings` type.
- Create `lib/settings-service.test.ts` — service unit tests.
- Create `app/api/admin/settings/route.ts` — GET (current editable values) + PUT (save).
- Create `components/admin/SettingsForm.tsx` — client edit form.
- Create `app/(admin)/admin/settings/page.tsx` — server page loading current values.
- Modify `components/Footer.tsx` — `await getSettings()` for socials/email/phone/location.
- Modify `app/(site)/contact/page.tsx` — `await getSettings()` for email/phone.
- Modify `app/(site)/privacy/page.tsx` — `await getSettings()` for email.
- Modify `app/(site)/terms/page.tsx` — `await getSettings()` for email.
- Modify `lib/seo.ts` — `generateOrganizationSchema` + `generateWebSiteSchema` accept an optional `settings` arg (default = static `site`).
- Modify `app/layout.tsx` — make `RootLayout` async; `await getSettings()`; pass to the two schema generators.
- Modify `docs/HANDOVER.md`, `docs/ROADMAP.md`.
- No modification needed: `Sidebar.tsx` already links `/admin/settings`.

---

### Task 1: Settings model + schema + service + tests

**Files:**
- Create: `lib/models/Settings.ts`
- Create: `lib/schemas/settings.ts`
- Create: `lib/settings-service.ts`
- Test: `lib/settings-service.test.ts`

**Interfaces:**
- Consumes: `connectDb` from `@/lib/db`; `site` from `@/lib/site`; `setupTestDb` from `@/test/setup-db`.
- Produces:
  - `Settings`, `SettingsDoc` (from `lib/models/Settings.ts`).
  - `settingsInputSchema`, `type SettingsInput` (from `lib/schemas/settings.ts`).
  - `type SiteSettings` = the merged config shape (same keys as `site`: `name`, `legalName`, `tagline`, `description`, `url`, `email`, `phone`, `phoneHref`, `location`, `socials: { linkedin; twitter; github }`).
  - `getSettingsDoc(): Promise<SettingsDoc | null>`
  - `updateSettings(input: SettingsInput): Promise<void>`
  - `getSettings(): Promise<SiteSettings>`

- [ ] **Step 1: Create the model**

Create `lib/models/Settings.ts`:

```ts
import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

// Singleton: exactly one document holds the editable site settings.
const settingsSchema = new Schema(
  {
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    github: { type: String, default: '' },
  },
  { timestamps: true }
)

export type SettingsDoc = InferSchemaType<typeof settingsSchema>
export const Settings: Model<SettingsDoc> =
  (models.Settings as Model<SettingsDoc>) ?? model<SettingsDoc>('Settings', settingsSchema)
```

- [ ] **Step 2: Create the zod schema**

Create `lib/schemas/settings.ts`:

```ts
import { z } from 'zod'

const optionalUrl = z.string().url().max(500).optional().or(z.literal(''))

export const settingsInputSchema = z.object({
  tagline: z.string().max(200).optional().or(z.literal('')),
  description: z.string().max(1000).optional().or(z.literal('')),
  email: z.string().email().max(320).optional().or(z.literal('')),
  phone: z.string().max(60).optional().or(z.literal('')),
  location: z.string().max(200).optional().or(z.literal('')),
  linkedin: optionalUrl,
  twitter: optionalUrl,
  github: optionalUrl,
})

export type SettingsInput = z.infer<typeof settingsInputSchema>
```

- [ ] **Step 3: Write the failing service tests**

Create `lib/settings-service.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import { site } from './site'
import { getSettings, updateSettings, getSettingsDoc } from './settings-service'

describe('settings-service', () => {
  setupTestDb()

  it('getSettings returns site defaults when nothing stored', async () => {
    const s = await getSettings()
    expect(s.email).toBe(site.email)
    expect(s.socials.linkedin).toBe(site.socials.linkedin)
    expect(s.name).toBe(site.name) // structural default
  })

  it('updateSettings persists and getSettings layers it over defaults', async () => {
    await updateSettings({ email: 'new@naazware.com', linkedin: 'https://linkedin.com/company/naaz' })
    const s = await getSettings()
    expect(s.email).toBe('new@naazware.com')
    expect(s.socials.linkedin).toBe('https://linkedin.com/company/naaz')
    expect(s.phone).toBe(site.phone) // untouched field still default
  })

  it('updateSettings is a singleton upsert (one doc, empty strings fall back)', async () => {
    await updateSettings({ email: 'a@b.com' })
    await updateSettings({ email: '' }) // cleared → falls back to default
    const s = await getSettings()
    expect(s.email).toBe(site.email)
    expect(await getSettingsDoc()).not.toBeNull()
  })

  it('derives phoneHref from an overridden phone', async () => {
    await updateSettings({ phone: '+91 90000 11111' })
    const s = await getSettings()
    expect(s.phoneHref).toBe('tel:+919000011111')
  })
})
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm run test -- settings-service`
Expected: FAIL — `Failed to resolve import "./settings-service"`.

- [ ] **Step 5: Write the service**

Create `lib/settings-service.ts`:

```ts
import { connectDb } from './db'
import { Settings, type SettingsDoc } from './models/Settings'
import { site } from './site'
import type { SettingsInput } from './schemas/settings'

export type SiteSettings = {
  name: string
  legalName: string
  tagline: string
  description: string
  url: string
  email: string
  phone: string
  phoneHref: string
  location: string
  socials: { linkedin: string; twitter: string; github: string }
}

export async function getSettingsDoc(): Promise<SettingsDoc | null> {
  await connectDb()
  return Settings.findOne().lean<SettingsDoc>()
}

export async function updateSettings(input: SettingsInput): Promise<void> {
  await connectDb()
  await Settings.findOneAndUpdate({}, { $set: input }, { upsert: true })
}

const pick = (v: string | undefined | null, fallback: string): string =>
  v && v.trim() ? v : fallback

export async function getSettings(): Promise<SiteSettings> {
  const d = await getSettingsDoc()
  const phone = pick(d?.phone, site.phone)
  const phoneHref = phone === site.phone ? site.phoneHref : `tel:${phone.replace(/[^0-9+]/g, '')}`
  return {
    name: site.name,
    legalName: site.legalName,
    tagline: pick(d?.tagline, site.tagline),
    description: pick(d?.description, site.description),
    url: site.url,
    email: pick(d?.email, site.email),
    phone,
    phoneHref,
    location: pick(d?.location, site.location),
    socials: {
      linkedin: pick(d?.linkedin, site.socials.linkedin),
      twitter: pick(d?.twitter, site.socials.twitter),
      github: pick(d?.github, site.socials.github),
    },
  }
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test -- settings-service`
Expected: PASS (4 tests).

- [ ] **Step 7: Verify gate**

Run: `npm run type-check` then `npm run lint`
Expected: both clean.

- [ ] **Step 8: Commit**

```bash
git add lib/models/Settings.ts lib/schemas/settings.ts lib/settings-service.ts lib/settings-service.test.ts
git commit -m "feat: Settings singleton model + service (merge over site.ts defaults) (P8a)"
```

---

### Task 2: Admin settings API route

**Files:**
- Create: `app/api/admin/settings/route.ts`

**Interfaces:**
- Consumes: `requireAdmin`, `json`, `badRequest`, `errorResponse` from `@/lib/admin-api`; `rateLimit` from `@/lib/rate-limit`; `settingsInputSchema` from `@/lib/schemas/settings`; `getSettings`, `updateSettings` from `@/lib/settings-service`.
- Produces:
  - `GET /api/admin/settings` → `{ settings: { tagline; description; email; phone; location; linkedin; twitter; github } }` (current effective values, so the form pre-fills with defaults when nothing is stored).
  - `PUT /api/admin/settings` (body = `SettingsInput`) → `{ ok: true }`.

- [ ] **Step 1: Write the route**

Create `app/api/admin/settings/route.ts`:

```ts
import { requireAdmin, json, badRequest, errorResponse } from '@/lib/admin-api'
import { rateLimit } from '@/lib/rate-limit'
import { settingsInputSchema } from '@/lib/schemas/settings'
import { getSettings, updateSettings } from '@/lib/settings-service'

export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  const s = await getSettings()
  return json({
    settings: {
      tagline: s.tagline,
      description: s.description,
      email: s.email,
      phone: s.phone,
      location: s.location,
      linkedin: s.socials.linkedin,
      twitter: s.socials.twitter,
      github: s.socials.github,
    },
  })
}

export async function PUT(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return gate.response
  if (!rateLimit(`${gate.userId}:settings`, 60, 60000)) return errorResponse('Too many requests', 429)
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON')
  }
  const parsed = settingsInputSchema.safeParse(body)
  if (!parsed.success) return badRequest('Validation failed', parsed.error.flatten())
  await updateSettings(parsed.data)
  return json({ ok: true })
}
```

- [ ] **Step 2: Verify gate**

Run: `npm run type-check` then `npm run lint`
Expected: both clean.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/settings/route.ts
git commit -m "feat: admin settings API route (get effective, put with validation)"
```

---

### Task 3: Admin settings UI

**Files:**
- Create: `components/admin/SettingsForm.tsx`
- Create: `app/(admin)/admin/settings/page.tsx`

**Interfaces:**
- Consumes: `apiSend` from `@/lib/admin-client`; `Button`, `Field`, `TextInput`, `TextArea` from `@/components/admin/ui`; `getSettings` from `@/lib/settings-service`.
- Produces:
  - `SettingsValues = { tagline; description; email; phone; location; linkedin; twitter; github }` (exported from `SettingsForm.tsx`).
  - default export `SettingsForm`.

- [ ] **Step 1: Write the form component**

Create `components/admin/SettingsForm.tsx`:

```tsx
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
```

- [ ] **Step 2: Write the settings page**

Create `app/(admin)/admin/settings/page.tsx`:

```tsx
import { getSettings } from '@/lib/settings-service'
import SettingsForm, { type SettingsValues } from '@/components/admin/SettingsForm'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const s = await getSettings()
  const initial: SettingsValues = {
    tagline: s.tagline,
    description: s.description,
    email: s.email,
    phone: s.phone,
    location: s.location,
    linkedin: s.socials.linkedin,
    twitter: s.socials.twitter,
    github: s.socials.github,
  }
  return <SettingsForm initial={initial} />
}
```

- [ ] **Step 3: Verify gate**

Run: `npm run type-check` then `npm run lint`
Expected: both clean.

- [ ] **Step 4: Commit**

```bash
git add "app/(admin)/admin/settings" components/admin/SettingsForm.tsx
git commit -m "feat: admin settings UI (brand, contact, social links form)"
```

---

### Task 4: Wire public server consumers

**Files:**
- Modify: `lib/seo.ts`
- Modify: `app/layout.tsx`
- Modify: `components/Footer.tsx`
- Modify: `app/(site)/contact/page.tsx`
- Modify: `app/(site)/privacy/page.tsx`
- Modify: `app/(site)/terms/page.tsx`

**Interfaces:**
- Consumes: `getSettings` + `SiteSettings` from `@/lib/settings-service`.
- Produces: `generateOrganizationSchema(settings?: SiteSettings)` and `generateWebSiteSchema(settings?: SiteSettings)` — optional arg, default = static `site`.

- [ ] **Step 1: Make the JSON-LD schema generators accept settings**

In `lib/seo.ts`, add the import near the top (after `import { site } from './site'`):

```ts
import type { SiteSettings } from './settings-service'
```

Change the `generateOrganizationSchema` signature and the editable-field references. Replace the function header line:

```ts
export function generateOrganizationSchema() {
```

with:

```ts
export function generateOrganizationSchema(settings: Pick<SiteSettings, 'legalName' | 'tagline' | 'description' | 'email' | 'phone' | 'socials'> = site) {
```

Then inside that function replace these six references:
- `legalName: site.legalName,` → `legalName: settings.legalName,`
- `description: SITE_DESCRIPTION,` → `description: settings.description,`
- `slogan: site.tagline,` → `slogan: settings.tagline,`
- `email: site.email,` (both occurrences — the top-level and the `contactPoint`) → `email: settings.email,`
- `telephone: site.phone,` (both occurrences) → `telephone: settings.phone,`
- `sameAs: [site.socials.linkedin, site.socials.twitter, site.socials.github],` → `sameAs: [settings.socials.linkedin, settings.socials.twitter, settings.socials.github],`

Change the `generateWebSiteSchema` signature line:

```ts
export function generateWebSiteSchema() {
```

with:

```ts
export function generateWebSiteSchema(settings: Pick<SiteSettings, 'description'> = site) {
```

and replace `description: SITE_DESCRIPTION,` inside it with `description: settings.description,`.

(`SITE_URL` / `SITE_NAME` stay as-is — they are structural and unchanged. The default param `= site` keeps every existing sync caller working; `site` structurally satisfies the `Pick<SiteSettings, …>` param because it has all those keys.)

- [ ] **Step 2: Feed settings into the root layout JSON-LD**

In `app/layout.tsx`:

Add the import (after the `import { site } from '@/lib/site'` line):

```ts
import { getSettings } from '@/lib/settings-service'
```

Make the component async and await settings — replace:

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const organizationSchema = generateOrganizationSchema()
  const webSiteSchema = generateWebSiteSchema()
```

with:

```tsx
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSettings()
  const organizationSchema = generateOrganizationSchema(settings)
  const webSiteSchema = generateWebSiteSchema(settings)
```

(The static `export const metadata` block is unchanged — page `<title>`/meta description stay on `site` defaults, per the scope boundary.)

- [ ] **Step 3: Wire the Footer**

In `components/Footer.tsx`:

Replace the import line `import { nav, site } from '@/lib/site'` with:

```ts
import { nav } from '@/lib/site'
import { getSettings } from '@/lib/settings-service'
```

Make the component async and load settings — replace:

```tsx
export default function Footer() {
  const year = new Date().getFullYear()
```

with:

```tsx
export default async function Footer() {
  const year = new Date().getFullYear()
  const settings = await getSettings()
```

Then replace every `site.` reference in the JSX with `settings.`:
- `site.socials.linkedin` → `settings.socials.linkedin`
- `site.socials.twitter` → `settings.socials.twitter`
- `site.socials.github` → `settings.socials.github`
- ``mailto:${site.email}`` → ``mailto:${settings.email}``
- `{site.email}` → `{settings.email}`
- `site.phoneHref` → `settings.phoneHref`
- `{site.phone}` → `{settings.phone}`
- `{site.location}` → `{settings.location}`

(`Footer` is a server component with no `'use client'`, so `await` is allowed. Confirm no parent renders it inside a client boundary — it is used in server layouts.)

- [ ] **Step 4: Wire the contact page**

In `app/(site)/contact/page.tsx`:

Replace `import { site } from '@/lib/site'` with:

```ts
import { getSettings } from '@/lib/settings-service'
```

Make the page async and load settings — replace:

```tsx
export default function ContactPage() {
  return (
```

with:

```tsx
export default async function ContactPage() {
  const settings = await getSettings()
  return (
```

Then replace the four editable references in the JSX:
- both ``mailto:${site.email}`` → ``mailto:${settings.email}``
- both `{site.email}` → `{settings.email}`
- `site.phoneHref` → `settings.phoneHref`
- `{site.phone}` → `{settings.phone}`

(The `export const metadata` block stays on `site` defaults — unchanged.)

- [ ] **Step 5: Wire the privacy page**

In `app/(site)/privacy/page.tsx`:

Replace `import { site } from '@/lib/site'` with `import { getSettings } from '@/lib/settings-service'`. Make the default-exported page component `async` and add `const settings = await getSettings()` at the top of its body (before `return`). Replace both `mailto:${site.email}` / `{site.email}` occurrences (lines ~52 and ~58) with the `settings.email` equivalents. Leave any `export const metadata` untouched.

- [ ] **Step 6: Wire the terms page**

In `app/(site)/terms/page.tsx`:

Same change as privacy: swap the import to `getSettings`, make the page `async`, add `const settings = await getSettings()`, and replace the single `mailto:${site.email}` / `{site.email}` occurrence (line ~62) with the `settings.email` equivalents. Leave any `export const metadata` untouched.

- [ ] **Step 7: Verify gate**

Run: `npm run type-check` then `npm run lint`
Expected: both clean. If lint flags an unused `site` import in any wired file, remove that import.

- [ ] **Step 8: Commit**

```bash
git add lib/seo.ts app/layout.tsx components/Footer.tsx "app/(site)/contact/page.tsx" "app/(site)/privacy/page.tsx" "app/(site)/terms/page.tsx"
git commit -m "feat: reflect editable settings on server surfaces (footer, contact/legal pages, JSON-LD)"
```

---

### Task 5: Live verification + docs

**Files:**
- Modify: `docs/HANDOVER.md`, `docs/ROADMAP.md`

- [ ] **Step 1: Full gate**

Run: `npm run test` then `npm run type-check` then `npm run lint`
Expected: all tests pass (60 total: prior 56 + 4 new), type-check + lint clean.

- [ ] **Step 2: Live HTTP smoke test**

Start the dev server (`npm run dev`) with the DIRECT (non-SRV) `MONGODB_URI` from `.env.local` (see HANDOVER env note). Log in at `/admin/login` (kaifkazi40@gmail.com / `Naazware@2026`) for a session cookie, then verify with that cookie:
- `GET /api/admin/settings` → 200, returns effective values (defaults from `site.ts` on a fresh DB, e.g. `email: hello@naazware.com`)
- unauthenticated `GET /api/admin/settings` → 401
- `PUT /api/admin/settings` with `{ "email": "studio@naazware.com", "location": "Vadodara, India", "linkedin": "https://linkedin.com/company/naazware" }` → 200 `{ ok: true }`
- `GET /api/admin/settings` again → shows the new email/location/linkedin
- Public reflection: `GET /` (or `/contact`) and confirm the footer/contact now render `studio@naazware.com`; confirm the homepage Organization JSON-LD (`<script type="application/ld+json">`) contains `studio@naazware.com` and the new LinkedIn URL
- Invalid: `PUT` with `{ "email": "not-an-email" }` → 400
- Reset: `PUT` with `{ "email": "" }` → 200; `GET` shows the default `hello@naazware.com` again

Record exact results (status codes + observed effects).

- [ ] **Step 3: Update docs**

In `docs/ROADMAP.md`: change `☐ P8 Settings` to `☑ P8 Settings — VERIFIED LIVE`, and add this plan filename under "Plans written". In `docs/HANDOVER.md`: update RESUME "Next task" to **P9 Sanity removal (gated: only after P1–P7 verified)**, bump "Current phase"/"Last updated"/gate count (60), and record P8 under "Done + verified" with live-test results + the scope boundary (client Header/ContactForm + page metadata still on static `site.ts`).

- [ ] **Step 4: Commit**

```bash
git add docs/HANDOVER.md docs/ROADMAP.md docs/superpowers/plans/2026-09-19-phase-8-settings.md
git commit -m "docs: P8 settings complete + verified; next P9 Sanity removal"
```

---

## Self-Review

- **Spec coverage:** Handover P8 = "site-wide settings (contact email, social links, SEO defaults) as a single Mongo settings doc — service + zod + auth-gated API + admin form." Covered: singleton model + service + zod (Task 1), auth-gated API (Task 2), admin form (Task 3), plus real public reflection on server surfaces (Task 4), verify + docs (Task 5).
- **Placeholder scan:** none — all code blocks complete; the swap-lists in Task 4 enumerate every exact reference to change.
- **Type consistency:** `SettingsInput`, `SiteSettings`, `SettingsValues`, `SettingsDoc` consistent across tasks. HTTP contract keys (`settings`, `ok`) match between route (Task 2) and UI/tests. `getSettings`/`updateSettings`/`getSettingsDoc` identical across service, tests, routes, pages, and wired consumers. `generateOrganizationSchema`/`generateWebSiteSchema` gain an optional `settings` param whose default `site` structurally satisfies the `Pick<SiteSettings, …>` type.
- **Design decisions (from brainstorm):** Mongo singleton merged over `site.ts` defaults (stored field wins only when non-empty); `phoneHref` derived not stored; scope boundary = only server consumers of editable fields are rewired (Footer, contact/privacy/terms pages, layout JSON-LD). Client `Header`/`ContactForm` and structural-only `sitemap.ts`/`robots.ts`/`seo.ts` page-metadata stay on static `site` — a deliberate boundary to avoid an async cascade through the client tree and the per-page metadata layer.
- **Risk note:** `Footer`, contact/privacy/terms pages, and `RootLayout` become `async` server components — each is already server-rendered (no `'use client'`), so this is safe. If any is unexpectedly imported inside a client component, the type-check in Task 4 Step 7 will surface it; the fix is to keep that consumer on static `site`. A `getSettings()` DB read is added to these server renders — cheap, and pages are `dynamic`/ISR already.
