# Roadmap — Naazware Custom CMS (Spec 1)

Spec: docs/superpowers/specs/2026-09-19-naazware-cms-data-layer-design.md
Status legend: ☐ pending · ◐ partial · ☑ done+verified

## Phases
- ☑ P0 Docs/handover scaffold + ADRs
- ☑ P1 Mongoose models + `lib/content.ts` swap + reseed — verified against live Atlas (build prerenders all pages from Mongo)
- ☑ P2 R2 storage interface + Media helpers — live round-trip verified (HTTP upload route deferred to P3, auth-gated)
- ☑ P3 Auth.js + admin shell + create-admin — admin account created; credential path verified (argon2 hash stored, verify pass/fail correct); build guards /admin. (Browser click-through not yet run — optional manual confirm.)
- ◐ P4 Projects management
  - ☑ P4a backend: projects service + CRUD/duplicate/reorder API + media API (signed upload/register/list/delete). Auth-gated, zod-validated, rate-limited. 33 tests, build green.
  - ☐ P4b admin UI: projects list + editor + media picker + upload widget
- ☐ P5 Testimonials management
- ☐ P6 Journal management (Tiptap)
- ☐ P7 Inbox + contact route rewired to Mongo
- ☐ P8 Settings
- ☐ P9 Sanity removal (gated: only after P1–P7 verified)
- ☐ P10 Render deployment

Then Spec 2: public website redesign (separate brainstorm).

## Dependencies
P1→(all). P2→P4,P5,P6 (media). P3→P4..P8 (auth). P9 needs P1+P7 verified. P10 last.
