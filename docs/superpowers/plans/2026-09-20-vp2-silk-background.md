# VP2 — SilkBackground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared flowing gradient-silk backdrop — one component, WebGL when capable + CSS gradient-mesh fallback otherwise — driven by per-page composition props, and prove it on one page.

**Architecture:** A pure helper module (`lib/silk.ts`) turns `{angle, scale, offset, intensity}` into deterministic CSS-gradient strings (fallback) and canvas uniforms (WebGL) — fully unit-testable, no DOM. `SilkFallback` renders the CSS mesh with a slow `@keyframes` drift. `SilkCanvas` renders the WebGL silk via R3F (three code-split, same pattern as the hero). `SilkBackground` is the loader/gate: it picks WebGL vs fallback using the existing `shouldRenderWebGL` + `detectWebGL`, enforces the single-canvas rule via an `allowWebGL` prop, mounts lazy `ssr:false`, `z-0`, `aria-hidden`, `pointer-events-none`.

**Tech Stack:** Next.js 14, React 18, `@react-three/fiber@^8` + `three` (code-split), Tailwind, CSS custom props (`--silk-*` from VP1), Vitest.

## Global Constraints

- **Reuse VP1 tokens** — all colour via `rgb(var(--silk-1|2|3) / <alpha>)`. No hardcoded hexes in the fallback. (Spec §3)
- **Single WebGL canvas site-wide** — at most one live context. Pages that already run a WebGL hero (home) pass `allowWebGL={false}` so the ambient backdrop uses the CSS fallback there. (Spec §4.1)
- **Never blocks first paint** — `SilkBackground` mounts its canvas via `next/dynamic` `ssr:false`; `three`/R3F stay in a split chunk, never the shared bundle. (Spec §6)
- **Motion-safe** — reduced-motion / coarse-or-small / save-data / no-webgl → CSS fallback; under reduced-motion the fallback renders **static** (no drift). Reuse `shouldRenderWebGL()` and the hero's `detectWebGL()` logic. (Spec §7)
- **Decorative only** — `aria-hidden`, `pointer-events-none`, `z-0`; content stays `z-10`; opacity low enough to hold AA (VP1 proved 0.18-band bodies pass). (Spec §7)
- **Fallback echoes WebGL** — both paths must read as the same motif (layered teal→sky→violet flow), differing only in fidelity, not composition. (Spec §10)
- **Gate after each task:** `npm run test` · `type-check` · `lint` · `build` green before commit.

---

### Task 1: `lib/silk.ts` — pure composition helpers (TDD)

**Files:**
- Create: `lib/silk.ts`
- Create: `lib/silk.test.ts`

**Interfaces:**
- Produces:
  - `type SilkComposition = { angle: number; scale: number; offset: { x: number; y: number }; intensity: number }`
  - `normalizeComposition(partial?: Partial<SilkComposition>): SilkComposition` — fills defaults + clamps.
  - `toFallbackLayers(c: SilkComposition): string` — CSS `background-image` value (layered gradients using `--silk-*`).
  - `toCanvasUniforms(c: SilkComposition): { angleRad: number; scale: number; offsetX: number; offsetY: number; intensity: number }`.
  - `SILK_DEFAULTS: SilkComposition`.

- [ ] **Step 1: Write the failing test**

