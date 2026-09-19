# Handover — current state

## ▶ RESUME HERE (new session)
1. `git checkout feat/custom-cms` (all work is on this branch, not master).
2. Read this file + `docs/ROADMAP.md` + `docs/PROJECT.md`. Skim `docs/decisions/`.
3. Verify gate still green: `npm run test` (60) · `npm run type-check` · `npm run lint`.
4. `.env.local` already holds all secrets on this machine (MONGODB_URI direct string, R2_*, AUTH_SECRET, ADMIN_*). See "env note" below.
5. **Next task = P10 live deploy (operator runbook).** Repo prep is DONE (render.yaml + .node-version).
   Follow `docs/superpowers/plans/2026-09-19-phase-10-render-deploy.md` Tasks 3–5: push master to GitHub,
   create the Render Blueprint from render.yaml, set the sync:false secrets (mongodb+srv URI, R2_*, AUTH_SECRET,
   RESEND_*, NEXT_PUBLIC_SITE_URL), open Atlas network access, create the prod admin, smoke test.
   ⚠ ROTATE all shared creds (Atlas/R2/Resend/AUTH_SECRET/admin pw) before go-live.
6. Admin login for live testing: kaifkazi40@gmail.com / `Naazware@2026` (dummy).

**Last updated:** 2026-09-19
**Branch:** feat/custom-cms
**Current phase:** P10 repo prep ◐ (render.yaml + .node-version committed, Netlify removed, build green) → live deploy is an operator runbook
**Gate:** GREEN — 60 tests · type-check · lint · build.

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
- P7 Inbox + contact→Mongo:
  - Backend: `lib/models/Enquiry.ts`, `lib/enquiries-service.ts` (create/list/get/setStatus/delete),
    `lib/schemas/enquiry.ts`, admin API (`/api/admin/enquiries`, `/[id]` GET/PATCH/DELETE).
  - Public `/api/contact` rewired: Mongo `createEnquiry` + Resend email; Sanity write removed;
    IP-keyed rate limit; returns 500 only if BOTH DB save and email fail (no silent lead loss).
  - UI: `app/(admin)/admin/inbox` (list + [id] detail) + `components/admin`
    (EnquiriesTable, EnquiryDetail — mark read/unread/archived, delete). Detail auto-marks new→read on open.
    `apiSend` widened to allow PATCH.
  - **Verified LIVE via HTTP**: contact valid → 200 (stored); honeypot → 200 not stored; invalid → 400;
    unauth admin list → 401; auth list shows enquiry (status new); PATCH archived; DELETE 200.
- P8 Site settings:
  - Backend: `lib/models/Settings.ts` (singleton), `lib/settings-service.ts` (getSettingsDoc/updateSettings/
    getSettings — Mongo merged over `lib/site.ts` defaults; phoneHref derived), `lib/schemas/settings.ts`,
    admin API (`/api/admin/settings` GET effective / PUT). getSettings is the public read (server consumers).
  - UI: `app/(admin)/admin/settings` + `components/admin/SettingsForm.tsx` (brand, contact, socials).
  - Wired SERVER consumers to getSettings(): Footer (socials/email/phone/location), contact/privacy/terms
    pages (email/phone), `app/layout.tsx` Organization + WebSite JSON-LD (via seo.ts fns now taking a settings arg).
  - Scope boundary (intentional): client Header/ContactForm + seo.ts page-metadata + sitemap/robots stay on
    static `site.ts` (structural fields only; avoids async cascade through client tree + per-page metadata).
  - **Verified LIVE via HTTP**: unauth 401; GET defaults; PUT override → footer `/` + org JSON-LD reflect
    new email + linkedin; invalid email → 400; empty override → falls back to site.ts defaults. Overrides reset after.
- **P4 verified LIVE via HTTP** (dev server): admin login (session role=admin); create project →
  appears in admin list AND on public /work; duplicate; delete; unauth → 401; /admin → 307 login.
- Gate GREEN: 33 tests · type-check · lint · build.

## Tested
- 60 unit/integration tests. Live: auth + projects/testimonials/journal/enquiries/settings CRUD + contact→Mongo + settings public reflection + R2 round-trip.
- Not clicked in a real browser, but every API path exercised over HTTP with a real session cookie.

## Broken / blockers
- None. Admin: kaifkazi40@gmail.com / DUMMY `Naazware@2026` (change via `npm run create-admin`).

## IMPORTANT env note (local vs prod)
- LOCAL `.env.local` MONGODB_URI is a DIRECT (non-SRV) string — this machine's c-ares resolver
  can't do the mongodb+srv SRV lookup (IPv6 link-local gateway refuses). Plain mongodb:// uses the
  OS resolver and works. **On Render (prod) use the mongodb+srv URI** (commented in .env.local).
- DNS_SERVERS is a secondary local workaround (helps c-ares in build/scripts; not needed with the direct URI).

## Next step
- P10 live deploy: repo prep done (render.yaml blueprint, Node 20 pin, Netlify removed). Remaining is the
  operator runbook (plan Tasks 3–5): push to GitHub, Render Blueprint, set secrets, Atlas network access,
  prod admin, smoke test, and rotate all shared credentials. All feature phases (P0–P9) complete + verified.

## Notes
- Sanity fully removed at P9 (deps, /studio, sanity/, configs, legacy seeds, envs). Public content falls back to local *-data.ts when Mongo is empty/unset.
- ⚠ Atlas + R2 creds shared in chat — rotate before/after go-live.
- next.config.js externalizes @node-rs/argon2 + mongoose (native/server libs) so the bundle builds.
- Two stale dev servers were cleaned up this session; if port 3000 misbehaves, check for orphaned node.
