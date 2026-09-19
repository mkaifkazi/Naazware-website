# Handover — current state

## ▶ RESUME HERE (new session)
1. `git checkout feat/custom-cms` (all work is on this branch, not master).
2. Read this file + `docs/ROADMAP.md` + `docs/PROJECT.md`. Skim `docs/decisions/`.
3. Verify gate still green: `npm run test` (48) · `npm run type-check` · `npm run lint`.
4. `.env.local` already holds all secrets on this machine (MONGODB_URI direct string, R2_*, AUTH_SECRET, ADMIN_*). See "env note" below.
5. **Next task = P7 Inbox + contact route rewired to Mongo.** Plan it (writing-plans), following the P4a/P4b pattern:
   service + zod + auth-gated API routes, then admin UI. Then execute (executing-plans).
6. Admin login for live testing: kaifkazi40@gmail.com / `Naazware@2026` (dummy).

**Last updated:** 2026-09-19
**Branch:** feat/custom-cms
**Current phase:** P6 complete ☑ (journal/Tiptap, verified live) → next is P7 (inbox + contact→Mongo)
**Gate:** GREEN — 48 tests · type-check · lint.

## Done + verified
- P0 docs/ADRs; P1 MongoDB data layer (live Atlas); P2 R2 storage (live round-trip);
  P3 auth + admin shell (argon2, login verified live).
- P4 Projects management:
  - Backend: `lib/projects-service.ts` (CRUD/slug/duplicate/reorder), `lib/schemas/project.ts`,
    admin API routes (`/api/admin/projects*`, `/api/admin/media*`), `lib/admin-api.ts` (auth guard),
    `lib/rate-limit.ts`. All auth-gated + zod-validated + rate-limited.
  - UI: `app/(admin)/admin/projects` (list, new, [id] editor) + `components/admin`
    (ProjectsTable, ProjectEditor, MediaPicker, UploadButton, ImageField, ui primitives).
  - Upload flow: sign → PUT to R2 → register (createMedia).
- P5 Testimonials management:
  - Backend: `lib/testimonials-service.ts` (CRUD/list/reorder), `lib/schemas/testimonial.ts`,
    API routes (`/api/admin/testimonials`, `/[id]`, `/reorder`). Auth-gated + zod + rate-limited.
  - UI: `app/(admin)/admin/testimonials` (list, new, [id]) + `components/admin`
    (TestimonialsTable with move up/down reorder, TestimonialEditor, portrait + companyLogo via MediaPicker).
  - Reorder is move-up/down buttons (no new dep); API takes full ordered id list, so drag-and-drop can drop in later.
  - Public reflection unchanged: `lib/content.ts` `getTestimonials()` already reads published, ordered.
  - **Verified LIVE via HTTP** (real session cookie): unauth 401; list 200 (3 seeded from Mongo);
    create ×2 → 201; empty-name validation → 400; reorder → order flips; delete ×2 → 200, list back to 3.
- P6 Journal management (Tiptap):
  - Backend: `lib/posts-service.ts` (CRUD/slug/list + JSON→HTML serialize), `lib/schemas/post.ts`,
    `lib/tiptap-extensions.ts` (shared StarterKit[H2/H3]+Link+Image), API routes (`/api/admin/posts`, `/[id]`).
    Post model gained `contentHtml`. Tiptap v2 deps added.
  - UI: `app/(admin)/admin/journal` (list, new, [id]) + `components/admin`
    (RichTextEditor = Tiptap + core toolbar + image via MediaPicker, PostsTable, PostEditor).
  - Body = Tiptap JSON (source of truth) in `content`; `contentHtml` derived server-side (@tiptap/html,
    safe — regenerated from constrained schema, not client HTML). Public `/blog/[slug]` renders contentHtml,
    `renderMarkdown` fallback for seeded/local posts. Stale Sanity `scripts/seed-journal.ts` deleted.
  - **Verified LIVE via HTTP** (real session cookie): unauth 401; create rich post → 201;
    stored contentHtml = `<p>Bold body here.</p>`; public /blog/hello-tiptap renders it; validation 400; delete 200.
- **P4 verified LIVE via HTTP** (dev server): admin login (session role=admin); create project →
  appears in admin list AND on public /work; duplicate; delete; unauth → 401; /admin → 307 login.
- Gate GREEN: 33 tests · type-check · lint · build.

## Tested
- 48 unit/integration tests. Live: auth + projects/testimonials/journal CRUD + public reflection + R2 round-trip.
- Not clicked in a real browser, but every API path exercised over HTTP with a real session cookie.

## Broken / blockers
- None. Admin: kaifkazi40@gmail.com / DUMMY `Naazware@2026` (change via `npm run create-admin`).

## IMPORTANT env note (local vs prod)
- LOCAL `.env.local` MONGODB_URI is a DIRECT (non-SRV) string — this machine's c-ares resolver
  can't do the mongodb+srv SRV lookup (IPv6 link-local gateway refuses). Plain mongodb:// uses the
  OS resolver and works. **On Render (prod) use the mongodb+srv URI** (commented in .env.local).
- DNS_SERVERS is a secondary local workaround (helps c-ares in build/scripts; not needed with the direct URI).

## Next step
- P7 Inbox + contact route rewired to Mongo: enquiry model + admin inbox UI (list/read/mark/delete),
  and repoint the public contact form submit at a Mongo-backed route. Sidebar already links /admin/inbox.

## Notes
- Sanity still present as fallback; remove at P9.
- ⚠ Atlas + R2 creds shared in chat — rotate before/after go-live.
- next.config.js externalizes @node-rs/argon2 + mongoose (native/server libs) so the bundle builds.
- Two stale dev servers were cleaned up this session; if port 3000 misbehaves, check for orphaned node.
