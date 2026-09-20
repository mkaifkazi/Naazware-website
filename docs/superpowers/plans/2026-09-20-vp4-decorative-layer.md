# VP4 — Decorative Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the premium decorative layer — soft blurred colour blobs + a few thin floating geometric shapes, with slow drift and subtle scroll parallax — as a reusable `Accents` component driven by named presets, so sections can feel full without clutter.

**Architecture:** A pure helper (`lib/accents.ts`) turns a named preset into a deterministic list of blobs and shapes (position, size, colour, depth) — unit-testable, no DOM. `components/visual/Accents.tsx` renders them: blobs = blurred gradient orbs using the silk ramp; shapes = thin SVG rings/arcs. Slow CSS drift always; a light framer scroll-parallax when motion is allowed. Everything `aria-hidden`, `pointer-events-none`, killed under reduced motion.

**Tech Stack:** Next.js 14, React 18, framer-motion ^13 (`useScroll`/`useTransform`, `useReducedMotion`), Tailwind, CSS keyframes, Vitest. Silk vars from VP1.

## Global Constraints

- **Colour via silk ramp only** — `rgb(var(--silk-1|2|3) / …)`, no hardcoded hexes. (Spec §3)
- **Decorative + inert** — `aria-hidden`, `pointer-events-none`; sits behind content (`-z-0` / below `z-10`). (Spec §7)
- **Premium restraint** — a handful of blobs + shapes per preset, never scattered confetti. Capped counts in the preset helper. (Spec §2.4)
- **Motion-safe** — under `useReducedMotion` the layer renders static (no drift, no parallax) or is omitted; only transform/opacity animate. (Spec §7)
- **Perf** — cheap blur/opacity/transform only; no per-frame JS beyond framer's scroll transform. Must not pull new heavy deps. (Spec §6)
- **Gate after each task:** `npm run test` · `type-check` · `lint` · `build` green before commit.

---

### Task 1: `lib/accents.ts` — preset → deterministic layout (TDD)

**Files:**
- Create: `lib/accents.ts`
- Create: `lib/accents.test.ts`

**Interfaces:**
- Produces:
  - `type AccentPreset = 'hero' | 'section' | 'cta'`
  - `type Blob = { id: string; x: number; y: number; size: number; color: 1 | 2 | 3; opacity: number; depth: number }`
  - `type Shape = { id: string; x: number; y: number; size: number; kind: 'ring' | 'arc'; rotate: number; depth: number }`
  - `type AccentLayout = { blobs: Blob[]; shapes: Shape[] }`
  - `buildAccents(preset: AccentPreset): AccentLayout`

- [ ] **Step 1: Write the failing test**

Create `lib/accents.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { buildAccents } from './accents'

const PRESETS = ['hero', 'section', 'cta'] as const

describe('buildAccents', () => {
  it('is deterministic for a given preset', () => {
    expect(buildAccents('hero')).toEqual(buildAccents('hero'))
  })

  it('caps element counts (premium restraint)', () => {
    for (const p of PRESETS) {
      const { blobs, shapes } = buildAccents(p)
      expect(blobs.length).toBeGreaterThanOrEqual(1)
      expect(blobs.length).toBeLessThanOrEqual(4)
      expect(shapes.length).toBeLessThanOrEqual(3)
    }
  })

  it('keeps positions in-bounds, colours valid, depth normalised', () => {
    for (const p of PRESETS) {
      const { blobs, shapes } = buildAccents(p)
      for (const b of blobs) {
        expect(b.x).toBeGreaterThanOrEqual(-20)
        expect(b.x).toBeLessThanOrEqual(120)
        expect([1, 2, 3]).toContain(b.color)
        expect(b.depth).toBeGreaterThanOrEqual(0)
        expect(b.depth).toBeLessThanOrEqual(1)
        expect(b.opacity).toBeGreaterThan(0)
        expect(b.opacity).toBeLessThanOrEqual(0.5)
      }
      for (const s of shapes) {
        expect(['ring', 'arc']).toContain(s.kind)
      }
    }
  })

  it('gives every element a unique id', () => {
    const { blobs, shapes } = buildAccents('hero')
    const ids = [...blobs, ...shapes].map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/accents.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/accents.ts`**

