# Handover — current state

## ▶ RESUME HERE (new session)
1. **On branch `master`** — everything below is merged + **pushed to origin/master** (origin up to date). `git checkout master && git pull`.
2. Read this file + `docs/ROADMAP.md` + `docs/PROJECT.md`. Skim `docs/decisions/`.
3. Verify gate still green: `npm run test` (113) · `npm run type-check` · `npm run lint` · `npm run build`.
4. `.env.local` already holds all secrets on this machine (MONGODB_URI direct string, R2_*, AUTH_SECRET, ADMIN_*). See "env note" below.
5. **Spec 1 CMS + Spec 2 redesign + Spec 3 visual/motion ALL DONE + pushed.** Post-Spec-3 polish also done + pushed:
   silk **seam fix** (one continuous fixed backdrop; PageHeader bottom-fade removed) + **cursor** (dot tracks 1:1, no lag)
   + **copy repositioned** to custom-software/quality (dropped all sales/customer-increase promises). See blocks below.
   **Next task = P10 live deploy runbook** (`docs/superpowers/plans/2026-09-19-phase-10-render-deploy.md` Tasks 3–5; ⚠ rotate all shared creds).
   ⚠ **Still owed (real GPU browser):** full-site walk light+dark + reduced-motion + mobile; real Lighthouse-mobile (perf≥90/LCP/CLS).
   (Silk seams + header + services/about pages already verified via PROD screenshots light+dark this session — look good.)
6. Admin login for live testing: kaifkazi40@gmail.com / `Naazware@2026` (dummy).
7. **Dev/verify gotchas (hit repeatedly):**
   - NEVER run `npm run build` while `npm run dev` is live — build corrupts dev's `.next` → 500s
     (`Cannot find module ./vendor-chunks/*.js`). After any build with dev running: kill node on :3000, `rm -rf .next`, rebuild.
   - Headless Edge renders **WebGL blank**, but the site now uses a **CSS silk fallback** (WebGL only on home hero), so
     `npm run build && npm run start` + puppeteer-core screenshots DO show the styled silk/accents. `npm run dev` headless
     came back UNSTYLED (Tailwind not applied) — use PROD (`npm start`) for reliable screenshots. Edge at
     `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`. Install puppeteer-core temporarily, run with
     `NODE_PATH="$(pwd)/node_modules"`, then `npm rm puppeteer-core` + `git checkout package-lock.json`.
   - Kill port 3000: `powershell -Command "Get-NetTCPConnection -LocalPort 3000 -State Listen | %{ taskkill /F /PID $_.OwningProcess }"`.
   - R3F pinned to v8 (`@react-three/fiber@^8`, drei@^9) — v9 requires React 19; project is React 18.

**Last updated:** 2026-09-21
**Branch:** master (all Spec 1/2/3 + polish merged FF + pushed to origin/master).
**Current phase:** Spec 1 CMS + Spec 2 redesign + Spec 3 visual/motion + polish ALL DONE + pushed. Only P10 live deploy remains.

### Post-Spec-3 polish (2026-09-21, on master, pushed) — DONE
- **Silk seam fix** — root cause: per-page `SilkBackground` was `absolute` inside bounded `overflow-hidden` wrappers →
  hard rectangular seams vs opaque bgs. Fix: **one continuous fixed backdrop** (`SilkBackground global` + `Accents global`,
  `fixed -z-10`) mounted once in `app/(site)/layout.tsx`; removed ALL per-page silk/accent wrappers; `SilkFallback` now two
  counter-drifting screen-blended sheets (undulates); softened section bands (`bg-ink-950`→`/70`) so silk shows through.
  Global silk uses CSS fallback (`allowWebGL={false}`) → no conflict w/ home hero WebGL, renders on mobile.
- **PageHeader** — removed `to-ink-900` bottom-fade (read as a separator over the continuous silk) + bumped header bottom padding.
- **Cursor** (`components/MagneticCursor.tsx`) — dot now tracks pointer 1:1; removed the 0.18 follow-easing + `data-magnetic`
  positional pull (`is-magnetic` CSS now dead but harmless). Normal speed, no lag.
- **Copy** — repositioned OFF sales/customer-increase (user: we sell custom software + quality, NOT more customers). Hero
  `Websites & software that win you customers.` → **`Custom software, crafted to fit.`**; problem `best salesperson` →
  `Off-the-shelf rarely fits.`; services/proof/cta headings + all 6 `services-data` short descriptions/bullets reframed
  craft/quality; removed "40% higher conversion" claim. Files: `lib/home-content.ts`, `lib/services-data.ts`. Copy is
  Claude-drafted — user still owns final wording.
