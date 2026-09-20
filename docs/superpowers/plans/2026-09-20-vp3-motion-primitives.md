# VP3 — Motion Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the reusable per-section-type entrance primitives in `components/motion/`, each with its own signature move, so VP5 can compose every page by section type. Pure animation logic is unit-tested; components are framer-motion wrappers that collapse to instant final-state under reduced motion.

**Architecture:** A small pure-helper module (`lib/motion-anim.ts`) holds testable logic (word splitting, stagger-delay math, count-up stepping). Each primitive in `components/motion/` is a `'use client'` framer-motion component using `whileInView` (viewport-once) + `useReducedMotion`. Only transform/opacity animate. Reduced motion → framer renders the target state with no transition.

**Tech Stack:** Next.js 14, React 18, framer-motion ^13, Tailwind, Vitest. `EASE_OUT_EXPO` from `lib/motion.ts`.

## Global Constraints

- **Only transform/opacity animated** — no layout-thrashing props. (Spec §6)
- **Reduced-motion** — every primitive uses framer's `useReducedMotion`; when true it renders the final state instantly (no stagger, no transform). (Spec §7)
- **Scroll trigger** — `whileInView` with `viewport={{ once: true, margin: '-10% 0px' }}` (fires slightly before full entry, never re-fires). Consistent across all primitives.
- **Ease** — reuse `EASE_OUT_EXPO` (`[0.16,1,0.3,1]`) from `lib/motion.ts`; no new easing constants.
- **No `three` / heavy deps** — framer-motion only (already a dep). Must not enlarge the shared bundle beyond framer. (Spec §10)
- **Gate after each task:** `npm run test` · `type-check` · `lint` · `build` green before commit.

---

### Task 1: `lib/motion-anim.ts` — pure animation helpers (TDD)

**Files:**
- Create: `lib/motion-anim.ts`
- Create: `lib/motion-anim.test.ts`

**Interfaces:**
- Produces:
  - `splitWords(text: string): string[]` — words for word-by-word heading reveal (whitespace-split, drops empties).
  - `staggerDelays(count: number, stepMs: number, baseMs?: number): number[]` — per-child delays in ms.
  - `countUpValue(to: number, progress: number, from?: number): number` — eased value at progress `[0,1]`; `progress>=1` returns exactly `to`.

- [ ] **Step 1: Write the failing test**

Create `lib/motion-anim.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { splitWords, staggerDelays, countUpValue } from './motion-anim'

describe('splitWords', () => {
  it('splits on whitespace and drops empties', () => {
    expect(splitWords('  work  beautifully ')).toEqual(['work', 'beautifully'])
  })
  it('handles single word', () => {
    expect(splitWords('hello')).toEqual(['hello'])
  })
})

describe('staggerDelays', () => {
  it('produces ascending delays from base', () => {
    expect(staggerDelays(3, 60, 100)).toEqual([100, 160, 220])
  })
  it('defaults base to 0', () => {
    expect(staggerDelays(2, 50)).toEqual([0, 50])
  })
})

describe('countUpValue', () => {
  it('returns exactly the target at progress 1', () => {
    expect(countUpValue(98, 1)).toBe(98)
  })
  it('returns from at progress 0', () => {
    expect(countUpValue(98, 0, 10)).toBe(10)
  })
  it('is monotonic increasing between 0 and 1', () => {
    const a = countUpValue(100, 0.3)
    const b = countUpValue(100, 0.7)
    expect(b).toBeGreaterThan(a)
    expect(a).toBeGreaterThanOrEqual(0)
    expect(b).toBeLessThanOrEqual(100)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/motion-anim.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/motion-anim.ts`**