```typescript
export type AccentPreset = 'hero' | 'section' | 'cta'

export type Blob = {
  id: string
  x: number // % of container
  y: number
  size: number // px
  color: 1 | 2 | 3
  opacity: number
  depth: number // 0 = static, 1 = most parallax
}

export type Shape = {
  id: string
  x: number
  y: number
  size: number
  kind: 'ring' | 'arc'
  rotate: number
  depth: number
}

export type AccentLayout = { blobs: Blob[]; shapes: Shape[] }

const PRESETS: Record<AccentPreset, AccentLayout> = {
  hero: {
    blobs: [
      { id: 'h-b1', x: 12, y: 18, size: 460, color: 1, opacity: 0.28, depth: 0.6 },
      { id: 'h-b2', x: 82, y: 30, size: 380, color: 3, opacity: 0.22, depth: 0.9 },
      { id: 'h-b3', x: 60, y: 78, size: 300, color: 2, opacity: 0.18, depth: 0.4 },
    ],
    shapes: [
      { id: 'h-s1', x: 74, y: 16, size: 120, kind: 'ring', rotate: 12, depth: 0.8 },
      { id: 'h-s2', x: 18, y: 70, size: 90, kind: 'arc', rotate: -20, depth: 0.5 },
    ],
  },
  section: {
    blobs: [
      { id: 's-b1', x: -8, y: 40, size: 360, color: 2, opacity: 0.16, depth: 0.5 },
      { id: 's-b2', x: 96, y: 66, size: 320, color: 1, opacity: 0.14, depth: 0.7 },
    ],
    shapes: [{ id: 's-s1', x: 88, y: 24, size: 80, kind: 'ring', rotate: 8, depth: 0.6 }],
  },
  cta: {
    blobs: [
      { id: 'c-b1', x: 50, y: 50, size: 520, color: 3, opacity: 0.3, depth: 0.3 },
      { id: 'c-b2', x: 20, y: 30, size: 300, color: 1, opacity: 0.2, depth: 0.6 },
    ],
    shapes: [{ id: 'c-s1', x: 78, y: 68, size: 110, kind: 'arc', rotate: 30, depth: 0.7 }],
  },
}

export function buildAccents(preset: AccentPreset): AccentLayout {
  // Return fresh clones so callers can't mutate the shared preset table.
  const p = PRESETS[preset]
  return {
    blobs: p.blobs.map((b) => ({ ...b })),
    shapes: p.shapes.map((s) => ({ ...s })),
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- lib/accents.test.ts`
Expected: PASS.

- [ ] **Step 5: Gate + commit**

```bash
npm run type-check && npm run lint
git add lib/accents.ts lib/accents.test.ts
git commit -m "feat(accents): preset -> deterministic blob/shape layout helper (VP4)"
```

---

### Task 2: `components/visual/Accents.tsx` — render blobs + shapes with drift + parallax

**Files:**
- Create: `components/visual/Accents.tsx`
- Modify: `tailwind.config.ts` (add a slow `float` keyframe/animation for blobs)

**Interfaces:**
- Consumes: `buildAccents`, `AccentPreset`, `Blob`, `Shape` (Task 1); framer-motion; silk ramp.
- Produces: `<Accents preset={AccentPreset} className?={string} />` — full-bleed decorative layer.

- [ ] **Step 1: Add the float keyframes to Tailwind**

In `tailwind.config.ts` `keyframes` add:

```typescript
        'accent-float': {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(0,-14px,0)' },
        },
```

and in `animation`:

```typescript
        'accent-float': 'accent-float 14s ease-in-out infinite',
```

- [ ] **Step 2: Implement `Accents.tsx`**

Blobs are blurred radial orbs; shapes are thin SVG rings/arcs. Parallax: a container `useScroll` progress drives a `y` transform scaled per-element `depth`, disabled under reduced motion.

