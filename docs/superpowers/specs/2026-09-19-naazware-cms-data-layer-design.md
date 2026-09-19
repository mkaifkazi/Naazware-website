# Naazware — Spec 1: Data Layer + Custom Admin CMS

**Date:** 2026-09-19
**Status:** Approved (design), pending implementation plan
**Scope:** Replace Sanity CMS with a MongoDB-backed data layer and a custom, polished admin panel. Keep the existing public website design running throughout on the new data. The public visual redesign is a **separate spec (Spec 2)** and is out of scope here.

---

## 1. Context & Goals

The site is a Next.js 14 (App Router) + React 18 + TypeScript + Tailwind project, currently served by Sanity (`projectId le2s...`, dataset `production`) with a local-data fallback in `lib/content.ts`. Sanity content is illustrative/seeded, not real production content, so it will be **reseeded fresh** into MongoDB rather than carefully exported.

**Goal:** own the CMS end to end — MongoDB Atlas for data, Cloudflare R2 for media, Resend for email, Render for hosting — with an admin panel that feels like a modern SaaS product, not a traditional CMS. Keep architecture lean; complexity belongs in the experience, not the infrastructure.

**Non-goals (this spec):** public visual redesign (3D/glass/motion), multi-user/roles, enterprise CMS features.

### Confirmed decisions
- **R2:** user provisions bucket + API tokens; we build against the R2 S3-compatible API.
- **Migration:** content is illustrative → reseed fresh into MongoDB; decommission Sanity (no fragile export).
- **Auth:** single admin now; schema extensible to multi-user/roles later without rewrite.
- **Hosting:** move to Render.

---

## 2. Architecture forks (decided)

| Fork | Choice | Why |
|---|---|---|
| Mongo access | **Mongoose** | Schema + validation + hooks + TS in one place; matches "clean model structure". |
| Auth | **Auth.js (next-auth v5), Credentials provider + Mongo adapter** | Session cookies, CSRF built in, cheap, extensible to roles. Passwords hashed with argon2 (`@node-rs/argon2`) or bcrypt. |
| Journal editor | **Tiptap** | Headless, clean "modern writing app" UX; stores JSON, rendered to React/HTML on public side. |

Rejected: native driver (hand-rolled validation), Prisma-Mongo (weak Mongo support), hand-rolled auth (owns every edge case), Clerk/Auth0 (cost), Lexical (heavier integration). Recorded as ADRs.

---

## 3. Repo-as-source-of-truth system

Long-running-project requirement: the repository, not chat history, is the source of truth. A new session can read these, verify against code, and continue.

```
docs/
  PROJECT.md          # what this is, stack, how to run — entry point
  ROADMAP.md          # phases + status (done/partial/pending) + dependencies
  HANDOVER.md         # current session state: done / tested / broken / next step
  decisions/          # ADRs, one file per decision (0001-mongodb.md, ...)
  ISSUES.md           # known issues tiered: critical / important / minor / future
  ENV.md              # env var NAMES + purpose only — never secrets
```

**Session start procedure** (documented in PROJECT.md): read docs → identify phase/done/incomplete/known issues/decisions → verify docs against actual code (code wins on conflict) → determine safe next step.

**Session end procedure:** update ROADMAP + HANDOVER + ISSUES to reflect real state. Never mark complete what isn't implemented AND verified. Mark partial as partial, uncertain as uncertain.

Initial ADRs seeded from the forks in §2 plus: R2 for media, reseed-not-export migration, Render hosting.

---

## 4. Data models (Mongoose) — 7 collections

Mirror current Sanity types, extended per spec. No collections beyond these without justification.

- **Admin** — email, passwordHash, name, role (default `admin`, enum extensible), resetToken/resetTokenExpiry, timestamps.
- **Project** — title, slug (unique), client, industry, shortDescription (excerpt), fullDescription, challenge, solution, outcome, services[], technologies[], metrics[{label,value}], coverMedia (ref Media), gallery[] (refs Media), videoUrl, externalUrl, embedded testimonial {quote,author,role} (optional), featured (bool), order (number), status (`draft`|`published`), seo {title,description,ogImage}, timestamps.
- **Testimonial** — name (author), role, company, quote, image (ref Media), companyLogo (ref Media), featured (bool), published (bool), order, timestamps.
- **Post** — title, slug (unique), excerpt, coverMedia (ref Media), content (Tiptap JSON), author, category, tags[], status (`draft`|`published`), publishDate, seoTitle, seoDescription, ogImage (ref Media), timestamps.
- **Enquiry** — name, email, phone, company, message, source (page/path), status (`new`|`read`|`archived`), createdAt.
- **Media** — key (R2 object key), url (public), type (mime), size, width, height, alt, filename, timestamps.
- **Settings** — single document: contact info, social links, nav items, SEO defaults, misc globals.

