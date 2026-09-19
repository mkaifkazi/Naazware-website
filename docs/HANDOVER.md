# Handover — current state

## ▶ RESUME HERE (new session)
1. `git checkout feat/custom-cms` (all work is on this branch, not master).
2. Read this file + `docs/ROADMAP.md` + `docs/PROJECT.md`. Skim `docs/decisions/`.
3. Verify gate still green: `npm run test` (33) · `npm run type-check` · `npm run lint`.
4. `.env.local` already holds all secrets on this machine (MONGODB_URI direct string, R2_*, AUTH_SECRET, ADMIN_*). See "env note" below.
5. **Next task = P5 Testimonials.** Plan it (writing-plans), following the P4a/P4b pattern:
   service + zod + auth-gated API routes, then admin UI. Then execute (executing-plans).
6. Admin login for live testing: kaifkazi40@gmail.com / `Naazware@2026` (dummy).

**Last updated:** 2026-09-19
**Branch:** feat/custom-cms
**Current phase:** P4 complete ☑ (projects management, verified live) → next is P5 (testimonials)
**Gate:** GREEN — 33 tests · type-check · lint (re-verified after db.ts DNS refactor).

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
- **Verified LIVE via HTTP** (dev server): admin login (session role=admin); create project →
  appears in admin list AND on public /work; duplicate; delete; unauth → 401; /admin → 307 login.
- Gate GREEN: 33 tests · type-check · lint · build.

## Tested
- 33 unit/integration tests. Live: auth + full projects CRUD + public reflection + R2 round-trip.
- Not clicked in a real browser, but every API path exercised over HTTP with a real session cookie.

## Broken / blockers
- None. Admin: kaifkazi40@gmail.com / DUMMY `Naazware@2026` (change via `npm run create-admin`).

## IMPORTANT env note (local vs prod)
- LOCAL `.env.local` MONGODB_URI is a DIRECT (non-SRV) string — this machine's c-ares resolver
  can't do the mongodb+srv SRV lookup (IPv6 link-local gateway refuses). Plain mongodb:// uses the
  OS resolver and works. **On Render (prod) use the mongodb+srv URI** (commented in .env.local).
- DNS_SERVERS is a secondary local workaround (helps c-ares in build/scripts; not needed with the direct URI).

## Next step
- P5 Testimonials management: model already exists; build service + API (CRUD, publish, featured,
  drag-order) + admin UI (list with drag-and-drop order, image via MediaPicker). Small phase.

## Notes
- Sanity still present as fallback; remove at P9.
- ⚠ Atlas + R2 creds shared in chat — rotate before/after go-live.
- next.config.js externalizes @node-rs/argon2 + mongoose (native/server libs) so the bundle builds.
- Two stale dev servers were cleaned up this session; if port 3000 misbehaves, check for orphaned node.
