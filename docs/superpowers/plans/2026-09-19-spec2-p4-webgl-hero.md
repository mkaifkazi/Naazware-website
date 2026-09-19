# Spec 2 · Phase 4 — WebGL Hero (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the one signature WebGL moment to the hero — a GPU-cheap, pointer-reactive React Three Fiber scene — lazily loaded (`ssr:false`, dynamic import) so it never blocks first paint, fading in over the existing static poster, and fully disabled on mobile / weak devices / save-data / reduced-motion.

**Architecture:** Three layers at the hero's `HERO-POSTER-SEAM`: (1) the static poster (already there, always painted first), (2) a `HeroWebGL` loader that decides via the pure predicate `shouldRenderWebGL(...)` whether to `next/dynamic`-import the canvas, (3) `HeroCanvas` — the actual R3F scene, code-split into its own chunk so the WebGL/three bytes never enter the initial bundle. The decision logic lives in `lib/motion.ts` (pure, tested); DOM/GPU capability reads live in the thin loader.

**Tech Stack:** Next 14 (client island via `next/dynamic ssr:false`), `three`, `@react-three/fiber`, `@react-three/drei`, TypeScript, Vitest (node env).

## Global Constraints

- Gate GREEN every task: `npm run test` (currently 82) · `npm run type-check` · `npm run lint` · `npm run build`.
- WebGL bytes (`three`, R3F, drei) MUST be a separate lazy chunk — never in the initial/shared bundle. Enforced by `next/dynamic(() => import(...), { ssr: false })` and verified in the build output.
- Hero must be fully usable with WebGL absent (poster is the base layer; canvas only enhances).
- WebGL OFF when any of: `prefers-reduced-motion`, coarse pointer / small viewport (mobile), `navigator.connection.saveData`, or no WebGL support.
- Only the canvas animates; no layout shift (canvas is an absolutely-positioned `aria-hidden` decorative layer behind hero text).
- Vitest env is `node` — new tests pure (predicate only; the scene/loader are visual).
- Do not change hero copy or layout from P3. Commit after every task. Branch: `feat/custom-cms`.

---

### Task 1: `shouldRenderWebGL` predicate + deps

**Files:**
- Modify: `lib/motion.ts` (add `shouldRenderWebGL`)
- Modify: `lib/__tests__/motion.test.ts` (add cases)
- Modify: `package.json` (add `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`)

**Interfaces:**
- Consumes: nothing.
- Produces: `shouldRenderWebGL(opts: { prefersReduced: boolean; isCoarseOrSmall: boolean; saveData: boolean; webglSupported: boolean }): boolean` — true only when NOT reduced-motion, NOT coarse/small, NOT save-data, AND webgl supported.

- [ ] **Step 1: Add failing test cases**

Append to `lib/__tests__/motion.test.ts`:

```ts
import { shouldRenderWebGL } from '@/lib/motion'

describe('shouldRenderWebGL', () => {
  const ok = { prefersReduced: false, isCoarseOrSmall: false, saveData: false, webglSupported: true }
  it('renders on a capable desktop with motion allowed', () => {
    expect(shouldRenderWebGL(ok)).toBe(true)
  })
  it('off under reduced motion', () => {
    expect(shouldRenderWebGL({ ...ok, prefersReduced: true })).toBe(false)
  })
  it('off on coarse/small (mobile)', () => {
    expect(shouldRenderWebGL({ ...ok, isCoarseOrSmall: true })).toBe(false)
  })
  it('off on save-data', () => {
    expect(shouldRenderWebGL({ ...ok, saveData: true })).toBe(false)
  })
  it('off when webgl unsupported', () => {
    expect(shouldRenderWebGL({ ...ok, webglSupported: false })).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test -- lib/__tests__/motion.test.ts`
Expected: FAIL — `shouldRenderWebGL` is not exported.

- [ ] **Step 3: Implement the predicate**

Append to `lib/motion.ts`:

