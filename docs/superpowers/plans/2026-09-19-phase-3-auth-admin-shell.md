# Naazware CMS — Plan 3: Auth + Admin Shell (Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Protect the CMS with single-admin authentication and stand up the admin shell — login page, guarded `/admin` layout with sidebar, and a dashboard skeleton showing live counts.

**Architecture:** Auth.js (next-auth v5) with a Credentials provider and **JWT session strategy** (no DB adapter needed for a single credentials login — leaner than the adapter path; the `authorize` callback verifies the password against the `Admin` Mongoose model using argon2). `middleware.ts` guards every `/admin` route except `/admin/login`. The admin UI lives in a new `app/(admin)` route group with its own layout and brand-consistent glass styling. A `create-admin` script bootstraps the first account from env vars so no password is ever typed into chat or committed.

**Tech Stack:** next-auth@5 (beta), @node-rs/argon2, Next.js App Router, Tailwind, Mongoose.

## Global Constraints

- Node `>=18`, TypeScript `strict`, `@/*` alias.
- Secrets server-only. New env: `AUTH_SECRET` (required), `ADMIN_EMAIL` + `ADMIN_PASSWORD` (bootstrap only, used once by the script).
- Passwords stored as argon2 hashes only — never plaintext, never returned to the client.
- Session strategy = JWT (refinement of ADR 0002, which named a Mongo adapter; the adapter is unnecessary for a single credentials user — record this in the ADR).
- Admin routes: everything under `/admin/**` requires a session EXCEPT `/admin/login`.
- Reuse existing Vitest infra.
- Do not remove Sanity (`/studio` stays until P9).
- Brand tokens from `styles/globals.css` / `tailwind.config.ts` (ink/paper/accent) — admin must feel like the same brand.

---

### Task 1: Install auth deps + generate AUTH_SECRET

**Files:** Modify `package.json`; update `.env.local` (not committed) + `docs/ENV.md`.

- [ ] **Step 1: Install**

```bash
npm install next-auth@beta @node-rs/argon2
```
Expected: `next-auth` (5.x) + `@node-rs/argon2` in dependencies.

- [ ] **Step 2: Generate AUTH_SECRET and add env**

Generate a secret and append to `.env.local`:
```bash
node -e "console.log('AUTH_SECRET='+require('crypto').randomBytes(32).toString('base64'))" >> .env.local
```
Then add (values set by the operator; ADMIN_PASSWORD is used once then can be removed):
```
ADMIN_EMAIL=kaifkazi40@gmail.com
ADMIN_PASSWORD=<chosen-strong-password>
```

- [ ] **Step 3: Document names in `docs/ENV.md`** — add `AUTH_SECRET` (required, session signing), `ADMIN_EMAIL` / `ADMIN_PASSWORD` (bootstrap only).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json docs/ENV.md
git commit -m "chore: add next-auth v5 + argon2; document auth env vars"
```

---

### Task 2: Admin model + password helpers

**Files:**
- Create: `lib/models/Admin.ts`
- Create: `lib/auth-password.ts`
- Create: `lib/models/Admin.test.ts`
- Create: `lib/auth-password.test.ts`

**Interfaces:**
- Produces:
  - `Admin` model + `AdminDoc`: `email` (req, unique, lowercased), `passwordHash` (req), `name` (default ''), `role` (enum `['admin']`, default `admin`, extensible), `resetToken?`, `resetTokenExpiry?: Date`, timestamps.
  - `hashPassword(plain: string): Promise<string>` and `verifyPassword(hash: string, plain: string): Promise<boolean>` (argon2).

- [ ] **Step 1: Write failing test `lib/auth-password.test.ts`**

```typescript
import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './auth-password'

describe('password hashing', () => {
  it('hashes and verifies', async () => {
    const hash = await hashPassword('s3cret-password')
    expect(hash).not.toBe('s3cret-password')
    expect(await verifyPassword(hash, 's3cret-password')).toBe(true)
    expect(await verifyPassword(hash, 'wrong')).toBe(false)
  })
})
```

- [ ] **Step 2: Run, verify fail**

Run: `npm run test -- lib/auth-password.test.ts` → FAIL (cannot resolve).

- [ ] **Step 3: Implement `lib/auth-password.ts`**

```typescript
import { hash, verify } from '@node-rs/argon2'