Create `lib/silk.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import {
  normalizeComposition,
  toFallbackLayers,
  toCanvasUniforms,
  SILK_DEFAULTS,
} from './silk'

describe('normalizeComposition', () => {
  it('returns defaults when given nothing', () => {
    expect(normalizeComposition()).toEqual(SILK_DEFAULTS)
  })

  it('clamps out-of-range values', () => {
    const c = normalizeComposition({ scale: 9, intensity: 5, offset: { x: 999, y: -999 } })
    expect(c.scale).toBeLessThanOrEqual(2)
    expect(c.scale).toBeGreaterThanOrEqual(0.5)
    expect(c.intensity).toBeLessThanOrEqual(1)
    expect(c.intensity).toBeGreaterThanOrEqual(0)
    expect(c.offset.x).toBeLessThanOrEqual(100)
    expect(c.offset.y).toBeGreaterThanOrEqual(-100)
  })

  it('wraps angle into [0,360)', () => {
    expect(normalizeComposition({ angle: 400 }).angle).toBe(40)
    expect(normalizeComposition({ angle: -30 }).angle).toBe(330)
  })
})

describe('toFallbackLayers', () => {
  it('references all three silk vars', () => {
    const s = toFallbackLayers(SILK_DEFAULTS)
    expect(s).toContain('var(--silk-1)')
    expect(s).toContain('var(--silk-2)')
    expect(s).toContain('var(--silk-3)')
  })

  it('scales alpha with intensity (dimmer at lower intensity)', () => {
    const strong = toFallbackLayers(normalizeComposition({ intensity: 1 }))
    const weak = toFallbackLayers(normalizeComposition({ intensity: 0.2 }))
    const firstAlpha = (str: string) => Number(str.match(/silk-1\) \/ ([0-9.]+)/)![1])
    expect(firstAlpha(strong)).toBeGreaterThan(firstAlpha(weak))
  })

  it('moves gradient anchors with offset', () => {
    const a = toFallbackLayers(normalizeComposition({ offset: { x: 0, y: 0 } }))
    const b = toFallbackLayers(normalizeComposition({ offset: { x: 40, y: 0 } }))
    expect(a).not.toBe(b)
  })
})

describe('toCanvasUniforms', () => {
  it('converts angle to radians and passes intensity/scale', () => {
    const u = toCanvasUniforms(normalizeComposition({ angle: 180, scale: 1.5, intensity: 0.5 }))
    expect(u.angleRad).toBeCloseTo(Math.PI)
    expect(u.scale).toBe(1.5)
    expect(u.intensity).toBe(0.5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/silk.test.ts`
Expected: FAIL — module not found / exports undefined.

- [ ] **Step 3: Implement `lib/silk.ts`**

```typescript
export type SilkComposition = {
  angle: number // degrees, [0,360)
  scale: number // [0.5, 2]
  offset: { x: number; y: number } // percent, [-100,100]
  intensity: number // [0,1] — alpha multiplier
}

export const SILK_DEFAULTS: SilkComposition = {
  angle: 135,
  scale: 1,
  offset: { x: 0, y: 0 },
  intensity: 0.7,
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const wrap360 = (a: number) => ((a % 360) + 360) % 360

export function normalizeComposition(partial: Partial<SilkComposition> = {}): SilkComposition {
  return {
    angle: wrap360(partial.angle ?? SILK_DEFAULTS.angle),
    scale: clamp(partial.scale ?? SILK_DEFAULTS.scale, 0.5, 2),
    intensity: clamp(partial.intensity ?? SILK_DEFAULTS.intensity, 0, 1),
    offset: {
      x: clamp(partial.offset?.x ?? 0, -100, 100),
      y: clamp(partial.offset?.y ?? 0, -100, 100),
    },
  }
}

// Base alphas per silk layer, scaled by intensity. Kept low so text stays AA.
const BASE_ALPHA = [0.22, 0.16, 0.2] as const

export function toFallbackLayers(c: SilkComposition): string {
  const a = (i: number) => (BASE_ALPHA[i] * c.intensity).toFixed(3)
  // Anchor points drift with offset; two radial pools + one directional wash.
  const p1x = 22 + c.offset.x * 0.4
  const p1y = 18 + c.offset.y * 0.4
  const p2x = 80 - c.offset.x * 0.3
  const p2y = 78 - c.offset.y * 0.3
  const spread = 60 * c.scale
  return [
    `radial-gradient(${spread}% ${spread * 0.8}% at ${p1x}% ${p1y}%, rgb(var(--silk-1) / ${a(0)}), transparent 62%)`,
    `radial-gradient(${spread * 0.9}% ${spread * 0.75}% at ${p2x}% ${p2y}%, rgb(var(--silk-3) / ${a(2)}), transparent 64%)`,
    `linear-gradient(${c.angle}deg, rgb(var(--silk-2) / ${a(1)}), transparent 70%)`,
  ].join(', ')
}

export function toCanvasUniforms(c: SilkComposition) {
  return {
    angleRad: (c.angle * Math.PI) / 180,
    scale: c.scale,
    offsetX: c.offset.x / 100,
    offsetY: c.offset.y / 100,
    intensity: c.intensity,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- lib/silk.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Gate + commit**

```bash
npm run type-check && npm run lint
git add lib/silk.ts lib/silk.test.ts
git commit -m "feat(silk): pure composition helpers for backdrop (fallback layers + canvas uniforms) (VP2)"
```

---

### Task 2: `SilkFallback.tsx` — CSS gradient-mesh backdrop

**Files:**
- Create: `components/visual/SilkFallback.tsx`
- Modify: `tailwind.config.ts` (add `silk-drift` keyframes/animation)

**Interfaces:**
- Consumes: `SilkComposition`, `toFallbackLayers` (Task 1).
- Produces: `<SilkFallback composition={...} animated={boolean} />` — a full-bleed `absolute inset-0` div rendering the layered gradient; slow drift when `animated`.

- [ ] **Step 1: Add the drift keyframes to Tailwind**

In `tailwind.config.ts`, inside `keyframes` add:

```typescript
        'silk-drift': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(-2%, 1.5%, 0) scale(1.06)' },
        },
