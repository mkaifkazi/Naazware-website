# VP5 — Page Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the VP2 silk backdrop, VP4 accents, and VP3 archetype-motion primitives into every public page, so the whole site carries the shared visual/motion language — home retrofitted, all other pages brought up from static.

**Architecture:** Mechanical, recipe-driven. Each page gets: a `SilkBackground` behind its content (home passes `allowWebGL={false}` — its hero already owns the one WebGL context), `Accents` on select sections, and its `Reveal`/plain sections swapped to the matching archetype primitive from VP3. No new components; no content/copy changes.

**Tech Stack:** Next.js 14, the VP1–VP4 components, Tailwind.

## Global Constraints

- **Single WebGL canvas** — only the home hero runs WebGL. Every `SilkBackground` on the **home page** passes `allowWebGL={false}`. All other pages may use the default (`true`). (Spec §4.1)
- **Content unchanged** — VP5 only wraps/swaps for motion + backdrop. No copy edits, no data changes. (Spec §2 non-goals)
- **Layering** — backdrop/accents sit behind; wrap real content in `relative z-10`. Opaque section backgrounds (`bg-ink-950`, `bg-ink-900`) stay; place `Accents` inside such a section as the first child with content in `z-10`.
- **Reduced-motion / mobile** — inherited from the primitives + `SilkBackground` gate; no per-page handling needed.
- **Don't double-animate** — when swapping a card grid to `CardGridReveal`, remove the per-item `<Reveal>` wrappers (stagger now comes from the parent).
- **Gate after each task:** `npm run test` · `type-check` · `lint` · `build` green before commit.

## Swap Recipes (the actual code — referenced by every task)

**R1 — Silk backdrop wrap** (page or section):
```tsx
<div className="relative overflow-hidden">
  <SilkBackground composition={{ /* per-page */ }} allowWebGL={/* false on home */} />
  <div className="relative z-10">
    {/* existing content */}
  </div>
</div>
```

**R2 — Heading reveal** (only for plain-string headings; leave JSX/`text-gradient` titles on their existing wrapper):
```tsx
// before: <Reveal as="h2" className="C">Some string heading</Reveal>
<HeadingReveal as="h2" text="Some string heading" className="C" />
```

**R3 — Card grid stagger** (remove per-item Reveal, wrap the grid):
```tsx
// before: <div className="grid …">{items.map(i => <Reveal key delay><Card/></Reveal>)}</div>
<CardGridReveal className="grid …">
  {items.map((i) => <Card key={i.key} … />)}
</CardGridReveal>
```

**R4 — Stat count-up** (numeric metric text):
```tsx
<StatReveal to={98} suffix="%" className="…" />
```

**R5 — CTA reveal** (wrap the CTA inner content that was in a single `Reveal`):
```tsx
// before: <Reveal as="div" className="C">…</Reveal>
<CtaReveal className="C">…</CtaReveal>
```

**R6 — Prose reveal** (article/legal body: wrap the block of paragraphs):
```tsx
<ProseReveal className="space-y-…">
  <p>…</p><p>…</p>
</ProseReveal>
```

**R7 — Media reveal** (cover image / hero media on detail pages):
```tsx
<MediaReveal className="…"><Image … /></MediaReveal>
```

**R8 — Accents** (decorative layer on a section):
```tsx
<Accents preset="section" /> {/* or "cta" */}
```

Imports to add per file as used:
`import SilkBackground from '@/components/visual/SilkBackground'`
`import Accents from '@/components/visual/Accents'`
`import HeadingReveal from '@/components/motion/HeadingReveal'`
`import CardGridReveal from '@/components/motion/CardGridReveal'`
`import CtaReveal from '@/components/motion/CtaReveal'`
`import ProseReveal from '@/components/motion/ProseReveal'`
`import MediaReveal from '@/components/motion/MediaReveal'`
`import StatReveal from '@/components/motion/StatReveal'`

---

### Task 1: Home (`app/(site)/page.tsx`) retrofit

**Files:** Modify `app/(site)/page.tsx`.

