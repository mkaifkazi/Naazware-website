# VP6 — Performance Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the whole site back under the performance budget after VP5 — chiefly by loading framer-motion lazily (`LazyMotion` + `m`) so the home route drops below 180 KB First Load — then verify bundle sizes and CLS safety across every route.

**Architecture:** Add one `LazyMotion` provider (with `domAnimation` features) around the app so all `m` components share a single lazily-loaded feature bundle. Swap every full `motion.*` in the VP3 primitives + `Accents` to `m.*`. Framer hooks (`useReducedMotion`, `useInView`, `useScroll`, `useTransform`) stay as-is. Then confirm the route table.

**Tech Stack:** Next.js 14, framer-motion ^13 (`LazyMotion`, `domAnimation`, `m`), Vitest.

## Global Constraints

- **Budget (hard gate):** initial JS excluding the WebGL chunk **< ~180 KB** gzipped per route; `three` stays code-split (never shared). Lighthouse mobile ≥ 90 is the target (validated in a browser — see Task 2). (Spec §6)
- **Behaviour unchanged:** LazyMotion must not change how any animation looks or its reduced-motion behaviour — same variants, same easing. (Spec §7)
- **`domAnimation` feature set** covers transform/opacity/clipPath + `whileInView` — sufficient for every VP3 primitive. Do NOT use `domMax` (larger; not needed — no layout/drag animations).
- **Provider placement:** wraps all `(site)` pages (mount in the root layout body). `m` components animate only inside a `LazyMotion` ancestor.
- **Gate after each task:** `npm run test` · `type-check` · `lint` · `build` green before commit.

---

### Task 1: LazyMotion provider + swap `motion` → `m`

**Files:**
- Create: `components/motion/MotionProvider.tsx`
- Modify: `app/layout.tsx`
- Modify: `components/motion/HeadingReveal.tsx`, `CardGridReveal.tsx`, `QuoteReveal.tsx`, `CtaReveal.tsx`, `ProseReveal.tsx`, `MediaReveal.tsx`, `AccordionReveal.tsx`
- Modify: `components/visual/Accents.tsx`
- (`StatReveal.tsx` uses no `motion` component — only `useInView`/`useReducedMotion` — leave it.)

**Interfaces:**
- Produces: `<MotionProvider>{children}</MotionProvider>` — a `'use client'` wrapper rendering `<LazyMotion features={domAnimation}>`.

- [ ] **Step 1: Create `MotionProvider.tsx`**

```tsx
'use client'

import { LazyMotion, domAnimation } from 'framer-motion'
import { type ReactNode } from 'react'

export default function MotionProvider({ children }: { children: ReactNode }) {
  // Non-strict: any stray full `motion` component still works; `m` components
  // share this single lazily-loaded feature bundle (domAnimation).
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>
}
```

- [ ] **Step 2: Mount the provider in the root layout**

In `app/layout.tsx`, import it and wrap `{children}`:

```tsx
import MotionProvider from '@/components/motion/MotionProvider'
// …
      <body className="bg-ink-900 text-paper">
        <MotionProvider>{children}</MotionProvider>
        <Analytics />
      </body>
```

- [ ] **Step 3: Swap `motion` → `m` in every primitive that uses a motion component**

In each of `HeadingReveal, CardGridReveal, QuoteReveal, CtaReveal, ProseReveal, MediaReveal, AccordionReveal` and `components/visual/Accents.tsx`:
- Change the import `import { motion, … } from 'framer-motion'` to `import { m, … } from 'framer-motion'` (keep any hooks like `useReducedMotion`, `useScroll`, `useTransform`, `MotionValue`, `useInView` in the same import).
- Replace every `motion.` with `m.` (e.g. `motion.div` → `m.div`, `motion.span` → `m.span`).
- In `HeadingReveal`, `const MotionTag = motion(as as ElementType)` → `const MotionTag = m(as as ElementType)`.

No other logic changes. Variants, transitions, `whileInView`, and reduced-motion branches stay identical.

- [ ] **Step 4: Gate**

Run: `npm run type-check && npm run lint && npm run test`
Expected: PASS (113 tests unchanged).

- [ ] **Step 5: Build + confirm the budget**

Run: `npm run build`
Expected: PASS. Read the route table — **home (`/`) First Load must be < 180 KB** (was 191). All other routes stay < 180. `three` still only in a dynamic chunk (not shared). Record the new home number in the commit body.

If home is still ≥ 180: check that no `(site)` page still imports the full `motion` (grep `from 'framer-motion'` for `motion,`/`motion.`), and that MagneticCursor / HeroParallax aren't pulling `motion` into the shared chunk — convert those to `m` under the same provider if they are.

- [ ] **Step 6: Commit**

```bash
git add components/motion/MotionProvider.tsx app/layout.tsx components/motion/*.tsx components/visual/Accents.tsx
git commit -m "perf(motion): LazyMotion + m to shrink framer bundle under 180KB budget (VP6)"
```

---

### Task 2: Bundle + CLS verification + owed Lighthouse

**Files:** none (verification) — optionally `docs/HANDOVER.md`.

- [ ] **Step 1: Full route-table check**

Run: `npm run build` and capture the route table. Confirm for every route: First Load JS < 180 KB (excluding the dynamically-imported WebGL/three chunk). Note any route still over and its cause.

- [ ] **Step 2: CLS-safety audit (static reasoning)**

Confirm no VP2/VP4/VP5 change introduces layout shift:
- `SilkBackground`, `Accents`, and all reveal primitives are `absolute`/transform-opacity only → no reflow.
- Reveal wrappers animate transform/opacity (not height/margin) → no CLS.
- Cover images on work/blog detail keep their aspect-ratio classes (`aspect-[16/9]`) inside `MediaReveal` → no CLS.
Record findings.

- [ ] **Step 3: Document the owed browser Lighthouse run**

Real Lighthouse-mobile (perf ≥ 90, LCP < 2.5s, CLS < 0.1, TBT < 200ms) requires a Chrome run against `npm run build && npm run start` — user-side (GPU browser). Add/refresh a HANDOVER note listing this as the final owed verification for the visual-motion work, alongside the full-site light/dark/reduced-motion/mobile walk.

- [ ] **Step 4: Commit (if HANDOVER touched)**

```bash
git add docs/HANDOVER.md
git commit -m "docs: HANDOVER — visual-motion (VP1-6) done; owed Lighthouse + browser walk (VP6)"
```

---

## Self-Review notes

- **Spec §6 coverage:** framer lazy-loaded (home < 180) ✔ · three stays split ✔ · bundle table verified ✔ · CLS reasoning ✔ · Lighthouse flagged as browser-side owed ✔.
- **Behaviour parity:** only import/`m` swaps — no variant/timing/reduced-motion changes.
- **Risk:** `m` components silently no-op without a `LazyMotion` ancestor — provider is mounted at the root body so every `(site)` page is covered; admin pages don't use these primitives. If a primitive ever renders outside the provider, its animation won't run (content still visible — safe degrade).
- **Deferred / owed to user:** real Lighthouse-mobile numbers + the full-site visual walk (light/dark/reduced-motion/mobile) — cannot be run headless here (WebGL blank in headless Edge); needs the user's GPU browser.
