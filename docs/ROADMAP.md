# Roadmap — Naazware Custom CMS (Spec 1)

Spec: docs/superpowers/specs/2026-09-19-naazware-cms-data-layer-design.md
Status legend: ☐ pending · ◐ partial · ☑ done+verified

## Phases
- ☑ P0 Docs/handover scaffold + ADRs
- ☑ P1 Mongoose models + `lib/content.ts` swap + reseed — verified against live Atlas (build prerenders all pages from Mongo)
- ☑ P2 R2 storage interface + Media helpers — live round-trip verified (HTTP upload route deferred to P3, auth-gated)
- ☑ P3 Auth.js + admin shell + create-admin — admin account created; credential path verified (argon2 hash stored, verify pass/fail correct); build guards /admin. (Browser click-through not yet run — optional manual confirm.)
- ☑ P4 Projects management — VERIFIED LIVE (login → create → public /work → duplicate → delete)
  - ☑ P4a backend: projects service + CRUD/duplicate/reorder API + media API. Auth-gated, zod-validated, rate-limited.
  - ☑ P4b admin UI: projects list (search/filter/duplicate/delete) + full editor + media picker + upload widget
- ☑ P5 Testimonials management — VERIFIED LIVE (login → list → create → reorder → delete; unauth 401; validation 400)
  - service + zod + auth-gated API (CRUD + reorder) + admin UI (list/editor, move up-down reorder, MediaPicker portrait+logo)
- ☑ P6 Journal management (Tiptap) — VERIFIED LIVE (login → create rich post → contentHtml derived → public /blog render; unauth 401; validation 400; delete 200)
  - service + zod + auth-gated API (CRUD) + admin UI (list/editor, Tiptap core toolbar, image via MediaPicker)
  - body = Tiptap JSON source of truth; server derives contentHtml (@tiptap/html); public renders it, markdown fallback for seeded posts
- ☑ P7 Inbox + contact route rewired to Mongo — VERIFIED LIVE (contact 200 → Mongo; honeypot 200 not stored; invalid 400; unauth 401; list/patch/delete)
  - Enquiry model + service + zod + auth-gated API (list/get/patch/delete) + admin inbox UI (list/detail, mark read/unread/archived, delete)
  - /api/contact now Mongo-only + Resend email (Sanity write dropped); IP rate limit; 500 only if both DB+email fail
- ☑ P8 Settings — VERIFIED LIVE (GET defaults; PUT override → footer + org JSON-LD reflect; invalid 400; empty → falls back to site.ts)
  - Settings singleton + service (getSettings = Mongo over site.ts) + zod + auth-gated API (GET/PUT) + admin form
  - server consumers wired: Footer, contact/privacy/terms pages, layout JSON-LD. Boundary: client Header/ContactForm + page metadata/sitemap/robots stay static
- ☑ P9 Sanity removal — DONE (deps @portabletext/@sanity/next-sanity/sanity/puppeteer-core removed; /studio + sanity/ + configs + 5 legacy seeds deleted; Sanity envs stripped; build green, 60 tests)
- ☐ P10 Render deployment

Then Spec 2: public website redesign (separate brainstorm).

## Dependencies
P1→(all). P2→P4,P5,P6 (media). P3→P4..P8 (auth). P9 needs P1+P7 verified. P10 last.

## Plans written (docs/superpowers/plans/)
- 2026-09-19-phase-0-1-foundation.md — DONE
- 2026-09-19-phase-2-r2-storage.md — DONE
- 2026-09-19-phase-3-auth-admin-shell.md — DONE
- 2026-09-19-phase-4a-projects-backend.md — DONE
- 2026-09-19-phase-4b-projects-ui.md — DONE
- 2026-09-19-phase-5-testimonials.md — DONE
- 2026-09-19-phase-6-journal-tiptap.md — DONE
- 2026-09-19-phase-7-inbox.md — DONE
- 2026-09-19-phase-8-settings.md — DONE
- P9 was a mechanical removal (no plan doc). P10 (deploy) not yet planned.

## Reusable patterns for remaining phases (P5–P8)
- Model exists in lib/models/. Add: `lib/<x>-service.ts` (CRUD) + `lib/schemas/<x>.ts` (zod).
- API: `app/api/admin/<x>/**` route handlers using `requireAdmin`/`json`/`badRequest` + `rateLimit`.
- UI: `app/(admin)/admin/<x>/**` + client components in `components/admin` reusing ui.tsx + MediaPicker.
- Test service against in-memory Mongo (setupTestDb); verify live over HTTP with a session cookie.
- Public site reads via lib/content.ts (already Mongo-backed).
