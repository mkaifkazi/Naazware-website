# Naazware Website — Project Guide

Custom software studio site: Next.js 14 (App Router) + React 18 + TS + Tailwind.
Being migrated OFF Sanity ONTO a self-owned CMS (MongoDB + Cloudflare R2 + Resend), deployed on Render.

## Read this first (session start)
1. Read ROADMAP.md → current phase + what's done/pending.
2. Read HANDOVER.md → last session state, next step, blockers.
3. Read ISSUES.md → known issues.
4. Skim decisions/ → settled architecture (don't relitigate).
5. VERIFY docs against actual code. Code wins on conflict — then fix the docs.

## Stack
- Framework: Next.js 14.2, React 18, TypeScript (strict).
- Data: MongoDB Atlas via Mongoose 8 (`lib/db.ts`, `lib/models/*`).
- Media: Cloudflare R2 (S3 API) — from Phase 2.
- Email: Resend (contact notifications, password reset).
- Auth: Auth.js (next-auth v5) credentials, single admin — from Phase 3.
- Editor: Tiptap (journal) — from Phase 6.
- Hosting: Render.

## Commands
- `npm run dev` — local dev.
- `npm run build` — production build (must pass before a phase is done).
- `npm run type-check` — `tsc --noEmit`.
- `npm run lint` — next lint.
- `npm run test` — Vitest.
- `npm run seed:mongo` — reseed illustrative content into MongoDB.

## Source of truth
The repository, not chat history. Persist every decision/change into these docs.