`lib/content.ts` is rewritten to read Mongo but **keep the same exported functions** (`getProjects`, `getFeaturedProjects`, `getProject`, `getPosts`, `getPost`, `getRelatedPosts`, `getTestimonials`, slug helpers) so existing public pages keep working through the swap. Return shapes preserved as a superset; `coverUrl` resolved from Media.

---

## 5. Storage (Cloudflare R2)

`lib/storage.ts` — thin interface, one R2 driver over the S3 SDK:
`getSignedUploadUrl(filename, type)`, `put`, `delete(key)`, `publicUrl(key)`.
Large files upload directly to R2 via **signed URLs** (skip the app server). After upload the admin registers metadata → Mongo `media`. Images optimized where practical. R2 secrets server-only.

---

## 6. Auth

Auth.js Credentials + Mongo adapter. `middleware.ts` guards `/admin/*` and `/api/admin/*`. First admin seeded via `scripts/create-admin.ts` (reads email/password from env or args, argon2-hashes). Password reset via Resend (token stored on Admin, expiring). Secure httpOnly cookies, CSRF via Auth.js.

---

## 7. Admin panel

Route group `app/(admin)/admin/*`: `dashboard, projects, testimonials, journal, inbox, media, settings`. Dedicated layout; polished UI (glass surfaces, shadcn/ui, subtle motion) sharing brand tokens. Sidebar exactly: Dashboard / Content (Projects, Testimonials, Journal) / Inbox / Media / Settings.

APIs under `app/api/admin/*` as Route Handlers: every handler zod-validated, auth-gated, rate-limited. UX principles: fast, obvious, forgiving (confirm destructive, autosave drafts where practical, clear feedback), beautiful empty/loading states.

Feature specifics:
- **Projects:** list with search/filter/status/featured; edit/delete/duplicate/reorder; full editor (all fields §4), gallery, SEO.
- **Testimonials:** simple CRUD + drag-and-drop order + featured/published.
- **Journal:** Tiptap editor, distraction-free; all fields §4.
- **Inbox:** enquiries list; mark read/unread, archive, delete, reply via email (Resend), copy email, search/filter by status.
- **Media:** upload (signed URL), preview, search, delete, copy URL, reuse, file details.
- **Settings:** contact, socials, nav, SEO defaults.

---

## 8. Contact flow & Sanity decommission

Contact form → `/api/contact` → zod validation + honeypot + rate limit → save `Enquiry` to Mongo → Resend notification → success state. (Current route already does most of this against Sanity; rewire to Mongo.)

**Decommission gate:** only after the Mongo data layer is verified serving public pages AND enquiries save to Mongo, remove `sanity/`, `app/studio`, `next-sanity`, `@sanity/*`, and dead `styled-components`. Not deleted before the replacement is proven (no functionality lost).

---

## 9. Testing strategy

- **Unit (Vitest):** model validation, storage interface, auth helpers.
- **API:** route handlers — happy path, failure, auth-denied.
- **E2E smoke (Playwright, minimal):** contact submit → enquiry appears; admin login; create project → appears on public site.
- **Per-phase gate:** `next build` + `tsc --noEmit` + `next lint` + relevant tests green before a phase is marked done. No meaningless coverage-padding tests.

---

## 10. Phases (→ ROADMAP.md)

Each phase small enough to implement and verify; done = acceptance criteria met AND verified, not "code exists".

0. **Docs scaffold + ADRs** — create docs system §3, seed ADRs.
1. **Models + `lib/content.ts` swap** — Mongoose models; public site reads Mongo; reseed script. Gate: public pages render from Mongo.
2. **R2 storage + Media model** — storage interface + R2 driver + signed uploads.
3. **Auth + admin shell** — Auth.js, middleware, admin layout, dashboard skeleton, create-admin script.
4. **Projects management.**
5. **Testimonials management.**
6. **Journal management (Tiptap).**
7. **Inbox + contact rewire to Mongo.**
8. **Settings.**
9. **Sanity removal** (gate §8).
10. **Render deployment.**

Then **Spec 2: public redesign** (separate brainstorm).

---

## 11. Environment (→ ENV.md, names only)

Existing: `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `CONTACT_NOTIFICATION_TO`, `RESEND_FROM`.
New: `MONGODB_URI`, `AUTH_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`, `ADMIN_EMAIL`/`ADMIN_PASSWORD` (bootstrap only).
Removed after §9: all `NEXT_PUBLIC_SANITY_*`, `SANITY_API_WRITE_TOKEN`.

---

## 12. Risks

- R2 keys not yet provisioned → Phase 2 blocks until user provides them (Phase 1 unaffected).
- Public pages currently depend on Sanity image URL helper → replace with Media URL resolution in the `lib/content.ts` swap; verify all pages before decommission.
- Render env parity with local — documented in ENV.md.
- Tiptap JSON rendering on public side — pin a JSON→React renderer; test in Phase 6 even though public consumption is light until Spec 2.
