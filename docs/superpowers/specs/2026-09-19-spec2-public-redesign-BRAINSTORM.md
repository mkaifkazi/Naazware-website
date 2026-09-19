# Spec 2 — Public Website Redesign (BRAINSTORM IN PROGRESS)

> **Status: brainstorm paused mid-flow.** Decisions below are LOCKED with the user.
> Design sections were NOT yet presented/approved. Resume by presenting the design
> sections (see "Resume here"), then write the final spec, then writing-plans.
> Follow the `superpowers:brainstorming` skill from the "Present design sections" step.

**Started:** 2026-09-19 (after Spec 1 CMS P0–P10 repo prep complete).

## Locked decisions (from Q&A)

1. **Drivers:** (A) visual/brand refresh **+** (B) conversion/positioning. IA and tech mostly stay, but see #4.
2. **Buyer:** SMBs / local businesses — non-technical, value trust + clear ROI.
3. **Primary conversion goal:** contact-form **enquiry** + **book a call** (call handled in-form, see #7).
4. **Aesthetic:** flip to **light-first** (bright, clean, approachable, "agency" not cold "studio").
   Site already ships light + dark themes (toggle stays) — make **light the DEFAULT** (currently defaults dark).
5. **Scope:** **Full** — restructure the home page, **rewrite core messaging** (hero, offer, proof, CTAs),
   and restyle **every** public page. Claude drafts SMB-focused copy; user edits.
6. **Proof reality:** only **Ripple (Shritica Joshi)** is a real client; all other projects/testimonials are
   illustrative. **User's decision (C): keep the work/portfolio section as-is and populate it with real best
   work via the CMS.** Claude will NOT fabricate proof; the portfolio structure stays, content is the user's.
7. **"Book a call": form-only (B).** Add a "prefer a call?" option to the contact form (+ phone / preferred
   time). Small CMS change: extend Enquiry model + contact schema/route + admin inbox display. No scheduler dep.
8. **Motion/experience ambition:** user wants **ADVANCED, feature-rich, animation-heavy, delightful** — a joy
   to explore, lots to see/interact with. NOT restrained. Reference: **https://lusion.co/** (WebGL hero,
   ribbon/fluid backgrounds, GSAP scroll-storytelling, custom cursor, text/card reveal animations).
   Wants **cursor-driven effects, scroll-storytelling, interactivity** — BUT **fast + user-friendly**
   (explicitly dislikes how such sites load slow / frustrate users). This tension is the core architecture problem.
9. **Chosen approach: #2 "Hybrid fast-immersive"** (recommended + accepted):
   - ONE signature WebGL moment (hero fluid/ribbon), lazy-loaded AFTER an instant static first paint.
   - Everything else GPU-cheap: **GSAP ScrollTrigger** (scroll-storytelling), **Framer Motion** (element/text/
     card reveals), **custom magnetic cursor**, **Lenis** smooth-scroll (replaces heavy locomotive-scroll).
   - WebGL via **React Three Fiber + drei**, dynamically imported (`next/dynamic`, `ssr:false`) so it never
     blocks load. Strict perf budget. Full mobile + `prefers-reduced-motion` fallbacks (static poster for hero).
   - Rejected: #1 full-WebGL (too slow/fragile — the thing user dislikes); #3 no-WebGL (not lusion-caliber).
10. **Brand basics (tentative, confirm in design review):** keep **BrandMark logo** + **Inter** (body);
    Claude to propose a more characterful **display typeface** for the light-first premium look (user can veto).

## Tech direction implied (to detail in spec)

- Stay on Next 14 App Router + Tailwind (already primary). Public content already Mongo-backed (Spec 1).
- Add: GSAP (+ScrollTrigger), Framer Motion, Lenis, @react-three/fiber + @react-three/drei, custom cursor.
- Remove/replace: **locomotive-scroll → Lenis**. Evaluate dropping **styled-components** (Tailwind covers it).
- Performance is a first-class requirement: instant SSR shell, lazy WebGL, code-split heavy motion, image
  optimization, perf budget (define LCP/TBT targets in spec), mobile disables WebGL, reduced-motion path.

## Still OPEN (decide during design sections next session)

- Home page narrative + section order (hero → problem → services → proof/Ripple → process → CTA?).
- Full IA / page-by-page structure (home, work, services, about, blog, contact, legal) — what changes on each.
- Light-first color palette + accent + the display typeface choice.
- Exact signature interactions per section (hero WebGL concept, cursor behavior, scroll-story beats, card hovers).
- Contact form field additions (call option, phone, preferred time) + Enquiry model/schema/route/admin changes.
- Perf budget numbers + accessibility acceptance criteria.
- Implementation phasing (likely: design system/tokens → motion foundation (Lenis/cursor/GSAP) → home →
  services/contact conversion path → remaining pages → perf/a11y pass).

## ▶ Resume here (next session)

1. `git checkout feat/custom-cms` (Spec 2 work continues here; = master at Spec 1 tip).
2. Re-enter `superpowers:brainstorming` at **"Present design sections"** (design NOT yet approved — HARD GATE:
   no code until a design is presented AND user-approved).
3. Offer the **visual companion** again — user deferred it to this session; the design sections (home layout,
   hero, motion language) are exactly what it's for. Offer as its own message; open with `--open` on accept.
4. Present design in sections, approval after each: (1) positioning & home narrative/copy, (2) IA & page-by-page,
   (3) light-first visual system (palette/type/motion language), (4) fast-immersive animation/interaction
   architecture + perf budget, (5) CMS touchpoints (contact call-option), (6) tech stack changes + phasing,
   (7) testing/perf/a11y.
5. On approval → write final spec to `docs/superpowers/specs/2026-09-19-spec2-public-redesign-design.md`,
   self-review, user review, then `superpowers:writing-plans`.

**Note:** Spec 1 (CMS) is done + pushed to origin/master. Remaining Spec 1 item = P10 live deploy operator
runbook (Render) — independent of Spec 2. Fresh AUTH_SECRET generated this session (in chat) for that deploy.
