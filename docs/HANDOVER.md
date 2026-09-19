# Handover — current state

**Last updated:** 2026-09-19
**Branch:** feat/custom-cms
**Current phase:** P3 complete ☑ → next is P4 (Projects management)

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
- None. Admin account exists (kaifkazi40@gmail.com, DUMMY password `Naazware@2026` — change via
  `npm run create-admin` after editing ADMIN_PASSWORD). Browser login click-through not yet run.

## Next step
- P4: Projects management — admin list (search/filter/status/featured), CRUD, reorder, duplicate;
  auth-gated upload route (signed URLs from lib/storage.ts) + media picker; project editor form.

## Notes
- Sanity still present as fallback; remove at P9.
- `.env.local` has MONGODB_URI, DNS_SERVERS, R2_*, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD.
  ⚠ Atlas + R2 creds shared in chat — rotate before/after go-live.
- Auth: JWT sessions, no DB adapter (see ADR 0002). Admin UI dark-themed, brand tokens.
- HTTP upload route still deferred (built in P4 with auth).
