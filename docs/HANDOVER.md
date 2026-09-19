# Handover — current state

**Last updated:** 2026-09-19
**Branch:** feat/custom-cms
**Current phase:** P1 (code complete, live-Atlas verification pending)

## Done + verified
- Spec 1 approved; Plan 1 written.
- P0: docs/handover system + 6 ADRs.
- P1 code: Vitest infra; Mongoose connection (`lib/db.ts`); models Media/Project/Post/Testimonial;
  reseed script (`scripts/seed-mongo.ts`); `lib/content.ts` reads Mongo with local fallback;
  blog `[slug]` page renders markdown (Sanity PortableText branch removed).
- Gate GREEN (offline): `npm run test` 14/14 pass · `type-check` clean · `lint` clean · `build` succeeds.
  Build fell back to local data (no MONGODB_URI) — 4 projects, 2 posts prerendered.

## Tested
- Unit/integration via in-memory Mongo (mongodb-memory-server). Models + content layer covered.
- NOT yet tested against a real MongoDB Atlas cluster.

## Broken / blockers
- 🟠 BLOCKER for full P1 sign-off: `MONGODB_URI` not set in `.env.local`.
  Needed to run `npm run seed:mongo` and verify pages render from live Atlas data (Plan 1 Tasks 8 + 10).

## Next step
1. Add `MONGODB_URI` to `.env.local` (Atlas connection string).
2. `npm run seed:mongo` → expect "Seeded 4 projects / 2 posts / 3 testimonials / Done."
3. `npm run dev`, verify /work, /work/[slug], /blog, /blog/[slug], home render from Mongo.
4. Mark P1 ☑ in ROADMAP; then Plan 2 = P2 (R2 storage) — needs R2_* env vars.

## Notes
- Sanity still present as fallback; do NOT remove until P9 gate.
- Tests use the mongod binary cached at
  `node_modules/.cache/mongodb-memory-server/mongod-x64-win32-7.0.24.exe` (vitest.config picks it up if present, else downloads). CI/Linux will download on first run.