// argon2id defaults from @node-rs are sensible; keep options minimal.
export async function hashPassword(plain: string): Promise<string> {
  return hash(plain)
}

export async function verifyPassword(hashed: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashed, plain)
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Run, verify pass** → `npm run test -- lib/auth-password.test.ts` PASS.

- [ ] **Step 5: Write failing test `lib/models/Admin.test.ts`**

```typescript
import { describe, expect, it } from 'vitest'
import { setupTestDb } from '@/test/setup-db'
import { Admin } from './Admin'

describe('Admin model', () => {
  setupTestDb()

  it('requires email and passwordHash', async () => {
    await expect(Admin.create({})).rejects.toThrow()
  })

  it('lowercases email and defaults role=admin', async () => {
    const a = await Admin.create({ email: 'Foo@Bar.com', passwordHash: 'x' })
    expect(a.email).toBe('foo@bar.com')
    expect(a.role).toBe('admin')
  })

  it('enforces unique email', async () => {
    await Admin.create({ email: 'a@b.com', passwordHash: 'x' })
    await expect(Admin.create({ email: 'a@b.com', passwordHash: 'y' })).rejects.toThrow()
  })
})
```

- [ ] **Step 6: Run, verify fail** → FAIL (cannot resolve).

- [ ] **Step 7: Implement `lib/models/Admin.ts`**

```typescript
import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose'

const adminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: '' },
    role: { type: String, enum: ['admin'], default: 'admin' },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
  },
  { timestamps: true }
)

export type AdminDoc = InferSchemaType<typeof adminSchema>
export const Admin: Model<AdminDoc> =
  (models.Admin as Model<AdminDoc>) ?? model<AdminDoc>('Admin', adminSchema)
```

- [ ] **Step 8: Run, verify pass.** Unique-index test needs the index built; if it flakes in-memory, the test file already awaits `create` sequentially — Mongoose builds the index on first `create`. If the third assertion is flaky, add `await Admin.init()` before the first create in the test. Run: `npm run test -- lib/models/Admin.test.ts` → PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add lib/models/Admin.ts lib/auth-password.ts lib/models/Admin.test.ts lib/auth-password.test.ts
git commit -m "feat: add Admin model + argon2 password helpers"
```

---

### Task 3: Auth.js configuration + route + middleware

**Files:**
- Create: `auth.ts` (repo root)
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `middleware.ts` (repo root)
- Create: `types/next-auth.d.ts`

**Interfaces:**
- Produces: `auth`, `signIn`, `signOut`, `handlers` exported from `auth.ts`. Session carries `user.id`, `user.email`, `user.role`. Credentials `authorize` verifies against `Admin` via argon2 and returns the user or null.

- [ ] **Step 1: Implement `auth.ts`**

```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { connectDb } from '@/lib/db'
import { Admin } from '@/lib/models/Admin'
import { verifyPassword } from '@/lib/auth-password'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: { signIn: '/admin/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = String(creds?.email ?? '').toLowerCase().trim()
        const password = String(creds?.password ?? '')
        if (!email || !password) return null
        await connectDb()
        const admin = await Admin.findOne({ email })
        if (!admin) return null
        const ok = await verifyPassword(admin.passwordHash, password)
        if (!ok) return null
        return { id: String(admin._id), email: admin.email, name: admin.name, role: admin.role }
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) token.role = (user as { role?: string }).role ?? 'admin'
      return token
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? ''
        ;(session.user as { role?: string }).role = (token.role as string) ?? 'admin'
      }
      return session
    },
  },
})
```

- [ ] **Step 2: Implement `app/api/auth/[...nextauth]/route.ts`**

```typescript
import { handlers } from '@/auth'
export const { GET, POST } = handlers
```

- [ ] **Step 3: Implement `middleware.ts`** (guard `/admin`, allow `/admin/login`)

```typescript
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLogin = pathname === '/admin/login'
  const isAdmin = pathname.startsWith('/admin')
  if (isAdmin && !isLogin && !req.auth) {
    const url = new URL('/admin/login', req.nextUrl.origin)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }
  if (isLogin && req.auth) {
    return NextResponse.redirect(new URL('/admin', req.nextUrl.origin))
  }
  return NextResponse.next()
})

