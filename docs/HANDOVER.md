# Handover — current state

**Last updated:** 2026-09-19
**Branch:** feat/custom-cms
**Current phase:** P1 complete ✓ → next is P2 (R2 storage)

## Done + verified
- Spec 1 approved; Plan 1 written.
- P0: docs/handover system + 6 ADRs.
- P1: Vitest infra; Mongoose connection (`lib/db.ts`); models Media/Project/Post/Testimonial;
  reseed script (`scripts/seed-mongo.ts`); `lib/content.ts` reads Mongo with local fallback;
  blog `[slug]` renders markdown (Sanity PortableText branch removed).
- Gate GREEN: `test` 14/14 · `type-check` · `lint` · `build` all pass.
- LIVE Atlas verified: seeded 4 projects / 2 posts / 3 testimonials; content layer reads
  from Atlas (readyState=1, 4 DB docs); `next build` prerenders all /work + /blog pages from Mongo.

## Tested
- Unit/integration via in-memory Mongo (14 tests).
- Live Atlas: seed + read + full build confirmed.

## Broken / blockers
- None for P1.
- P2 needs R2 env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL.

## Next step
- Write Plan 2 for P2 (Cloudflare R2 storage interface + Media uploads via signed URLs).
- Blocked until user provisions R2 bucket + tokens.

## Notes
- Sanity still present as fallback; do NOT remove until P9 gate.
- `.env.local` (gitignored) now has MONGODB_URI + DNS_SERVERS (local-only SRV workaround).
  ⚠ Atlas creds were shared in chat — rotate before/after go-live if desired.
- Tests use cached mongod binary at node_modules/.cache/mongodb-memory-server/ (else download on CI).
- DNS_SERVERS workaround: local default resolver (IPv6 link-local fe80::1) refuses SRV; db.ts
  applies DNS_SERVERS when set. Unset in prod.