```typescript
export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

export function staggerDelays(count: number, stepMs: number, baseMs = 0): number[] {
  return Array.from({ length: count }, (_, i) => baseMs + i * stepMs)
}

// Eased (out-expo-ish) interpolation; exact endpoints at 0 and 1.
export function countUpValue(to: number, progress: number, from = 0): number {
  if (progress <= 0) return from
  if (progress >= 1) return to
  const eased = 1 - Math.pow(1 - progress, 3)
  return from + (to - from) * eased
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- lib/motion-anim.test.ts`
Expected: PASS.

- [ ] **Step 5: Gate + commit**

```bash
npm run type-check && npm run lint
git add lib/motion-anim.ts lib/motion-anim.test.ts
git commit -m "feat(motion): pure animation helpers (splitWords, staggerDelays, countUpValue) (VP3)"
```

---

### Task 2: `HeadingReveal` + `CardGridReveal` (the two most-used primitives)

**Files:**
- Create: `components/motion/HeadingReveal.tsx`
- Create: `components/motion/CardGridReveal.tsx`

**Interfaces:**
- Consumes: `splitWords`, `staggerDelays` (Task 1); framer-motion; `EASE_OUT_EXPO`.
- Produces:
  - `<HeadingReveal text={string} as?={ElementType} className?={string} />` — word-by-word clip-mask rise.
  - `<CardGridReveal className?={string}>{children}</CardGridReveal>` — staggers direct children (fade + y + scale).

- [ ] **Step 1: Implement `HeadingReveal.tsx`**

```tsx
'use client'

import { type ElementType } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { splitWords } from '@/lib/motion-anim'

export default function HeadingReveal({
  text,
  as = 'h2',
  className = '',
}: {
  text: string
  as?: ElementType
  className?: string
}) {
  const reduced = useReducedMotion()
  const words = splitWords(text)
  const MotionTag = motion(as as ElementType)

  if (reduced) {
    const Tag = as
    return <Tag className={className}>{text}</Tag>
  }

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10% 0px' }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-baseline" aria-hidden="true">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: '110%' },
              visible: {
                y: '0%',
                transition: { duration: 0.7, ease: EASE_OUT_EXPO, delay: i * 0.06 },
              },
            }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  )
}
```

- [ ] **Step 2: Implement `CardGridReveal.tsx`**

```tsx
'use client'

import { Children, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'

export default function CardGridReveal({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()

  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ staggerChildren: 0.06 }}
    >
      {Children.map(children, (child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 16, scale: 0.96 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.6, ease: EASE_OUT_EXPO },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
```

- [ ] **Step 3: Gate + commit**

```bash
npm run type-check && npm run lint && npm run build
git add components/motion/HeadingReveal.tsx components/motion/CardGridReveal.tsx
git commit -m "feat(motion): HeadingReveal (word clip-rise) + CardGridReveal (stagger) primitives (VP3)"
```

---

### Task 3: `StatReveal` (count-up) + `QuoteReveal` + `CtaReveal`

**Files:**
- Create: `components/motion/StatReveal.tsx`
- Create: `components/motion/QuoteReveal.tsx`
- Create: `components/motion/CtaReveal.tsx`

**Interfaces:**
- Consumes: `countUpValue` (Task 1); framer-motion (`useInView`, `useMotionValue`, `animate` or a simple rAF); `EASE_OUT_EXPO`.
- Produces:
  - `<StatReveal to={number} suffix?={string} prefix?={string} className?={string} durationMs?={number} />` — number counts up when in view; label underline sweep via CSS.
  - `<QuoteReveal className?={string}>{children}</QuoteReveal>` — quote-mark scale-in + content fade.
  - `<CtaReveal className?={string}>{children}</CtaReveal>` — content rise; wrapper for CTA bands.

- [ ] **Step 1: Implement `StatReveal.tsx`**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'
import { countUpValue } from '@/lib/motion-anim'

export default function StatReveal({
  to,
  prefix = '',
  suffix = '',
  className = '',
  durationMs = 1400,
}: {
  to: number
  prefix?: string
  suffix?: string
  className?: string
  durationMs?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const reduced = useReducedMotion()
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      setVal(to)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs)
      setVal(countUpValue(to, p))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduced, to, durationMs])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {Math.round(val)}
      {suffix}
    </span>
  )
}
```

- [ ] **Step 2: Implement `QuoteReveal.tsx`**

```tsx
'use client'