export const config = {
  // Run on admin routes only; exclude static assets and the auth API.
  matcher: ['/admin/:path*'],
}
```

- [ ] **Step 4: Implement `types/next-auth.d.ts`** (typed session)

```typescript
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role?: string
    }
  }
}
```

- [ ] **Step 5: Typecheck**

Run: `npm run type-check`
Expected: clean (no errors).

- [ ] **Step 6: Commit**

```bash
git add auth.ts app/api/auth middleware.ts types/next-auth.d.ts
git commit -m "feat: Auth.js credentials auth + admin route guard"
```

---

### Task 4: create-admin bootstrap script

**Files:** Create `scripts/create-admin.ts`; add `package.json` script `"create-admin": "tsx --env-file=.env.local scripts/create-admin.ts"`.

**Interfaces:** Reads `ADMIN_EMAIL` + `ADMIN_PASSWORD` from env, upserts an `Admin` with an argon2 hash. Idempotent: updates the password if the admin already exists.

- [ ] **Step 1: Implement `scripts/create-admin.ts`**

```typescript
/**
 * Bootstrap / reset the admin account from env. Run: npm run create-admin
 * Requires ADMIN_EMAIL + ADMIN_PASSWORD in .env.local.
 */
import mongoose from 'mongoose'
import { connectDb } from '../lib/db'
import { Admin } from '../lib/models/Admin'
import { hashPassword } from '../lib/auth-password'

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim()
  const password = process.env.ADMIN_PASSWORD || ''
  if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local')
  if (password.length < 10) throw new Error('ADMIN_PASSWORD must be at least 10 characters')

  await connectDb()
  const passwordHash = await hashPassword(password)
  const existing = await Admin.findOne({ email })
  if (existing) {
    existing.passwordHash = passwordHash
    await existing.save()
    console.log(`Updated admin password for ${email}`)
  } else {
    await Admin.create({ email, passwordHash })
    console.log(`Created admin ${email}`)
  }
  await mongoose.disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
```

- [ ] **Step 2: Add package script** (edit `package.json` scripts):
```json
"create-admin": "tsx --env-file=.env.local scripts/create-admin.ts"
```

- [ ] **Step 3: Run it** (requires ADMIN_EMAIL + ADMIN_PASSWORD set)

Run: `npm run create-admin`
Expected: `Created admin kaifkazi40@gmail.com`.

- [ ] **Step 4: Commit**

```bash
git add scripts/create-admin.ts package.json
git commit -m "feat: add create-admin bootstrap script"
```

---

### Task 5: Admin shell — layout, sidebar, login, dashboard

**Files:**
- Create: `app/(admin)/admin/layout.tsx`
- Create: `app/(admin)/admin/login/page.tsx`
- Create: `app/(admin)/admin/page.tsx` (dashboard)
- Create: `components/admin/Sidebar.tsx`
- Create: `components/admin/SignOutButton.tsx`
- Create: `lib/admin-stats.ts`

**Interfaces:**
- `lib/admin-stats.ts` → `getDashboardStats(): Promise<{ enquiries: number; projects: number; publishedProjects: number; posts: number; draftPosts: number; testimonials: number }>` (Enquiry model doesn't exist until P7 — count 0 with a guarded import, or count only existing collections). Uses Project/Post/Testimonial now; enquiries = 0 placeholder until P7.

- [ ] **Step 1: Implement `lib/admin-stats.ts`**

```typescript
import { connectDb } from './db'
import { Project } from './models/Project'
import { Post } from './models/Post'
import { Testimonial } from './models/Testimonial'

