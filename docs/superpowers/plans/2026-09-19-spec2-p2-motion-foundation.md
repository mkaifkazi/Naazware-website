# Spec 2 · Phase 2 — Motion Foundation (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the site-wide motion foundation — Lenis smooth-scroll (replacing locomotive-scroll), GSAP ScrollTrigger wired to Lenis, Framer Motion available, a magnetic custom cursor, and shared reduced-motion-aware motion utilities — without breaking the green gate or the existing `Reveal` system.

**Architecture:** All motion decisions funnel through one pure module `lib/motion.ts` (easing, Lenis defaults, Framer variants, and the pure predicates `shouldEnableMotion` + `magneticOffset`) so the logic is unit-testable under the existing `node` Vitest env. Thin client components (`SmoothScroll`, `MagneticCursor`) read `matchMedia`/DOM and delegate to those pure helpers. The existing IntersectionObserver-based `Reveal` component + `.reveal` CSS stay as-is (already reduced-motion-safe); P2 adds GSAP/Framer alongside it, not replacing it.

**Tech Stack:** Next 14 App Router, TypeScript, `lenis`, `gsap` (+ ScrollTrigger), `framer-motion`, Vitest (node env).

## Global Constraints

- Gate must stay GREEN every task: `npm run test` (currently 65) · `npm run type-check` · `npm run lint` · `npm run build`.
- `prefers-reduced-motion: reduce` → no smooth-scroll, no cursor effects, no GSAP-driven motion. Honored everywhere.
- Coarse pointer (touch) → no custom cursor.
- Only `transform`/`opacity` animated (no layout thrash).
- Vitest env is `node` — new tests must be **pure** (no DOM/matchMedia). DOM reads live in thin components; their decision logic is extracted to pure helpers and tested there.
- Keep the existing `Reveal` component + `.reveal`/reduced-motion CSS in `styles/globals.css` unchanged.
- Do not rename existing exports consumed elsewhere. Commit after every task. Branch: `feat/custom-cms`.

---

### Task 1: Dependency swap + stale-artifact cleanup

**Files:**
- Modify: `package.json` (add `lenis`, `gsap`, `framer-motion`; remove `locomotive-scroll`, `styled-components`)
- Delete: `.netlify/` (untracked stale build artifacts on disk — the only place `styled-components` appears)

**Interfaces:**
- Consumes: nothing.
- Produces: `lenis`, `gsap`, `framer-motion` importable; `locomotive-scroll` + `styled-components` gone.

- [ ] **Step 1: Install new deps**

Run: `npm install lenis gsap framer-motion`
Expected: added to `dependencies`, lockfile updated, no peer errors (all support React 18).

- [ ] **Step 2: Remove obsolete deps**

Run: `npm uninstall locomotive-scroll styled-components`
Expected: both removed from `package.json` dependencies.

- [ ] **Step 3: Delete stale `.netlify/` artifacts**

Run: `rm -rf .netlify`
(Untracked; Netlify was removed at P10. This is the only remaining `styled-components` reference in the tree.)

- [ ] **Step 4: Confirm no source still imports the removed packages**

