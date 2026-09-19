# Spec 2 — Public Website Redesign (DESIGN — APPROVED)

**Date:** 2026-09-19
**Branch:** `feat/custom-cms`
**Status:** Design approved by user across all 7 sections. Ready for `writing-plans`.
**Predecessor:** Spec 1 (custom CMS, P0–P10) complete + pushed to `origin/master`.
**Brainstorm source:** `docs/superpowers/specs/2026-09-19-spec2-public-redesign-BRAINSTORM.md` (locked Q&A decisions).

## Goal

Redesign the public Naazware website: visual/brand refresh **and** conversion/positioning
uplift. Flip to a **light-first** "approachable agency" aesthetic (dark toggle stays), rewrite
core messaging for an **SMB / local-business buyer**, and add a **fast-immersive** motion layer
(lusion-caliber delight without slow loads). Routes and the Mongo-backed content model stay; the
only CMS change is a "prefer a call?" contact option.

Primary conversion goal: contact-form **enquiry** + **book-a-call** (handled in-form, no scheduler).

## Non-goals

- No new routes/pages; no removal of existing pages.
- No fabricated proof — portfolio/testimonials stay CMS-driven; user populates real work.
  Only real client = Ripple Academy (Shritica Joshi).
- No scheduler/calendar integration (call handled via form fields only).
- No CMS/admin rework beyond the enquiry call-option fields.

## Section 1 — Positioning & Home Narrative

**Positioning statement:** *Naazware is the digital studio that turns local businesses into
online leaders — websites, apps & branding that bring in more customers, without the agency
price tag or the tech headache.*

**Home page section order (top → bottom):**
1. **Hero** — signature WebGL moment. Eyebrow "Digital studio for growing businesses";
   headline "Websites & software that win you customers."; sub on more enquiries / looking the
   part / staying ahead locally; CTAs "Get a free quote" (primary) + "See our work" (secondary).
2. **Problem / empathy** — "Your website should be your best salesperson — most aren't."
3. **Services** — outcome-led: Websites · Web apps & software · Branding/identity · (ongoing care).
4. **Proof** — Ripple featured case (real) → portfolio grid (CMS) → testimonials.
5. **Process** — Talk → Plan → Build → Launch & grow (kills complexity fear).
6. **CTA band** — "Ready to grow your business online?" → contact + "prefer a call?".

All copy is Claude-drafted, SMB-focused; user edits. Approved: positioning + this order.

## Section 2 — IA & Page-by-Page

Nav unchanged (Work · Services · About · Journal · Contact · [Get a quote] · theme toggle).
Route `/blog` kept, labeled **"Journal"** in nav.

| Route | Change |
|---|---|
| `/` (home) | Full rebuild per Section 1 (6-section narrative, WebGL hero). |
| `/work` | Portfolio grid restyle (light-first, card hover/reveal). CMS-populated; Ripple first. |
| `/work/[slug]` | Case-study restyle: bigger visuals, scroll-reveal, problem→solution→result, end CTA. |
| `/services` | Reframe outcome-led (not tech list); cards + "who it's for" + CTA. |
| `/services/[slug]` | Detail restyle matching case-study rhythm; CTA to contact. |
| `/about` | Trust-building rewrite + light-first restyle + reveal motion. |
| `/blog` (Journal) | Restyle list + article; lean, no WebGL, reading-focused. |
| `/contact` | Conversion centerpiece: rewrite intro, add call-option (Section 5), reassurance copy. |
| `/privacy`, `/terms` | Restyle only (light-first typography); content unchanged. |
| Footer | Light-first restyle; keep CMS-driven contact/socials; add mini-CTA. |

## Section 3 — Light-First Visual System

Existing token architecture stays (`ink`/`paper`/`accent` CSS vars per theme in
`styles/globals.css`, Tailwind maps in `tailwind.config.ts`).

- **Default theme flips to light** (currently defaults dark). Dark toggle remains.
- **Palette:** light base `#FAFAF7`, card `#FFFFFF`, ink text `#0B0B0C`, accent teal `#2DD4BF`,
  accent-text deep teal `#0F766E`. **Teal-only** (no second accent — user decision).
- **Display typeface:** switch to a **modern serif display** (Fraunces or Instrument Serif),
  self-hosted via `next/font`. Body stays **Inter**. (User picked serif direction — face
  finalized in implementation P1; either is acceptable.)
- **Motion language:** calm + purposeful — soft fade-up reveals, Lenis smooth scroll, magnetic
  cursor on interactive elements, one WebGL hero, gentle card hovers, all eased `out-expo`.
  Fast first, delight second.

## Section 4 — Fast-Immersive Animation Architecture

Approach #2 "Hybrid fast-immersive" (locked). Perf is a hard gate.

**Load order:**
1. Instant SSR shell — real hero text + CTA + static poster image; usable with zero JS.
2. Lenis smooth-scroll + magnetic cursor hydrate (tiny).
3. GSAP ScrollTrigger + Framer Motion reveals wire up as sections enter.
4. WebGL hero (`@react-three/fiber`) dynamically imported `ssr:false`, lazy; fades in over the
   poster once ready. Never blocks load.

**Motion per zone:**
- **Hero** — WebGL fluid/ribbon reacting to cursor; poster fallback on mobile / reduced-motion / slow.
- **Problem/Services/Proof** — GSAP scroll-storytelling: pinned beats, staggered card reveals,
  number count-ups; GPU-cheap transforms only.