export async function getDashboardStats() {
  await connectDb()
  const [projects, publishedProjects, posts, draftPosts, testimonials] = await Promise.all([
    Project.countDocuments(),
    Project.countDocuments({ status: 'published' }),
    Post.countDocuments(),
    Post.countDocuments({ status: 'draft' }),
    Testimonial.countDocuments(),
  ])
  return { enquiries: 0, projects, publishedProjects, posts, draftPosts, testimonials }
}
```

- [ ] **Step 2: Implement `components/admin/Sidebar.tsx`** (client component, active-link highlight)

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const groups = [
  { items: [{ href: '/admin', label: 'Dashboard' }] },
  {
    title: 'Content',
    items: [
      { href: '/admin/projects', label: 'Projects' },
      { href: '/admin/testimonials', label: 'Testimonials' },
      { href: '/admin/journal', label: 'Journal' },
    ],
  },
  { title: 'Inbox', items: [{ href: '/admin/inbox', label: 'Enquiries' }] },
  { items: [{ href: '/admin/media', label: 'Media' }] },
  { items: [{ href: '/admin/settings', label: 'Settings' }] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const isActive = (href: string) => (href === '/admin' ? pathname === href : pathname.startsWith(href))
  return (
    <nav className="flex h-full flex-col gap-6 p-5">
      <Link href="/admin" className="px-2 text-lg font-semibold tracking-tight text-paper">
        Naazware
        <span className="ml-1 text-accent-soft">Admin</span>
      </Link>
      <div className="flex flex-col gap-5">
        {groups.map((g, i) => (
          <div key={i} className="flex flex-col gap-1">
            {g.title && (
              <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-paper-faint">{g.title}</p>
            )}
            {g.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive(item.href)
                    ? 'bg-accent/10 text-paper'
                    : 'text-paper-dim hover:bg-ink-700 hover:text-paper'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Implement `components/admin/SignOutButton.tsx`**

```tsx
import { signOut } from '@/auth'

export default function SignOutButton() {
  return (
    <form
      action={async () => {
        'use server'
        await signOut({ redirectTo: '/admin/login' })
      }}
    >
      <button
        type="submit"
        className="rounded-lg px-3 py-2 text-sm text-paper-dim transition-colors hover:bg-ink-700 hover:text-paper"
      >
        Sign out
      </button>
    </form>
  )
}
```

- [ ] **Step 4: Implement `app/(admin)/admin/layout.tsx`** (guards + chrome; login page renders without chrome via its own check)

```tsx
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Sidebar from '@/components/admin/Sidebar'
import SignOutButton from '@/components/admin/SignOutButton'
import '@/styles/globals.css'