Run: `grep -rn "locomotive-scroll\|styled-components" --include=*.ts --include=*.tsx app components lib`
Expected: no matches (Task 3 rewrites `SmoothScroll`; if it still shows here that's expected until Task 3 — but source should already be clean of `styled-components`). If `locomotive-scroll` appears only in `components/SmoothScroll.tsx`, that's fine — Task 3 replaces it. Note: the app must still build now, so **do Step 5 before assuming green**.

- [ ] **Step 5: Verify install didn't break the build**

Run: `npm run type-check && npm run lint && npm run build`
Expected: all pass. (SmoothScroll still uses locomotive-scroll here — it's still installed? No: uninstalled in Step 2.)

> ⚠ Ordering note: `SmoothScroll.tsx` imports `locomotive-scroll`, which Step 2 removes — the build will FAIL until Task 3. To keep every task green, **merge Task 3 into this task's cycle**: perform Task 3's rewrite (below) *before* running Step 5's build. Do Task 1 Steps 1–4, then Task 3 Steps 1–4, then return here for Step 5, then commit once.

- [ ] **Step 6: Commit (after Task 3 rewrite lands — single commit)**

```bash
git add package.json package-lock.json components/SmoothScroll.tsx lib/motion.ts lib/__tests__/motion.test.ts
git commit -m "feat(motion): swap locomotive-scroll→lenis, add gsap+framer, drop styled-components (Spec 2 P2)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `lib/motion.ts` pure helpers + tests

**Files:**
- Create: `lib/motion.ts`
- Test: `lib/__tests__/motion.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `EASE_OUT_EXPO: readonly [number, number, number, number]` = `[0.16, 1, 0.3, 1]`.
  - `LENIS_DEFAULTS: { duration: number; smoothWheel: boolean }` = `{ duration: 1.1, smoothWheel: true }`.
  - `shouldEnableMotion(prefersReduced: boolean): boolean` — `!prefersReduced`.
  - `shouldEnableCursor(prefersReduced: boolean, isCoarsePointer: boolean): boolean` — enabled only when `!prefersReduced && !isCoarsePointer`.
  - `magneticOffset(pointer: {x:number;y:number}, rect: {left:number;top:number;width:number;height:number}, strength?: number): {x:number;y:number}` — pull toward pointer: `(pointer - center) * strength` (default `strength = 0.3`).
  - `fadeUpVariants: { hidden: {...}; visible: {...} }` — Framer variants (opacity 0→1, y 24→0, eased `EASE_OUT_EXPO`).

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/motion.test.ts
import { describe, it, expect } from 'vitest'
import {
  EASE_OUT_EXPO,
  LENIS_DEFAULTS,
  shouldEnableMotion,
  shouldEnableCursor,
  magneticOffset,
  fadeUpVariants,
} from '@/lib/motion'

describe('EASE_OUT_EXPO', () => {
  it('is the out-expo cubic-bezier control points', () => {
    expect(EASE_OUT_EXPO).toEqual([0.16, 1, 0.3, 1])
  })
})

describe('LENIS_DEFAULTS', () => {
  it('uses a 1.1s smooth-wheel duration', () => {
    expect(LENIS_DEFAULTS).toEqual({ duration: 1.1, smoothWheel: true })
  })
})

describe('shouldEnableMotion', () => {
  it('enabled when reduced-motion is off', () => {
    expect(shouldEnableMotion(false)).toBe(true)
  })
  it('disabled when reduced-motion is on', () => {
    expect(shouldEnableMotion(true)).toBe(false)
  })
})

describe('shouldEnableCursor', () => {
  it('enabled only for fine pointer without reduced-motion', () => {
    expect(shouldEnableCursor(false, false)).toBe(true)
  })
  it('disabled on coarse pointer', () => {
    expect(shouldEnableCursor(false, true)).toBe(false)
  })
  it('disabled with reduced-motion', () => {
    expect(shouldEnableCursor(true, false)).toBe(false)
  })
})

describe('magneticOffset', () => {
  const rect = { left: 100, top: 100, width: 100, height: 100 } // center 150,150
  it('is zero at the element center', () => {
    expect(magneticOffset({ x: 150, y: 150 }, rect)).toEqual({ x: 0, y: 0 })
  })
  it('pulls toward the pointer scaled by strength (default 0.3)', () => {
    // pointer 50px right of center → 50 * 0.3 = 15
    expect(magneticOffset({ x: 200, y: 150 }, rect)).toEqual({ x: 15, y: 0 })
  })
  it('respects a custom strength', () => {
    expect(magneticOffset({ x: 200, y: 150 }, rect, 0.5)).toEqual({ x: 25, y: 0 })
  })
})

describe('fadeUpVariants', () => {
  it('animates opacity and y with the out-expo ease', () => {
    expect(fadeUpVariants.hidden).toMatchObject({ opacity: 0, y: 24 })
    expect(fadeUpVariants.visible).toMatchObject({ opacity: 1, y: 0 })
    expect(fadeUpVariants.visible.transition.ease).toEqual(EASE_OUT_EXPO)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/__tests__/motion.test.ts`
Expected: FAIL — cannot resolve `@/lib/motion`.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/motion.ts
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

export const LENIS_DEFAULTS = { duration: 1.1, smoothWheel: true }

/** Global motion switch — disabled when the user prefers reduced motion. */
export function shouldEnableMotion(prefersReduced: boolean): boolean {
  return !prefersReduced
}

/** Custom cursor is fine-pointer only, and never under reduced-motion. */
export function shouldEnableCursor(prefersReduced: boolean, isCoarsePointer: boolean): boolean {
  return !prefersReduced && !isCoarsePointer
}

type Point = { x: number; y: number }
type Rect = { left: number; top: number; width: number; height: number }

/** Offset that pulls an element toward the pointer, scaled by `strength`. */
export function magneticOffset(pointer: Point, rect: Rect, strength = 0.3): Point {
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  return {
    x: (pointer.x - centerX) * strength,
    y: (pointer.y - centerY) * strength,
  }
}

export const fadeUpVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT_EXPO },
  },
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- lib/__tests__/motion.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Verify gate**

Run: `npm run type-check && npm run lint`
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add lib/motion.ts lib/__tests__/motion.test.ts
git commit -m "feat(motion): pure motion helpers (easing, lenis defaults, magnetic, variants) (Spec 2 P2)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

> If you followed Task 1's ordering note and are batching commits, you may fold this commit into Task 1's single commit instead. Either way, `lib/motion.ts` must exist before Task 3 (Task 3 imports it).

---

### Task 3: Rewrite `SmoothScroll` — Lenis + GSAP ScrollTrigger

**Files:**
- Modify (rewrite): `components/SmoothScroll.tsx`

**Interfaces:**
- Consumes: `LENIS_DEFAULTS`, `shouldEnableMotion` from `lib/motion.ts`.
- Produces: a client component that runs Lenis smooth-scroll, drives it via `gsap.ticker`, and calls `ScrollTrigger.update()` on scroll. Renders `null`. Mounted already in `app/(site)/layout.tsx` — no layout change needed.

- [ ] **Step 1: Rewrite the component**

```tsx
'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { LENIS_DEFAULTS, shouldEnableMotion } from '@/lib/motion'

/**
 * Site-wide smooth scroll (Lenis) synced to GSAP ScrollTrigger.
 * Skipped entirely when the user prefers reduced motion.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!shouldEnableMotion(prefersReduced)) return

    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis(LENIS_DEFAULTS)
    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [])

  return null
}
```

- [ ] **Step 2: Verify type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: pass. (`lenis` ships its own types; `gsap` types are bundled.)

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: builds clean; `locomotive-scroll` no longer referenced anywhere.

- [ ] **Step 4: Confirm removed packages are gone**

Run: `grep -rn "locomotive-scroll\|styled-components" --include=*.ts --include=*.tsx app components lib`
Expected: no matches.

- [ ] **Step 5: Commit**

(If batching per Task 1's ordering note, this is already covered by Task 1's single commit. Otherwise:)

```bash
git add components/SmoothScroll.tsx
git commit -m "feat(motion): drive Lenis via gsap.ticker + ScrollTrigger sync (Spec 2 P2)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Magnetic custom cursor

**Files:**
- Create: `components/MagneticCursor.tsx`
- Modify: `app/(site)/layout.tsx` (mount `<MagneticCursor />`)
- Modify: `styles/globals.css` (cursor dot styles + hide native cursor only when the custom one is active)

**Interfaces:**
- Consumes: `shouldEnableCursor`, `magneticOffset` from `lib/motion.ts`.
- Produces: a client component rendering a fixed cursor dot that follows the pointer and eases toward the center of any hovered `[data-magnetic]` element. No-op on coarse pointer or reduced-motion. Interactive elements opt in via `data-magnetic` (added to buttons/links in later phases; the cursor works globally regardless).

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { shouldEnableCursor, magneticOffset } from '@/lib/motion'

export default function MagneticCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isCoarse = window.matchMedia('(pointer: coarse)').matches
    if (!shouldEnableCursor(prefersReduced, isCoarse)) return

    const dot = dotRef.current
    if (!dot) return

    document.documentElement.classList.add('has-custom-cursor')

    let raf = 0
    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let x = targetX
    let y = targetY

    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest('[data-magnetic]') as HTMLElement | null
      if (el) {
        const rect = el.getBoundingClientRect()
        const off = magneticOffset({ x: e.clientX, y: e.clientY }, rect, 0.3)
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        targetX = cx + off.x
        targetY = cy + off.y
        dot.classList.add('is-magnetic')
      } else {
        targetX = e.clientX
        targetY = e.clientY
        dot.classList.remove('is-magnetic')
      }
    }

    const tick = () => {
      x += (targetX - x) * 0.18
      y += (targetY - y) * 0.18
      dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove)
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('has-custom-cursor')
    }
  }, [])

  return <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
}
```

- [ ] **Step 2: Add cursor styles to `styles/globals.css`**

Append (near the other decorative styles):

```css
/* Custom magnetic cursor (fine-pointer, motion-safe only) */
.cursor-dot {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 300;
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  background: rgb(var(--accent));
  pointer-events: none;
  opacity: 0;
  transition: width 0.2s ease, height 0.2s ease, opacity 0.3s ease, background-color 0.2s ease;
  will-change: transform;
}
.has-custom-cursor .cursor-dot {
  opacity: 1;
}
.cursor-dot.is-magnetic {
  width: 44px;
  height: 44px;
  background: rgb(var(--accent) / 0.25);
}
/* Only hide the native cursor when the custom one is actually active */
.has-custom-cursor,
.has-custom-cursor a,
.has-custom-cursor button {
  cursor: none;
}
@media (prefers-reduced-motion: reduce) {
  .cursor-dot { display: none; }
}
```

- [ ] **Step 3: Mount in the site layout**

In `app/(site)/layout.tsx`, add the import and render it alongside `SmoothScroll`:

```tsx
import MagneticCursor from '@/components/MagneticCursor'
// ...inside the returned tree, next to <SmoothScroll />:
<SmoothScroll />
<MagneticCursor />
```

- [ ] **Step 4: Verify gate**

Run: `npm run test && npm run type-check && npm run lint && npm run build`
Expected: all pass (test count unchanged from Task 2 — cursor logic is covered by the pure `magneticOffset`/`shouldEnableCursor` tests).

- [ ] **Step 5: Manual check (user, browser)**

Desktop fine-pointer: a teal dot follows the pointer, grows/softens over `[data-magnetic]` elements; native cursor hidden. Touch device / DevTools "mobile" (coarse pointer): no custom dot, native touch behavior intact. OS reduced-motion on: no dot, no smooth-scroll.

- [ ] **Step 6: Commit**

```bash
git add components/MagneticCursor.tsx app/(site)/layout.tsx styles/globals.css
git commit -m "feat(motion): magnetic custom cursor, fine-pointer + motion-safe only (Spec 2 P2)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (Section 4 global motion + Section 6 P2):**
- Lenis replaces locomotive-scroll → Task 1 + Task 3. ✓
- GSAP ScrollTrigger set up + synced to Lenis → Task 3. ✓
- Framer Motion available (+ shared variants) → Task 1 (dep) + Task 2 (`fadeUpVariants`). ✓
- Magnetic cursor → Task 4. ✓
- reduced-motion + reveal utilities → `shouldEnableMotion`/`shouldEnableCursor` (Task 2) applied in Tasks 3–4; existing `Reveal` + `.reveal` CSS kept (constraint). ✓
- Drop styled-components + stale `.netlify` → Task 1. ✓
- Only transform/opacity animated → cursor uses `transform`; Lenis is scroll transform. ✓

**Placeholder scan:** none — every step has concrete code/commands. Task 1's ordering note is an explicit sequencing instruction (build stays green), not a placeholder.

**Type consistency:** `shouldEnableMotion`, `shouldEnableCursor`, `magneticOffset`, `LENIS_DEFAULTS`, `EASE_OUT_EXPO`, `fadeUpVariants` defined in Task 2 and consumed with matching signatures in Tasks 3–4. `SmoothScroll` stays a default export rendering `null` (layout import unchanged).

**Ordering caveat (important):** removing `locomotive-scroll` (Task 1) breaks the build until `SmoothScroll` is rewritten (Task 3). The plan resolves this by instructing the implementer to land Task 2 (`lib/motion.ts`) and Task 3's rewrite within Task 1's cycle before the build/commit, so no intermediate commit is red. If executing strictly task-by-task with a subagent, run the sequence Task2 → Task3 → Task1-build in one reviewable unit.