import { type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'

export default function QuoteReveal({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT_EXPO } }}
      viewport={{ once: true, margin: '-10% 0px' }}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 3: Implement `CtaReveal.tsx`**

```tsx
'use client'

import { type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'

export default function CtaReveal({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.75, ease: EASE_OUT_EXPO } }}
      viewport={{ once: true, margin: '-10% 0px' }}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 4: Gate + commit**

```bash
npm run type-check && npm run lint && npm run build
git add components/motion/StatReveal.tsx components/motion/QuoteReveal.tsx components/motion/CtaReveal.tsx
git commit -m "feat(motion): StatReveal count-up + QuoteReveal + CtaReveal primitives (VP3)"
```

---

### Task 4: `ProseReveal` + `MediaReveal` + `AccordionReveal`

**Files:**
- Create: `components/motion/ProseReveal.tsx`
- Create: `components/motion/MediaReveal.tsx`
- Create: `components/motion/AccordionReveal.tsx`

**Interfaces:**
- Consumes: framer-motion; `EASE_OUT_EXPO`.
- Produces:
  - `<ProseReveal className?={string}>{children}</ProseReveal>` — staggered fade-up of direct children (paragraphs).
  - `<MediaReveal className?={string}>{children}</MediaReveal>` — clip-path wipe reveal for images/media.
  - `<AccordionReveal className?={string}>{children}</AccordionReveal>` — rows stagger in (open/height handled by native `<details>`).

- [ ] **Step 1: Implement `ProseReveal.tsx`**

```tsx
'use client'

import { Children, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'

export default function ProseReveal({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ staggerChildren: 0.08 }}
    >
      {Children.map(children, (child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
```

- [ ] **Step 2: Implement `MediaReveal.tsx`**

```tsx
'use client'

import { type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'

export default function MediaReveal({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0.6 }}
      whileInView={{
        clipPath: 'inset(0 0% 0 0)',
        opacity: 1,
        transition: { duration: 0.9, ease: EASE_OUT_EXPO },
      }}
      viewport={{ once: true, margin: '-10% 0px' }}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 3: Implement `AccordionReveal.tsx`**

```tsx
'use client'

import { Children, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'

export default function AccordionReveal({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ staggerChildren: 0.05 }}
    >
      {Children.map(children, (child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
```

- [ ] **Step 4: Gate + commit**

```bash
npm run type-check && npm run lint && npm run build && npm run test
git add components/motion/ProseReveal.tsx components/motion/MediaReveal.tsx components/motion/AccordionReveal.tsx
git commit -m "feat(motion): ProseReveal + MediaReveal (clip wipe) + AccordionReveal primitives (VP3)"
```

---

## Self-Review notes

- **Spec §4.3 coverage:** all 8 archetype primitives built — HeadingReveal, CardGridReveal, StatReveal(+countUp), QuoteReveal, CtaReveal, ProseReveal, MediaReveal, AccordionReveal. ✔
- **Reduced-motion:** every primitive branches on `useReducedMotion` → final state, no transform. ✔
- **Type consistency:** all take `className?` + (children | text/to); names match the spec table and VP5 will reference these exact component names.
- **Testable logic isolated:** `lib/motion-anim.ts` pure + unit-tested; visual components verified via build/lint + VP5 real-browser rollout.
- **Deferred:** wiring these into pages = VP5 (not here). VP3 only builds + compiles the primitives. `MagneticCursor` already exists (untouched). No page imports change in VP3.
- **Risk:** framer-motion `motion(as)` dynamic tag in HeadingReveal — if TS complains, cast `as ElementType`; verified at gate. Bundle: framer already shared dep, no new chunk.
