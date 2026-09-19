# Handover — current state

**Last updated:** 2026-09-19
**Branch:** feat/custom-cms
**Current phase:** P3 code complete ◐ (admin account + login smoke pending ADMIN_PASSWORD)

## Done + verified
- P0 docs/ADRs; P1 MongoDB data layer (live Atlas); P2 R2 storage (live round-trip).
- P3 code: Admin model + argon2 helpers; Auth.js v5 credentials with edge-safe split
  (`auth.config.ts` for middleware, `auth.ts` for Node route); `middleware.ts` guards /admin;
  create-admin script; admin shell (`app/(admin)/admin`): guarded layout + sidebar + login + dashboard.
  Native deps (@node-rs/argon2, mongoose) externalized in next.config.js so the bundle builds.
- Gate GREEN: `test` 24/24 · `type-check` · `lint` · `build` (admin routes dynamic, middleware active).

## Tested
- 24 unit/integration tests (in-memory Mongo, mocked R2).
- Build compiles admin routes + middleware.
- NOT yet: real login flow (needs an admin account).

## Broken / blockers
- 🟠 To finish P3: set `ADMIN_PASSWORD` in `.env.local`, run `npm run create-admin`, then
  smoke-test login at /admin. AUTH_SECRET + ADMIN_EMAIL already set.

## Next step
1. Operator sets ADMIN_PASSWORD in .env.local (≥10 chars).
2. `npm run create-admin` → "Created admin kaifkazi40@gmail.com".
3. `npm run dev` → /admin redirects to /admin/login → sign in → dashboard shows counts (4/4/2/…).
4. Mark P3 ☑. Then P4: Projects management (list/CRUD/reorder/duplicate + auth-gated upload
   route using signed URLs from lib/storage.ts + a media picker).

## Notes
- Sanity still present as fallback; remove at P9.
- `.env.local` has MONGODB_URI, DNS_SERVERS, R2_*, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD.
  ⚠ Atlas + R2 creds shared in chat — rotate before/after go-live.
- Auth: JWT sessions, no DB adapter (see ADR 0002). Admin UI dark-themed, brand tokens.
- HTTP upload route still deferred (built in P4 with auth).