- [ ] **Step 1 — Ambient silk behind mid sections.** Wrap the group from Problem through Process (the sections between the hero and the final CTA) using **R1** with `allowWebGL={false}` and `composition={{ angle: 135, intensity: 0.5 }}`. Leave the hero section untouched (it owns the WebGL comets + `hero-aura`/`grid-bg`).
- [ ] **Step 2 — Services grid → R3.** Swap the services `<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">` + per-card `<Reveal>` to `CardGridReveal` (keep the same grid classes). Cards keep their props.
- [ ] **Step 3 — Proof grids → R3.** Same swap for the featured-work grid (`md:grid-cols-2`) and the testimonials grid (`lg:grid-cols-3`).
- [ ] **Step 4 — Process grid → R3.** Same swap for the process grid (keep the `bg-ink-900` per-cell class by moving it onto the inner card `div`, since `CardGridReveal` wraps each child in a motion div — put `bg-ink-900` on the child’s own wrapper so the hairline grid still reads).
- [ ] **Step 5 — Final CTA.** Add **R8** `<Accents preset="cta" />` inside the final CTA `<section>` (already `relative overflow-hidden`) as first child; wrap its inner `Reveal` content with **R5** `CtaReveal`. Keep the existing accent blur or remove it in favour of Accents (remove to avoid double-glow).
- [ ] **Step 6 — Section headings.** Leave the hero `text-display-xl` headline on its `Reveal` (it's `hero.headline`, fine). Section headings here are plain strings inside a header `Reveal` alongside eyebrow + CTA link — leave those header `Reveal`s as-is (mixed content); the grids now carry the motion. (No R2 on home — headers are multi-element.)
- [ ] **Step 7 — Gate + commit.**
```bash
npm run type-check && npm run lint && npm run build
git add "app/(site)/page.tsx"
git commit -m "feat(rollout): home — ambient silk + staggered card grids + CTA accents (VP5)"
```

---

### Task 2: About finish + Services (list + slug)

**Files:** Modify `app/(site)/about/page.tsx`, `app/(site)/services/page.tsx`, `app/(site)/services/[slug]/page.tsx`.

- [ ] **Step 1 — About: values + steps grids → R3.** About already has SilkBackground (VP2) + Accents on Values (VP4). Swap the Values grid and the How-we-work steps grid to `CardGridReveal` (remove per-item Reveal). For steps, keep `bg-ink-900` on the child wrapper (same note as home Step 4).
- [ ] **Step 2 — About: prose + CTA.** Wrap the "Who we are" body paragraphs (`space-y-5`) with **R6** `ProseReveal`. Wrap the final CTA inner `Reveal` with **R5** `CtaReveal`; optionally add **R8** `<Accents preset="cta" />` to the CTA section (make it `relative overflow-hidden` if not already).
- [ ] **Step 3 — Services list: R1 + R3.** Read `services/page.tsx`. Wrap the page body with **R1** (`composition={{ angle: 150, offset: { x: 15, y: -10 }, intensity: 0.55 }}`, default `allowWebGL`). Swap the services card grid to `CardGridReveal`. Wrap any final CTA with `CtaReveal` + `Accents preset="cta"`.
- [ ] **Step 4 — Services [slug]: R1 + R6 + R3.** Read `services/[slug]/page.tsx`. Wrap body with **R1** (`composition={{ angle: 110, intensity: 0.5 }}`). Wrap the challenge/approach/result prose with `ProseReveal`; swap any feature/tech grid to `CardGridReveal`; CTA → `CtaReveal`.
- [ ] **Step 5 — Gate + commit.**
```bash
npm run type-check && npm run lint && npm run build
git add "app/(site)/about/page.tsx" "app/(site)/services/page.tsx" "app/(site)/services/[slug]/page.tsx"
git commit -m "feat(rollout): about finish + services list/detail — silk, grids, prose, CTA (VP5)"
```

---

### Task 3: Work (list + slug) + Blog (list + slug)

**Files:** Modify `app/(site)/work/page.tsx`, `app/(site)/work/[slug]/page.tsx`, `app/(site)/blog/page.tsx`, `app/(site)/blog/[slug]/page.tsx`.

- [ ] **Step 1 — Work list: R1 + R3.** Read `work/page.tsx`. Wrap body with **R1** (`composition={{ angle: 200, offset: { x: -15, y: 0 }, intensity: 0.55 }}`). Swap the projects/case-study grid to `CardGridReveal`. CTA → `CtaReveal` + `Accents preset="cta"` if present.
- [ ] **Step 2 — Work [slug]: R1 + R8(media) + R6.** Read `work/[slug]/page.tsx`. Wrap body with **R1** (`composition={{ angle: 160, intensity: 0.5 }}`). Wrap the cover/hero image with **R7** `MediaReveal`. Wrap body prose with `ProseReveal`; swap any metrics numbers to **R4** `StatReveal` where a clean numeric+suffix exists (skip if the value is non-numeric text). CTA → `CtaReveal`.
- [ ] **Step 3 — Blog list: R1 + R3.** Read `blog/page.tsx`. Wrap body with **R1** (`composition={{ angle: 130, offset: { x: 10, y: 10 }, intensity: 0.5 }}`). Swap the posts grid to `CardGridReveal`.
- [ ] **Step 4 — Blog [slug]: R1 + R6.** Read `blog/[slug]/page.tsx`. Wrap body with **R1** (`composition={{ angle: 120, intensity: 0.45 }}`). Wrap the article body/paragraph wrapper with `ProseReveal` (do NOT alter the rendered post HTML itself — wrap the container). Wrap a cover image (if any) with `MediaReveal`.
- [ ] **Step 5 — Gate + commit.**
```bash
npm run type-check && npm run lint && npm run build
git add "app/(site)/work/page.tsx" "app/(site)/work/[slug]/page.tsx" "app/(site)/blog/page.tsx" "app/(site)/blog/[slug]/page.tsx"
git commit -m "feat(rollout): work + blog list/detail — silk, grids, media wipe, prose (VP5)"
```

---

### Task 4: Contact + legal + final VP5 verification

**Files:** Modify `app/(site)/contact/page.tsx`, `app/(site)/privacy/page.tsx`, `app/(site)/terms/page.tsx`.

- [ ] **Step 1 — Contact: R1 + R8 + FAQ.** Wrap the contact body with **R1** (`composition={{ angle: 100, offset: { x: -10, y: 5 }, intensity: 0.55 }}`). The FAQ `<section>` (already `border-t bg-ink-950`): make it `relative overflow-hidden`, add **R8** `<Accents preset="section" />` first child, content `z-10`, and wrap the FAQ rows container with `AccordionReveal` (import it). Keep the form + info columns as-is (form must not be motion-gated into invisibility — do NOT wrap form fields).
- [ ] **Step 2 — Legal (privacy + terms): R1 + R6.** Read both. Wrap each page body with **R1** (`composition={{ angle: 140, intensity: 0.4 }}` — lightest). Wrap the legal prose blocks with `ProseReveal`. No accents (keep legal calm).
- [ ] **Step 3 — Gate.**
```bash
npm run type-check && npm run lint && npm run build && npm run test
```
Expected: all green; test count unchanged from VP4 (113) — VP5 adds no unit tests.

- [ ] **Step 4 — Commit.**
```bash
git add "app/(site)/contact/page.tsx" "app/(site)/privacy/page.tsx" "app/(site)/terms/page.tsx"
git commit -m "feat(rollout): contact (FAQ accordion + accents) + legal prose — silk (VP5)"
```

- [ ] **Step 5 — Full-site browser verification (owed to user, GPU browser).** `npm run dev`, walk every page in **light + dark**:
  - Silk backdrop present + soft on all pages; text legible; home hero still runs WebGL comets and NO second WebGL context appears elsewhere (single-canvas rule).
  - Card grids stagger; headings/prose reveal; work detail image wipes; contact FAQ rows stagger + accordion opens; count-ups run where used.
  - `prefers-reduced-motion` → everything static, content fully visible; forms usable.
  - Mobile (<768) → CSS silk fallback, no WebGL, no layout shift.

---

## Self-Review notes

- **Spec §5 coverage:** every page in the rollout table gets silk + its archetypes (home, about, services×2, work×2, blog×2, contact, legal×2). ✔
- **Single-canvas rule:** enforced by `allowWebGL={false}` on all home `SilkBackground`s (Task 1). ✔
- **Type consistency:** recipes reference the exact VP2–VP4 component names/props already built.
- **No new tests:** VP5 is presentational wiring; unit-tested logic already covered in VP1–VP4. Verification is browser-based (Step 5) + gate.
- **Risk / watch:** (a) `CardGridReveal` wraps each child in a motion `div` — grids relying on direct-child classes (the process/steps hairline grid using per-cell `bg-ink-900`) need that class on the child’s own wrapper, noted in Tasks 1 & 2. (b) Do not wrap form inputs in reveals (contact) — motion must never hide a field. (c) Opaque section bgs cover the page-level silk — that’s expected; Accents inside those sections provide the richness there.
- **Deferred:** perf validation (Lighthouse/CLS/bundle) = VP6.