- **Global** — Lenis smooth scroll, magnetic cursor, fade-up reveals, eased hovers.
- **Journal / legal** — minimal: fade-ups only, no WebGL, no pinning.

**Perf budget (hard acceptance gates, mobile mid-tier):**
- LCP < 2.5s · TBT < 200ms · CLS < 0.1 · Lighthouse perf ≥ 90 (mobile).
- Initial JS (excluding WebGL chunk) < ~180KB gzipped.

**Guardrails:** WebGL is a separate lazy chunk (never initial bundle); mobile disables WebGL by
default; `prefers-reduced-motion` → static everywhere; only transform/opacity animated;
images via `next/image` (AVIF/WebP, sized).

**Fallback ladder:** full (desktop, capable) → no-WebGL (mobile / weak GPU / save-data) →
reduced-motion (static poster, instant reveals, no smooth-scroll) → no-JS (SSR shell, readable,
form works).

## Section 5 — CMS Touchpoint: "Prefer a Call?"

Form-only, no scheduler. Extends the existing Enquiry pipeline end-to-end.

**New contact fields:** a "I'd prefer a call" checkbox that progressively reveals **phone** and
**preferred time** ("best time to reach you"). Reassurance copy: "We reply within 1 business day."

**Stack changes:**
- **Model** `lib/models/Enquiry.ts` — add `prefersCall: Boolean`, `phone: String`, `preferredTime: String`.
- **Schema** `lib/schemas/enquiry.ts` — add same fields; zod `.refine`: if `prefersCall` true →
  `phone` required; otherwise optional/empty.
- **Route** `/api/contact` — pass new fields to `createEnquiry`; email notification includes call
  preference + phone + preferred time.
- **Client form** — checkbox reveals phone + preferred-time (progressive disclosure); client zod
  mirrors server.
- **Admin inbox** — `EnquiryDetail` shows a "wants a call" badge + phone + preferred time;
  `EnquiriesTable` hints call requests.

**Backwards compatible:** all new fields optional in DB; existing seeded enquiries unaffected;
no migration.

## Section 6 — Tech Stack Changes & Phasing

Next 14 App Router + Tailwind stay. Content already Mongo-backed (Spec 1).

**Add:** `gsap` (+ScrollTrigger), `framer-motion`, `lenis`, `@react-three/fiber`,
`@react-three/drei`, `three`; self-hosted display font (Fraunces/Instrument via `next/font`).

**Remove:** `locomotive-scroll` (→ Lenis; only `components/SmoothScroll.tsx` uses it);
`styled-components` (unused in source — present only in stale `.netlify` build artifacts); delete
stale `.netlify/` artifacts.

**Phasing (each phase ships green: 60 tests + type-check + lint + build):**
- **P1 · Design system + light default** — flip default theme to light, wire serif display via
  next/font, refine tokens, restyle primitives. Legacy look still works.
- **P2 · Motion foundation** — Lenis (replace locomotive), magnetic cursor, GSAP + Framer setup,
  reduced-motion + reveal utilities. Drop styled-components + stale `.netlify`.
- **P3 · Home rebuild** — 6-section narrative + copy, GSAP scroll-story, reveals; static poster
  hero (no WebGL yet).
- **P4 · WebGL hero** — R3F fluid/ribbon, lazy `ssr:false`, poster fallback, mobile/reduced-motion off.
- **P5 · Conversion path** — contact rewrite + call-option (model→schema→route→form→inbox),
  services reframe.
- **P6 · Remaining pages** — work grid + case study, about, journal, legal restyle.
- **P7 · Perf + a11y pass** — hit budget gates, Lighthouse, axe, cross-device, verify fallback ladder.

## Section 7 — Testing · Perf · Accessibility

**Testing:**
- Keep the gate green (existing 60 tests + type-check + lint + build) at every phase.
- New unit tests: enquiry schema call-option refine (phone required when `prefersCall`), contact
  route maps new fields, reveal/reduced-motion utility logic.
- Motion non-blocking: components render + usable with JS/WebGL disabled (SSR shell test).
- Manual: real-browser click-through per page (skipped in Spec 1 — done here).

**Performance (hard gates, mobile):** Lighthouse perf ≥ 90; LCP < 2.5s; TBT < 200ms; CLS < 0.1;
initial JS (no WebGL) < ~180KB gz. Verified via Lighthouse (throttled mobile), bundle analyzer
(WebGL in own chunk), and confirming WebGL absent on mobile / save-data.

**Accessibility:**
- WCAG 2.1 AA — contrast (deep-teal text token already sufficient on light), `focus-visible`
  rings, full keyboard nav (menus, forms, interactive).
- `prefers-reduced-motion` fully honored (no WebGL, no smooth-scroll, instant reveals).
- Cursor/magnetic effects decorative only — never the sole affordance; native focus intact.
- Forms: labels, error announcements, revealed call fields keyboard-reachable.
- axe clean on every page; semantic headings; alt text (CMS-enforced).

## Open items carried to plan

- Finalize display face (Fraunces vs Instrument Serif) in P1.
- Exact WebGL hero concept (fluid vs ribbon) prototyped in P4 against the perf budget.
- Copy is drafted by Claude per page; user edits before/after each phase.