```tsx
'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { buildAccents, type AccentPreset, type Blob, type Shape } from '@/lib/accents'

function ParallaxItem({
  depth,
  progress,
  reduced,
  children,
  style,
  className,
}: {
  depth: number
  progress: MotionValue<number>
  reduced: boolean
  children?: React.ReactNode
  style: React.CSSProperties
  className?: string
}) {
  // Scroll 0->1 shifts the element up to (depth * 60)px; static when reduced.
  const y = useTransform(progress, [0, 1], [0, reduced ? 0 : -depth * 60])
  return (
    <motion.div className={className} style={{ ...style, y }}>
      {children}
    </motion.div>
  )
}

function BlobEl({ b, progress, reduced }: { b: Blob; progress: MotionValue<number>; reduced: boolean }) {
  return (
    <ParallaxItem
      depth={b.depth}
      progress={progress}
      reduced={reduced}
      className={reduced ? 'absolute' : 'absolute animate-accent-float'}
      style={{
        left: `${b.x}%`,
        top: `${b.y}%`,
        width: b.size,
        height: b.size,
        transform: 'translate(-50%, -50%)',
        borderRadius: '9999px',
        filter: 'blur(90px)',
        background: `radial-gradient(closest-side, rgb(var(--silk-${b.color}) / ${b.opacity}), transparent)`,
      }}
    />
  )
}

function ShapeEl({ s, progress, reduced }: { s: Shape; progress: MotionValue<number>; reduced: boolean }) {
  const stroke = 'rgb(var(--silk-2) / 0.35)'
  return (
    <ParallaxItem
      depth={s.depth}
      progress={progress}
      reduced={reduced}
      className="absolute"
      style={{
        left: `${s.x}%`,
        top: `${s.y}%`,
        width: s.size,
        height: s.size,
        transform: `translate(-50%, -50%) rotate(${s.rotate}deg)`,
      }}
    >
      <svg viewBox="0 0 100 100" width={s.size} height={s.size} fill="none">
        {s.kind === 'ring' ? (
          <circle cx="50" cy="50" r="44" stroke={stroke} strokeWidth="1.5" />
        ) : (
          <path d="M6 50 A44 44 0 0 1 94 50" stroke={stroke} strokeWidth="1.5" />
        )}
      </svg>
    </ParallaxItem>
  )
}

export default function Accents({
  preset,
  className = '',
}: {
  preset: AccentPreset
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion() ?? false
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const { blobs, shapes } = buildAccents(preset)

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {blobs.map((b) => (
        <BlobEl key={b.id} b={b} progress={scrollYProgress} reduced={reduced} />
      ))}
      {shapes.map((s) => (
        <ShapeEl key={s.id} s={s} progress={scrollYProgress} reduced={reduced} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Gate + commit**

```bash
npm run type-check && npm run lint && npm run build
git add components/visual/Accents.tsx tailwind.config.ts
git commit -m "feat(accents): Accents layer — blurred silk blobs + thin shapes, drift + scroll parallax (VP4)"
```

---

### Task 3: Prove on `/about` (blobs behind Values) + verify

**Files:**
- Modify: `app/(site)/about/page.tsx`

**Interfaces:**
- Consumes: `<Accents>` (Task 2). Sits alongside the VP2 `SilkBackground`.
- Produces: About's Values section gains a decorative accent layer behind it, proving the layer end-to-end.

- [ ] **Step 1: Add an accent layer to the Values section**

In `app/(site)/about/page.tsx`, the Values `<section>` already has `border-y ... bg-ink-950`. Make it `relative overflow-hidden` and drop an `<Accents preset="section" />` behind its inner content (the `bg-ink-950` is opaque, so place Accents ABOVE the section background but below content — simplest: give the section `relative`, render `<Accents>` as first child, wrap existing inner `container-px` div content so it stays above via `relative z-10`).

```tsx
      {/* Values */}
      <section className="relative overflow-hidden border-y border-ink-600 bg-ink-950 py-20 md:py-28">
        <Accents preset="section" />
        <div className="container-px relative z-10">
          {/* existing Values content unchanged */}
        </div>
      </section>
```

Add the import: `import Accents from '@/components/visual/Accents'`.

- [ ] **Step 2: Gate**

Run: `npm run type-check && npm run lint && npm run build && npm run test`
Expected: PASS.

- [ ] **Step 3: Verify (real browser, owed to user)**

Start `npm run dev`, open `/about` in light + dark: confirm soft blobs/shapes read as premium (not clutter), sit behind text, text legible; scroll shows gentle parallax; reduced-motion emulation → static. (Screenshot check is user-side, GPU browser — consistent with VP2.)

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/about/page.tsx"
git commit -m "feat(accents): mount decorative accents on /about Values (VP4 proof)"
```

---

## Self-Review notes

- **Spec §2.4 / §4.2 coverage:** blobs (blurred silk orbs) ✔ · thin floating shapes (rings/arcs) ✔ · drift (CSS `accent-float`) ✔ · scroll parallax (framer, depth-scaled) ✔ · aria-hidden/pointer-none ✔ · reduced-motion static ✔ · capped counts (preset table + test) ✔.
- **Type consistency:** `AccentPreset`, `buildAccents`, `Blob`, `Shape`, `AccentLayout` names identical across helper/component/tests; `<Accents preset=…>` is the single public API VP5 reuses.
- **Deferred:** full page rollout of accents = VP5. VP4 proves on `/about` only. Perf tuning of blur/counts = VP6.
- **Risk:** heavy `blur(90px)` on several large orbs can cost paint on low-end mobile — VP6 will verify Lighthouse; if needed, reduce blob count/size via the preset table (single source) without touching the component.