```

And inside `animation` add:

```typescript
        'silk-drift': 'silk-drift 48s ease-in-out infinite',
```

- [ ] **Step 2: Implement `SilkFallback.tsx`**

```tsx
import type { SilkComposition } from '@/lib/silk'
import { toFallbackLayers } from '@/lib/silk'

export default function SilkFallback({
  composition,
  animated = true,
}: {
  composition: SilkComposition
  animated?: boolean
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${animated ? 'animate-silk-drift' : ''}`}
      style={{ backgroundImage: toFallbackLayers(composition), willChange: 'transform' }}
    />
  )
}
```

- [ ] **Step 3: Gate**

Run: `npm run type-check && npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/visual/SilkFallback.tsx tailwind.config.ts
git commit -m "feat(silk): CSS gradient-mesh fallback with slow drift (VP2)"
```

---

### Task 3: `SilkCanvas.tsx` (WebGL) + `SilkBackground.tsx` (gate/loader)

**Files:**
- Create: `components/visual/SilkCanvas.tsx`
- Create: `components/visual/SilkBackground.tsx`

**Interfaces:**
- Consumes: `SilkComposition`, `toCanvasUniforms`, `normalizeComposition` (Task 1); `SilkFallback` (Task 2); `shouldRenderWebGL` (`lib/motion.ts`).
- Produces:
  - `<SilkCanvas composition={...} />` — R3F canvas rendering an undulating gradient plane using the silk ramp + uniforms.
  - `<SilkBackground composition?={Partial<SilkComposition>} allowWebGL?={boolean} className?={string} />` — the public backdrop; gate picks WebGL vs fallback; lazy, `z-0`, `aria-hidden`.

- [ ] **Step 1: Implement `SilkCanvas.tsx` (WebGL silk plane)**

Reuse the hero's three code-split approach (import `three`/R3F here so it stays in a split chunk). A single full-screen plane with a fragment shader that blends the three silk colours in a slow flow. Read silk colours from CSS vars at mount (so theme applies).

```tsx
'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { toCanvasUniforms, type SilkComposition } from '@/lib/silk'

function readSilk(varName: string): THREE.Color {
  if (typeof window === 'undefined') return new THREE.Color('#2DD4BF')
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  const [r, g, b] = raw.split(/\s+/).map(Number)
  return new THREE.Color(r / 255, g / 255, b / 255)
}

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
`

const fragment = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uScale;
  uniform vec2 uOffset;
  uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
  void main() {
    vec2 p = (vUv + uOffset) * uScale;
    float w = sin(p.x * 3.0 + uTime * 0.25) * 0.5
            + sin(p.y * 2.0 - uTime * 0.2) * 0.5;
    float t = smoothstep(-1.0, 1.0, w);
    vec3 col = mix(uC1, uC2, t);
    col = mix(col, uC3, smoothstep(0.4, 1.0, vUv.y + w * 0.15));
    gl_FragColor = vec4(col, uIntensity * 0.5);
  }
`

function SilkPlane({ composition }: { composition: SilkComposition }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const u = toCanvasUniforms(composition)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: u.intensity },
      uScale: { value: u.scale },
      uOffset: { value: new THREE.Vector2(u.offsetX, u.offsetY) },
      uC1: { value: readSilk('--silk-1') },
      uC2: { value: readSilk('--silk-2') },
      uC3: { value: readSilk('--silk-3') },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt
  })
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

export default function SilkCanvas({ composition }: { composition: SilkComposition }) {
  return (
    <Canvas
      className="pointer-events-none absolute inset-0"
      gl={{ antialias: false, alpha: true }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 1] }}
    >
      <SilkPlane composition={composition} />
    </Canvas>
  )
}
```

- [ ] **Step 2: Implement `SilkBackground.tsx` (gate + loader)**

Mirror `HeroWebGL`'s detection. `allowWebGL` defaults true; when false (single-canvas rule) always render the fallback.

```tsx
'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { shouldRenderWebGL } from '@/lib/motion'
import { normalizeComposition, type SilkComposition } from '@/lib/silk'
import SilkFallback from './SilkFallback'

const SilkCanvas = dynamic(() => import('./SilkCanvas'), { ssr: false })

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

export default function SilkBackground({
  composition,
  allowWebGL = true,
  className = '',
}: {
  composition?: Partial<SilkComposition>
  allowWebGL?: boolean
  className?: string
}) {
  const c = normalizeComposition(composition)
  const [webgl, setWebgl] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setReduced(prefersReduced)
    const isCoarseOrSmall =
      window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection
    const saveData = !!conn?.saveData
    if (
      allowWebGL &&
      shouldRenderWebGL({ prefersReduced, isCoarseOrSmall, saveData, webglSupported: detectWebGL() })
    ) {
      setWebgl(true)
    }
  }, [allowWebGL])

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 -z-0 ${className}`}>
      {webgl ? <SilkCanvas composition={c} /> : <SilkFallback composition={c} animated={!reduced} />}
    </div>
  )
}
```

- [ ] **Step 3: Gate**

Run: `npm run type-check && npm run lint && npm run build`
Expected: PASS. Confirm the build output still shows `three` in a **separate chunk** (not First Load shared) — check the route table; home First Load JS should not jump by the three bundle size.

- [ ] **Step 4: Commit**

```bash
git add components/visual/SilkCanvas.tsx components/visual/SilkBackground.tsx
git commit -m "feat(silk): WebGL silk canvas + gated SilkBackground loader (VP2)"
```

---

### Task 4: Prove it on one page (`/about`) + screenshot verify

**Files:**
- Modify: `app/(site)/about/page.tsx`

**Interfaces:**
- Consumes: `<SilkBackground>` (Task 3).
- Produces: the About page renders the ambient silk backdrop behind its content, proving the whole path end-to-end.

- [ ] **Step 1: Mount the backdrop on About**

Wrap the About page's top-level content in a `relative` container and drop `<SilkBackground>` behind it. About runs no WebGL hero, so `allowWebGL` stays default (true). Give it a distinct composition so it looks intentional:

```tsx
import SilkBackground from '@/components/visual/SilkBackground'
// ...
export default function AboutPage() {
  return (
    <div className="relative overflow-hidden">
      <SilkBackground composition={{ angle: 120, offset: { x: -20, y: 10 }, intensity: 0.6 }} />
      <div className="relative z-10">
        {/* existing About page content unchanged */}
      </div>
    </div>
  )
}
```

Keep all existing content inside the `z-10` wrapper.

- [ ] **Step 2: Gate**

Run: `npm run type-check && npm run lint && npm run build && npm run test`
Expected: PASS.

- [ ] **Step 3: Screenshot verify (real browser)**

Do NOT `npm run build` while `npm run dev` is live. Start `npm run dev`, then from the scratchpad run the puppeteer helper (`shot.js` pattern) to capture `/about` in **light and dark**:
- Confirm the silk backdrop is visible but soft, and body text stays clearly legible over it (both themes).
- Emulate `prefers-reduced-motion` → confirm the fallback is static (no drift) and still renders.
- On a desktop capable browser confirm the WebGL path activates (canvas element present); on a throttled/mobile viewport (<768) confirm the CSS fallback renders instead.

- [ ] **Step 4: Commit**

```bash
git add "app/(site)/about/page.tsx"
git commit -m "feat(silk): mount ambient silk backdrop on /about (VP2 proof) (VP2)"
```

---

## Self-Review notes

- **Spec coverage:** helper module (T1) · CSS fallback + drift (T2) · WebGL canvas + gate + single-canvas `allowWebGL` (T3) · lazy `ssr:false` + `three` split (T3 verify) · proof page + reduced-motion/mobile/desktop verification (T4). ✔
- **Fallback echoes WebGL:** both consume the same `SilkComposition` + silk ramp; fallback = layered gradients, WebGL = flowing plane of the same three colours. ✔
- **Type consistency:** `SilkComposition`, `normalizeComposition`, `toFallbackLayers`, `toCanvasUniforms` names identical across T1–T4; `allowWebGL` prop threads the single-canvas rule.
- **Deferred to later phases:** home retrofit + `allowWebGL={false}` wiring on home = VP5 (page rollout). VP2 only proves on `/about`. Accents (blobs/shapes) = VP4. Archetype motion = VP3.
- **Risk watch:** if the WebGL silk plane looks too flat vs the reference, the shader is the tuning surface (VP6 perf/polish pass can refine); VP2's bar is "works, gated, legible, code-split", not final art.
