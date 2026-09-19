# Handover — current state

**Last updated:** 2026-09-19
**Branch:** feat/custom-cms
**Current phase:** P2 complete ✓ → next is P3 (auth + admin shell)

## Done + verified
- Spec 1 approved; Plans 1 & 2 written.
- P0: docs/handover system + 6 ADRs.
- P1: Mongoose connection + models (Media/Project/Post/Testimonial); reseed; `lib/content.ts`
  reads Mongo w/ local fallback; blog `[slug]` renders markdown. Verified on live Atlas.
- P2: `lib/storage.ts` (R2 S3 client — signed upload URLs, put, delete, public URL, buildObjectKey);
  `lib/media.ts` (createMedia/listMedia/deleteMedia, deletes R2 object + record); live R2
  round-trip verified (`npm run verify:r2`: PUT → public GET 200 → DELETE).
- Gate GREEN: `test` 20/20 · `type-check` · `lint` · `build` (26/26 pages) all pass.

## Tested
- 20 unit/integration tests (in-memory Mongo + mocked R2).
- Live Atlas: seed + read + build. Live R2: round-trip.

## Broken / blockers
- None. P3 needs `AUTH_SECRET` (generate: `openssl rand -base64 32`) and bootstrap
  `ADMIN_EMAIL` / `ADMIN_PASSWORD` for `scripts/create-admin.ts`.

## Next step
- Write Plan 3 for P3: Auth.js (next-auth v5) credentials + Mongo Admin model + argon2 hashing
  + `middleware.ts` guarding /admin, admin layout shell + dashboard skeleton + create-admin script.
- Then media library UI + auth-gated HTTP upload route (uses signed URLs from `lib/storage.ts`).

## Notes
- Sanity still present as fallback; do NOT remove until P9 gate.
- `.env.local` (gitignored) has MONGODB_URI, DNS_SERVERS, and R2_* keys.
  ⚠ Atlas + R2 creds were shared in chat — rotate before/after go-live.
- R2 bucket `naazware-website`, public dev URL `https://pub-427882a79c7947e38fb9b1dd755bfb5d.r2.dev`.
- HTTP upload route intentionally NOT built in P2 (would be unauthenticated) — built in P3 once auth exists.
- Tests use cached mongod binary; DNS_SERVERS workaround for local Atlas SRV.