```ts
/** Gate for the signature WebGL hero — desktop, motion-safe, connected, GPU-capable only. */
export function shouldRenderWebGL(opts: {
  prefersReduced: boolean
  isCoarseOrSmall: boolean
  saveData: boolean
  webglSupported: boolean
}): boolean {
  return (
    !opts.prefersReduced && !opts.isCoarseOrSmall && !opts.saveData && opts.webglSupported
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test -- lib/__tests__/motion.test.ts`
Expected: PASS (all motion cases, incl. new WebGL ones).

- [ ] **Step 5: Install R3F deps**

Run: `npm install three @react-three/fiber @react-three/drei && npm install -D @types/three`
Expected: added; R3F v8 + drei v9 support React 18.

- [ ] **Step 6: Verify gate (deps present, nothing imports them yet)**

Run: `npm run type-check && npm run lint && npm run build`
Expected: pass; bundle unchanged (no imports yet).

- [ ] **Step 7: Commit**

```bash
git add lib/motion.ts lib/__tests__/motion.test.ts package.json package-lock.json
git commit -m "feat(hero): shouldRenderWebGL predicate + R3F deps (Spec 2 P4)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `HeroCanvas` — the R3F scene

**Files:**
- Create: `components/home/HeroCanvas.tsx`

**Interfaces:**
- Consumes: `@react-three/fiber`, `@react-three/drei`, `three`.
- Produces: default-exported client component rendering a full-bleed R3F `<Canvas>` with a pointer-reactive, GPU-cheap distorted mesh tinted with the brand teal. No props. Imported ONLY via `next/dynamic` in Task 3 (keeps it in its own chunk).

- [ ] **Step 1: Create the scene**

```tsx
// components/home/HeroCanvas.tsx
'use client'

import { useRef } from 'react'
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber'
import { MeshDistortMaterial, Float } from '@react-three/drei'
import type { Mesh } from 'three'

function Blob() {
  const mesh = useRef<Mesh>(null)

  useFrame((state) => {
    if (!mesh.current) return
    // Gentle pointer-follow rotation — cheap, no per-frame allocations.
    const { x, y } = state.pointer
    mesh.current.rotation.x += (y * 0.3 - mesh.current.rotation.x) * 0.05
    mesh.current.rotation.y += (x * 0.3 - mesh.current.rotation.y) * 0.05
  })

  const meshProps: ThreeElements['mesh'] = { ref: mesh, scale: 2.4 }

  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh {...meshProps}>
        <icosahedronGeometry args={[1, 12]} />
        <MeshDistortMaterial
          color="#2DD4BF"
          roughness={0.35}
          metalness={0.1}
          distort={0.35}
          speed={1.4}
        />
      </mesh>
    </Float>
  )
}

export default function HeroCanvas() {
  return (
    <Canvas
      className="!absolute inset-0"
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <Blob />
    </Canvas>
  )
}
```

- [ ] **Step 2: Verify type-check + lint**

Run: `npm run type-check && npm run lint`
Expected: pass. (If drei's `MeshDistortMaterial`/`Float` type props complain under strict TS, that's the place to fix — keep props to those shown, which are typed.)

- [ ] **Step 3: Commit**

```bash
git add components/home/HeroCanvas.tsx
git commit -m "feat(hero): R3F pointer-reactive distorted-blob scene (Spec 2 P4)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: `HeroWebGL` loader + mount at the poster seam

**Files:**
- Create: `components/home/HeroWebGL.tsx`
- Modify: `app/(site)/page.tsx` (mount `<HeroWebGL />` at `HERO-POSTER-SEAM`)

**Interfaces:**
- Consumes: `shouldRenderWebGL` (Task 1); `HeroCanvas` (Task 2) via `next/dynamic`.
- Produces: default-exported client component that, after mount, decides capability and — only if allowed — dynamically imports and fades in `HeroCanvas` over the poster. Renders nothing (a transparent overlay) when WebGL is off.

- [ ] **Step 1: Create the loader**