export const metadata = { title: 'Naazware Admin', robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  // The login route has its own minimal layout segment; if unauthenticated here, middleware
  // already redirected. This guard is defence-in-depth for the chrome layout.
  if (!session) redirect('/admin/login')
  return (
    <div className="min-h-screen bg-ink-900 text-paper" data-theme="dark">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="hidden w-60 shrink-0 border-r border-ink-600 bg-ink-950/60 backdrop-blur md:flex md:flex-col">
          <div className="flex-1">
            <Sidebar />
          </div>
          <div className="border-t border-ink-600 p-3">
            <div className="px-2 pb-2 text-xs text-paper-faint">{session.user?.email}</div>
            <SignOutButton />
          </div>
        </aside>
        <main className="flex-1 px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  )
}
```

Note: the login page must NOT be wrapped by this guarded layout. Put login OUTSIDE the guarded segment by making the layout above apply only to authed pages. To achieve this cleanly, place login at `app/(admin)/admin/login/page.tsx` and add a dedicated `app/(admin)/admin/login/layout.tsx` that renders children bare (below), which overrides chrome for that subtree. Since the parent layout still runs, instead move the auth guard OUT of the shared layout and into each authed page via a helper. Implement the simpler robust approach in Step 5.

- [ ] **Step 5: Replace the guard approach — shared layout renders chrome only when a session exists; login renders bare**

Update `app/(admin)/admin/layout.tsx` to NOT redirect, and render bare children when no session (so the login page shows), chrome when authed:

```tsx
import type { ReactNode } from 'react'
import { auth } from '@/auth'
import Sidebar from '@/components/admin/Sidebar'
import SignOutButton from '@/components/admin/SignOutButton'
import '@/styles/globals.css'

export const metadata = { title: 'Naazware Admin', robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session) {
    // Unauthed (e.g. /admin/login). Middleware guards everything except the login page.
    return (
      <div className="min-h-screen bg-ink-900 text-paper" data-theme="dark">
        {children}
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-ink-900 text-paper" data-theme="dark">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="hidden w-60 shrink-0 border-r border-ink-600 bg-ink-950/60 backdrop-blur md:flex md:flex-col">
          <div className="flex-1"><Sidebar /></div>
          <div className="border-t border-ink-600 p-3">
            <div className="px-2 pb-2 text-xs text-paper-faint">{session.user?.email}</div>
            <SignOutButton />
          </div>
        </aside>
        <main className="flex-1 px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Implement `app/(admin)/admin/login/page.tsx`** (client form → `signIn`)

```tsx
'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') || '/admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) return setError('Invalid email or password')
    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-ink-600 bg-ink-800/70 p-8 backdrop-blur"
      >
        <h1 className="text-xl font-semibold text-paper">
          Naazware <span className="text-accent-soft">Admin</span>
        </h1>
        <p className="mt-1 text-sm text-paper-dim">Sign in to continue.</p>
        <label className="mt-6 block text-sm text-paper-dim">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-paper outline-none focus:border-accent"
          />
        </label>
        <label className="mt-4 block text-sm text-paper-dim">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-paper outline-none focus:border-accent"
          />
        </label>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-accent px-4 py-2 font-medium text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 7: Implement `app/(admin)/admin/page.tsx`** (dashboard skeleton with live counts)

```tsx
import { auth } from '@/auth'
import { getDashboardStats } from '@/lib/admin-stats'

export const dynamic = 'force-dynamic'

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-ink-600 bg-ink-800/60 p-5 backdrop-blur">
      <div className="text-3xl font-semibold text-paper">{value}</div>
      <div className="mt-1 text-sm text-paper-dim">{label}</div>
    </div>
  )
}

export default async function AdminDashboard() {
  const session = await auth()
  const stats = await getDashboardStats()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  return (
    <div>
      <h1 className="text-2xl font-semibold text-paper">
        {greeting} 👋
      </h1>
      <p className="mt-1 text-sm text-paper-dim">{session?.user?.email}</p>
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="New enquiries" value={stats.enquiries} />
        <StatCard label="Projects" value={stats.projects} />
        <StatCard label="Published projects" value={stats.publishedProjects} />
        <StatCard label="Journal posts" value={stats.posts} />
        <StatCard label="Draft posts" value={stats.draftPosts} />
        <StatCard label="Testimonials" value={stats.testimonials} />
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Typecheck + lint + build**

Run: `npm run type-check && npm run lint && npm run build`
Expected: clean; `/admin`, `/admin/login` appear in the build output as dynamic routes.

- [ ] **Step 9: Manual verification**

Run `npm run dev`. Visit `/admin` while logged out → redirected to `/admin/login`. Sign in with the bootstrapped credentials → land on the dashboard showing real counts (projects 4, posts 2, testimonials 3). Sign out → back to login. Visit `/admin/login` while authed → redirected to `/admin`.

- [ ] **Step 10: Commit**

```bash
git add "app/(admin)" components/admin lib/admin-stats.ts
git commit -m "feat: admin shell — guarded layout, sidebar, login, dashboard"
```

---

### Task 6: Update ADR + docs

- [ ] **Step 1: Append to `docs/decisions/0002-authjs-credentials.md`** a note: session strategy is JWT (no Mongo adapter needed for single credentials user); `authorize` verifies against the Admin model with argon2.

- [ ] **Step 2: Update `docs/ROADMAP.md`** — mark P3 ☑.

- [ ] **Step 3: Update `docs/HANDOVER.md`** — record auth + admin shell done and how it was verified; next = P4 Projects management (list/CRUD/reorder + media picker using P2 storage + an auth-gated upload route).

- [ ] **Step 4: Commit**

```bash
git add docs/
git commit -m "docs: mark P3 complete; note JWT session decision"
```

---

## Self-Review

- **Spec coverage:** secure login (Task 3), password hashing (Task 2), session management via JWT (Task 3), protected admin routes (middleware, Task 3), secure cookies (Auth.js default httpOnly/secure), admin shell + sidebar exactly matching spec nav (Task 5), dashboard overview (Task 5). Password reset via Resend is spec'd but belongs with settings/account (P8) — noted, not built here. ✓
- **Placeholder scan:** none; all code complete. ✓
- **Type consistency:** `auth`/`signIn`/`signOut`/`handlers` exports used consistently; `getDashboardStats` shape matches the dashboard consumer; session `user.role`/`user.id` typed in `types/next-auth.d.ts`. ✓
- **Known risk:** next-auth v5 is beta; API (`auth()`, `handlers`, middleware wrapper) is stable in 5.x betas. If a minor API name differs at install time, adjust imports per the installed version's README (verify during Task 3 typecheck).