- **Gate:** GREEN — 113 tests · type-check · lint · build. Home First Load 161–168kB.

### Spec 3 — site-wide silk backdrop + archetype motion — ALL DONE (merged to master)
Design: `docs/superpowers/specs/2026-09-20-sitewide-visual-motion-design.md`. Decisions: recurring silk backdrop motif;
ONE multi-hue gradient everywhere (teal→sky→violet, `--silk-1/2/3`); WebGL-when-capable + CSS-mesh fallback; premium
studio kept + tasteful accents (blobs/thin shapes), NO confetti; signature-move-per-section-type.
- **VP1 tokens** — `--silk-1/2/3` (both themes) + Tailwind `silk.1/2/3`; brand teal untouched; WCAG AA verified numeric. Plan `.../plans/2026-09-20-vp1-palette-tokens.md`.
- **VP2 SilkBackground** — `lib/silk.ts` (pure composition helpers, tested) + `SilkFallback` (CSS mesh + 48s drift) + `SilkCanvas` (R3F shader plane, reads `--silk-*`) + gated `SilkBackground` loader (`allowWebGL` = single-canvas rule; lazy ssr:false). Plan `.../vp2-silk-background.md`.
- **VP3 motion primitives** — `components/motion/`: HeadingReveal, CardGridReveal, StatReveal(count-up), QuoteReveal, CtaReveal, ProseReveal, MediaReveal(clip wipe), AccordionReveal + pure `lib/motion-anim.ts`. All reduced-motion-safe, whileInView-once. Plan `.../vp3-motion-primitives.md`.
- **VP4 accents** — `lib/accents.ts` (preset→layout, tested) + `components/visual/Accents.tsx` (blurred silk blobs + thin SVG rings/arcs, CSS float + framer scroll-parallax; nested layers avoid transform conflict). Plan `.../vp4-decorative-layer.md`.
- **VP5 rollout** — silk + accents + archetypes wired into EVERY `(site)` page (home retrofit w/ `allowWebGL={false}`; about/services×2/work×2/blog×2/contact/legal×2). Plan `.../vp5-page-rollout.md`.
- **VP6 perf** — `LazyMotion` + `m` (root `MotionProvider`) shrank framer bundle: home First Load **191→168kB**, all `(site)` routes <180 (budget). three stays code-split. CLS-safe (transform/opacity only, images aspect-ratio'd). Plan `.../vp6-perf-pass.md`.
- ⚠ **OWED (user, real GPU browser):** full-site walk light+dark + reduced-motion + mobile(<768 CSS fallback, no 2nd WebGL context); real Lighthouse-mobile (perf≥90/LCP<2.5s/CLS<0.1). Headless Edge renders WebGL blank — can't verify here.
- **Gate:** GREEN — 113 tests · type-check · lint · build.
- **P1 DONE** (light default, Fraunces serif, tracking polish). Plan: `.../plans/2026-09-19-spec2-p1-design-system-light-default.md`.
- **P2 DONE** (Lenis smooth-scroll replacing locomotive, gsap+ScrollTrigger, framer-motion, magnetic cursor, `lib/motion.ts` pure helpers; dropped styled-components + stale .netlify). Plan: `.../plans/2026-09-19-spec2-p2-motion-foundation.md`. Gate green 76 tests.
- **P3 DONE** (home rebuilt to 6-section SMB narrative: Hero → Problem → Services → Proof[work+testimonials] → Process → CTA; `lib/home-content.ts` SMB copy; `ProblemSection`; GSAP hero parallax + scroll count-up metrics; static poster hero w/ `HERO-POSTER-SEAM` marker for P4; `data-magnetic` on CTAs). Plan: `.../plans/2026-09-19-spec2-p3-home-rebuild.md`. Gate green 82 tests.
- **P4 DONE** (WebGL hero: R3F v8 pinned for React 18 [v9 needs React 19]; `HeroCanvas` pointer-reactive distorted teal blob via drei MeshDistortMaterial+Float; `HeroWebGL` loader = `next/dynamic ssr:false` + `shouldRenderWebGL` gate [off on reduced-motion/coarse/small<768/save-data/no-webgl]; fades in over static poster; three/R3F code-split — home First Load JS 143kB, three NOT in shared bundle). Plan: `.../plans/2026-09-19-spec2-p4-webgl-hero.md`. Gate green 87 tests.
- **P3.5 LIGHT REDESIGN DONE** (user feedback: light-first was flat/sterile — was a token inversion of a dark-designed site). Built real light system: warm paper + AA text + elevation shadow tokens; `.card-surface` solid+soft-shadow (replaced washed-out translucent cards across Problem/Services/Proof/testimonials); hero aura wash + masked grid (depth not void); cursor reveals after first move. Dark theme preserved. Commit `86ce002`.
- **HERO 3D ITERATED (user-driven) → final = Windows-screensaver "shooting-star" comets.** `components/home/HeroCanvas.tsx`:
  multicolour comets (teal/amber/sky/magenta/violet) sampled backward-in-time along Lissajous paths → tapered
  tube (thick head → thin tail) built on TubeGeometry topology; amplitudes exceed viewport so heads fly off all
  edges + sweep back; short trail keeps comet shape readable; pointer-tilts the field; hero content is `z-10` so
  text stays readable over the ribbons. Motion-safe gate + code-split unchanged (home First Load 143kB). Latest
  commit `c6368c0` (+ wider-travel tweak committed after). Journey: solid blob → torus-knot → tube-field →
  comets (kept). Tuning levers in the file: `COMETS[]` (color/amp/freq/speed/headRadius), `SAMPLES`/`DT` (trail len).
- **P5 DONE** (conversion path). Plan: `.../plans/2026-09-20-spec2-p5-conversion-path.md`. 7 commits:
  Enquiry model+schema gain `prefersCall`/`phone`/`preferredTime` (zod `.refine`: phone required when call ticked;
  `EnquiryInput` = `z.input` so fields optional for callers); `enquiries-service` persists + lists them
  (`AdminEnquiryRow` widened); `/api/contact` email includes call block; `ContactForm` progressive "I'd prefer a call"
  disclosure (reveals phone + preferred-time) + client refine mirror + reassurance copy = **"We reply within 1 business day."**;
  admin inbox shows call badge + tel-link phone + preferred time (`EnquiryDetail`) + table chip (`EnquiriesTable`);
  contact page reworded to 1-business-day + panel points at in-form call option; all 6 services reframed outcome-led
  in `lib/services-data.ts` (shortDescription+bullets benefit-first; technologies/keywords kept). Gate green 93 tests.
- **NEXT = P10 live deploy** (repo prep done; runbook Tasks 3–5 remain; ⚠ rotate all shared creds).
⚠ **Owed manual BROWSER checks** (real click-through, LIGHT default + DARK toggle):
   - P5: tick "I'd prefer a call" reveals phone+time; call-submit with empty phone shows error; plain submit still works;
     notification email includes call lines; inbox chip + detail badge appear; plain enquiry shows neither (BC path).
   - Earlier owed: P1 pages/contrast; P2 cursor/Lenis/reduced-motion+touch fallbacks; P3 home narrative+parallax+count-up;
     hero comets on real GPU + WebGL-off fallback (mobile/reduced-motion → static poster).
📝 Copy is Claude-drafted SMB voice in `lib/home-content.ts` + `lib/services-data.ts` + contact page — user to edit/approve.
⚠ **local master AHEAD of origin/master — not pushed** (`git push origin master` when ready).
**Gate:** GREEN — 93 tests · type-check · lint · build.

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
- P5 Testimonials management:
  - Backend: `lib/testimonials-service.ts` (CRUD/list/reorder), `lib/schemas/testimonial.ts`,
    API routes (`/api/admin/testimonials`, `/[id]`, `/reorder`). Auth-gated + zod + rate-limited.
  - UI: `app/(admin)/admin/testimonials` (list, new, [id]) + `components/admin`
    (TestimonialsTable with move up/down reorder, TestimonialEditor, portrait + companyLogo via MediaPicker).
  - Reorder is move-up/down buttons (no new dep); API takes full ordered id list, so drag-and-drop can drop in later.
  - Public reflection unchanged: `lib/content.ts` `getTestimonials()` already reads published, ordered.
  - **Verified LIVE via HTTP** (real session cookie): unauth 401; list 200 (3 seeded from Mongo);
    create ×2 → 201; empty-name validation → 400; reorder → order flips; delete ×2 → 200, list back to 3.
- P6 Journal management (Tiptap):
  - Backend: `lib/posts-service.ts` (CRUD/slug/list + JSON→HTML serialize), `lib/schemas/post.ts`,
    `lib/tiptap-extensions.ts` (shared StarterKit[H2/H3]+Link+Image), API routes (`/api/admin/posts`, `/[id]`).
    Post model gained `contentHtml`. Tiptap v2 deps added.
  - UI: `app/(admin)/admin/journal` (list, new, [id]) + `components/admin`
    (RichTextEditor = Tiptap + core toolbar + image via MediaPicker, PostsTable, PostEditor).
  - Body = Tiptap JSON (source of truth) in `content`; `contentHtml` derived server-side (@tiptap/html,
    safe — regenerated from constrained schema, not client HTML). Public `/blog/[slug]` renders contentHtml,
    `renderMarkdown` fallback for seeded/local posts. Stale Sanity `scripts/seed-journal.ts` deleted.
  - **Verified LIVE via HTTP** (real session cookie): unauth 401; create rich post → 201;
    stored contentHtml = `<p>Bold body here.</p>`; public /blog/hello-tiptap renders it; validation 400; delete 200.
- P7 Inbox + contact→Mongo:
  - Backend: `lib/models/Enquiry.ts`, `lib/enquiries-service.ts` (create/list/get/setStatus/delete),
    `lib/schemas/enquiry.ts`, admin API (`/api/admin/enquiries`, `/[id]` GET/PATCH/DELETE).
  - Public `/api/contact` rewired: Mongo `createEnquiry` + Resend email; Sanity write removed;
    IP-keyed rate limit; returns 500 only if BOTH DB save and email fail (no silent lead loss).
  - UI: `app/(admin)/admin/inbox` (list + [id] detail) + `components/admin`
    (EnquiriesTable, EnquiryDetail — mark read/unread/archived, delete). Detail auto-marks new→read on open.
    `apiSend` widened to allow PATCH.
  - **Verified LIVE via HTTP**: contact valid → 200 (stored); honeypot → 200 not stored; invalid → 400;
    unauth admin list → 401; auth list shows enquiry (status new); PATCH archived; DELETE 200.
- P8 Site settings:
  - Backend: `lib/models/Settings.ts` (singleton), `lib/settings-service.ts` (getSettingsDoc/updateSettings/
    getSettings — Mongo merged over `lib/site.ts` defaults; phoneHref derived), `lib/schemas/settings.ts`,
    admin API (`/api/admin/settings` GET effective / PUT). getSettings is the public read (server consumers).
  - UI: `app/(admin)/admin/settings` + `components/admin/SettingsForm.tsx` (brand, contact, socials).
  - Wired SERVER consumers to getSettings(): Footer (socials/email/phone/location), contact/privacy/terms
    pages (email/phone), `app/layout.tsx` Organization + WebSite JSON-LD (via seo.ts fns now taking a settings arg).
  - Scope boundary (intentional): client Header/ContactForm + seo.ts page-metadata + sitemap/robots stay on
    static `site.ts` (structural fields only; avoids async cascade through client tree + per-page metadata).
  - **Verified LIVE via HTTP**: unauth 401; GET defaults; PUT override → footer `/` + org JSON-LD reflect
    new email + linkedin; invalid email → 400; empty override → falls back to site.ts defaults. Overrides reset after.
- **P4 verified LIVE via HTTP** (dev server): admin login (session role=admin); create project →
  appears in admin list AND on public /work; duplicate; delete; unauth → 401; /admin → 307 login.
- Gate GREEN: 33 tests · type-check · lint · build.

## Tested
- 60 unit/integration tests. Live: auth + projects/testimonials/journal/enquiries/settings CRUD + contact→Mongo + settings public reflection + R2 round-trip.
- Not clicked in a real browser, but every API path exercised over HTTP with a real session cookie.

## Broken / blockers
- None. Admin: kaifkazi40@gmail.com / DUMMY `Naazware@2026` (change via `npm run create-admin`).

## IMPORTANT env note (local vs prod)
- LOCAL `.env.local` MONGODB_URI is a DIRECT (non-SRV) string — this machine's c-ares resolver
  can't do the mongodb+srv SRV lookup (IPv6 link-local gateway refuses). Plain mongodb:// uses the
  OS resolver and works. **On Render (prod) use the mongodb+srv URI** (commented in .env.local).
- DNS_SERVERS is a secondary local workaround (helps c-ares in build/scripts; not needed with the direct URI).

## Next step
- P10 live deploy: repo prep done (render.yaml blueprint, Node 20 pin, Netlify removed). Remaining is the
  operator runbook (plan Tasks 3–5): push to GitHub, Render Blueprint, set secrets, Atlas network access,
  prod admin, smoke test, and rotate all shared credentials. All feature phases (P0–P9) complete + verified.

## Notes
- Sanity fully removed at P9 (deps, /studio, sanity/, configs, legacy seeds, envs). Public content falls back to local *-data.ts when Mongo is empty/unset.
- ⚠ Atlas + R2 creds shared in chat — rotate before/after go-live.
- next.config.js externalizes @node-rs/argon2 + mongoose (native/server libs) so the bundle builds.
- Two stale dev servers were cleaned up this session; if port 3000 misbehaves, check for orphaned node.