```tsx
// components/home/HeroWebGL.tsx
'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { shouldRenderWebGL } from '@/lib/motion'

// Code-split: three/R3F/drei live in THIS chunk only, never the initial bundle.
const HeroCanvas = dynamic(() => import('@/components/home/HeroCanvas'), { ssr: false })

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

export default function HeroWebGL() {
  const [enabled, setEnabled] = useState(false)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isCoarseOrSmall =
      window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
    // navigator.connection is non-standard; treat missing as "not save-data".
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection
    const saveData = !!conn?.saveData

    if (
      shouldRenderWebGL({
        prefersReduced,
        isCoarseOrSmall,
        saveData,
        webglSupported: detectWebGL(),
      })
    ) {
      setEnabled(true)
    }
  }, [])

  // Fade in only once the canvas chunk has had a tick to mount.
  useEffect(() => {
    if (!enabled) return
    const t = window.setTimeout(() => setShown(true), 50)
    return () => window.clearTimeout(t)
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
        shown ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <HeroCanvas />
    </div>
  )
}
```

- [ ] **Step 2: Mount at the poster seam in `app/(site)/page.tsx`**

Replace the seam marker + grid line:

```tsx
{/* HERO-POSTER-SEAM: P4 mounts <HeroCanvas /> here behind this static layer */}
<div className="grid-bg absolute inset-0" aria-hidden="true" />
<HeroParallax />
```

with:

```tsx
{/* Static poster (always painted first); WebGL enhances over it when capable. */}
<div className="grid-bg absolute inset-0" aria-hidden="true" />
<HeroWebGL />
<HeroParallax />
```

Add the import near the other home imports:

```tsx
import HeroWebGL from '@/components/home/HeroWebGL'
```

- [ ] **Step 3: Verify gate + code-split**

Run: `npm run test && npm run type-check && npm run lint && npm run build`
Expected: all pass. In the build output, confirm a **separate chunk** is emitted for the dynamic import (three/R3F is large — it should NOT appear in "First Load JS shared by all"). The home route's First Load JS should stay close to its pre-P4 value; the WebGL chunk loads on demand.

- [ ] **Step 4: Manual check (user, browser)**

Desktop (fine pointer, ≥768px, WebGL on): poster paints instantly, then the teal blob fades in and reacts to the pointer. Mobile / DevTools coarse-pointer / narrow width: no canvas, poster only. DevTools Network "Save-Data" or reduced-motion: no canvas. Throttle to Slow 3G: page is usable immediately (poster), canvas arrives late without blocking.

- [ ] **Step 5: Commit**

```bash
git add components/home/HeroWebGL.tsx "app/(site)/page.tsx"
git commit -m "feat(hero): lazy WebGL loader over poster, capability-gated + code-split (Spec 2 P4)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (Section 4 hero + Section 6 P4):**
- One signature WebGL moment → Task 2 (`HeroCanvas`). ✓
- Lazy, `ssr:false`, never blocks load → Task 3 (`next/dynamic`), poster is base layer. ✓
- Separate chunk / not in initial bundle → Task 3 Step 3 verifies build output. ✓
- Poster fallback → static poster stays; canvas overlays only when enabled. ✓
- Off on mobile / weak / save-data / reduced-motion → `shouldRenderWebGL` (Task 1) + loader capability reads (Task 3). ✓
- Pointer-reactive delight → `useFrame` pointer follow (Task 2). ✓
- No layout shift → canvas is absolute `aria-hidden` overlay (Tasks 2–3). ✓

**Placeholder scan:** none — full code in every code step. Task 2 Step 2 flags a *conditional* TS-fix location (drei prop types); the props shown are the typed ones, so it's guidance, not a placeholder.

**Type consistency:** `shouldRenderWebGL` options object shape identical in test (Task 1), definition (Task 1), and caller (Task 3). `HeroCanvas` default export imported by `next/dynamic` in Task 3. `HeroWebGL` default export mounted in `page.tsx`. No prop drift.

**Perf note:** The whole point of P4 is bytes discipline — if Task 3 Step 3 shows three/R3F in the shared bundle, the dynamic import is being defeated (usually by a static `import` of `HeroCanvas` somewhere). The only import of `HeroCanvas` must be the `next/dynamic` one in `HeroWebGL`.
