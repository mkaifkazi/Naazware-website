# Spec — Site-wide Visual & Motion System ("Silk + Archetype Motion")

**Date:** 2026-09-20
**Status:** APPROVED (design). Author: Claude + user (Mkaif).
**Supersedes/extends:** Spec 2 public redesign (`2026-09-19-spec2-public-redesign-design.md`). This is a follow-on visual/motion layer on the finished Spec 2 site.

## 1. Problem & Goal

Today only the home page feels alive. Every other page (`/about`, `/services`, `/work`, `/blog`, `/contact`, legal) is visually plain: text and cards sit static, the signature silk/WebGL treatment exists only on the home hero, and the palette is mono-teal. Sections feel bare.

**Goal:** give the whole site a cohesive, premium, *alive* feel — a shared flowing gradient-silk backdrop, tasteful decorative accents, a richer multi-hue palette, and real entrance motion on text and cards on every page — **without** turning it into a playful/cartoon agency site and **without** blowing the performance budget.

**Non-goals:** no cartoon 3D people, no confetti/memphis clutter, no per-page bespoke redesigns, no rebrand away from the premium studio identity (Fraunces serif, elevation, teal brand accent). This is not a content or CMS change.

## 2. Design Decisions (locked with user)

1. **Silk motif role:** recurring soft **background motif** behind sections on every page (Option 1), perf-light.
2. **Colour:** **one rich multi-hue gradient everywhere** (Option 2) — same colours site-wide, varied only by composition/angle per page. Expands past the old teal-only decision (user explicitly approved).
3. **Rendering:** WebGL flowing-silk when the device is capable; **CSS gradient-mesh fallback** otherwise. WebGL reserved for a single shared canvas — never one per section.
4. **Aesthetic level:** keep premium studio, **borrow the richness** (Option 1 of the playful-vs-premium fork) — subtle floating shapes + soft colour blobs, elegant, no confetti/illustrations.
5. **Content motion:** **signature-move-per-section-type** (Option 3) — each section archetype has its own entrance, applied by type across the site.

## 3. Palette Expansion

Add a shared gradient ramp as CSS custom properties in `styles/globals.css`, both light (`:root`) and dark (`[data-theme='dark']` / existing dark block):

- `--silk-1`: teal `#2DD4BF` (45 212 191)
- `--silk-2`: sky `#38BDF8` (56 189 248)
- `--silk-3`: violet `#8B5CF6` (139 92 246)

Rules:
- **Teal remains the brand accent** — `--accent*`, buttons (`.btn-accent`), links, focus rings unchanged. The new ramp is for *backdrops and decorative accents only*, not primary UI controls.
- Provide slightly de-saturated / lower-alpha values for **light** theme so backdrops stay soft behind AA text; richer/more luminous for **dark**.
- Expose a Tailwind mapping (`silk.1/2/3`) in `tailwind.config.ts` mirroring the existing `accent` mapping pattern.
- **Contrast is a hard gate:** body/heading text over any backdrop must stay ≥ AA. Backdrops render at low opacity with a paper/ink wash between silk and content.

## 4. Components & Files

All new visual code lives under `components/visual/` and `components/motion/`; pure helpers under `lib/`.

### 4.1 `components/visual/SilkBackground.tsx`
One shared backdrop, mounted once per page (via layout slot or per-page), `z-0`, `pointer-events-none`, `aria-hidden`.

- **Props:** `{ variant?: 'hero' | 'ambient'; angle?: number; scale?: number; offset?: { x: number; y: number }; intensity?: number }`. Defaults documented in the plan. Per-page composition variation comes only from these props — colours are constant.
- **Capable path:** WebGL flowing-silk via R3F (reuse pinned `@react-three/fiber@^8` / `drei@^9` — React 18). New silk shader/geometry (a slowly undulating gradient plane / layered curved ribbons using the `--silk-*` ramp). Loaded with `next/dynamic` `ssr:false`, lazy — never blocks first paint.
- **Fallback path:** `components/visual/SilkFallback.tsx` — pure CSS: layered `radial-gradient` + `linear-gradient` using the silk ramp, animated by a **very slow** (`~40–60s`) `@keyframes` background-position / opacity drift. This is the default for mobile / coarse-or-small / reduced-motion / save-data / no-webgl.
- **Gate:** reuse/extend `shouldRenderWebGL()` from `lib/motion.ts` (already exists). Under reduced-motion the fallback renders **static** (no drift).
- **Single-canvas rule:** at most one WebGL context alive at a time site-wide. If the home WebGL hero is present on a page, the ambient backdrop on that page uses the CSS fallback (no second context).

### 4.2 `components/visual/Accents.tsx` (+ small sub-parts)
Decorative layer, `aria-hidden`, `pointer-events-none`, killed under reduced-motion.

- **Blobs:** blurred gradient orbs (silk ramp, low alpha) positioned behind select sections.
- **Floating shapes:** a few thin geometric line-forms (rings/arcs, SVG or bordered divs), slow drift + subtle scroll parallax (transform only).
- Composition is prop-driven so different sections show different arrangements. Premium/restrained — a handful per page, not scattered clutter.

### 4.3 `components/motion/` — archetype primitives
Reusable, composed by section type. Built on framer-motion + existing `Reveal` + Lenis. All transform/opacity, `EASE_OUT_EXPO` from `lib/motion.ts`. Every primitive collapses to instant/simple fade under reduced-motion (CSS-forced, matching current `.reveal` behaviour).

| Primitive | Used by archetype | Signature move |
|---|---|---|
| `<HeadingReveal>` | Hero / PageHeader | word-by-word clip-mask rise; eyebrow first, CTA last |
| `<CardGridReveal>` | services, work, blog, problem, process card grids | stagger children, each fade + y-16 + scale 0.96→1, ~60ms apart |
| `useCountUp` + `<StatReveal>` | stats / metrics | count-up number + label underline sweep |
| `<QuoteReveal>` | testimonial / quote | quote-mark scale-in, line-clip text reveal, portrait fade |
| `<CtaReveal>` | CTA band | backdrop blob swell, heading rise, one magnetic button pulse |
| `<ProseReveal>` | blog article, legal | minimal paragraph fade-up stagger |
| `<MediaReveal>` | work detail images | clip-path wipe reveal + gentle scroll parallax |
| `<AccordionReveal>` | contact FAQ | rows stagger in; smooth height ease on open |

### 4.4 `lib/silk.ts` (pure helpers, unit-tested)
- Composition math: turn `{ angle, scale, offset, intensity }` into deterministic transform/gradient values (pure function → unit-testable).
- Any shared clamp/normalise for props.
- (Count-up + gate logic reuse/extend `lib/motion.ts`.)

## 5. Per-page Rollout

Silk backdrop on **all** pages (per-page composition props); archetypes applied by section type.

| Page | Archetypes present |
|---|---|
| `/` home | Hero (WebGL) + card-grids (problem/services/process) + stats + quote/testimonials + CTA. Retrofit existing sections to the new primitives; keep the WebGL hero. |
| `/about` | Hero + values card-grid + prose + stats |
| `/services` | Hero + card-grid + CTA |
| `/services/[slug]` | Hero + prose + media + CTA |
| `/work` | Hero + card-grid (projects) + CTA |
| `/work/[slug]` | Hero + media-showcase + prose + CTA |
| `/blog` | Hero + card-grid (posts) |
| `/blog/[slug]` | Hero + prose |
| `/contact` | Hero + form + FAQ accordion |
| `/privacy`, `/terms` | Hero + prose (lightest — backdrop + prose reveal only) |

Existing `Reveal` wrappers get replaced/augmented by the archetype primitives where a richer move applies; prose pages keep it minimal.

## 6. Performance (hard acceptance gates, mobile mid-tier)

- Lighthouse perf **≥ 90** (mobile) · LCP **< 2.5s** · CLS **< 0.1** · TBT **< 200ms**.
- Initial JS excluding the WebGL chunk **< ~180KB gzipped**; `three`/R3F stay code-split, never in the shared bundle (already true — must remain true).
- Single shared WebGL canvas site-wide; backdrop + accents lazy, `ssr:false`.
- Only `transform`/`opacity` animated; no layout-thrashing properties. Media via `next/image` (AVIF/WebP, sized) → CLS safe.
- Decorative layer and drift animations are cheap (blur/opacity/transform); capped count per page.

## 7. Accessibility & Fallback Ladder

- **Fallback ladder:** full (desktop, GPU) = WebGL silk + all archetype motion → no-WebGL (CSS gradient-mesh silk + motion) → `prefers-reduced-motion` (static gradient, instant/simple reveals, no drift, no parallax) → no-JS (SSR content fully readable; backdrop is decorative only).
- All backdrop/accent layers `aria-hidden` + `pointer-events-none`.
- Text contrast ≥ AA over every backdrop composition, light and dark.
- Reduced-motion path reuses the existing CSS-forced visible-state mechanism (`.reveal` already does this).

## 8. Testing

- **Unit (Vitest):** pure helpers — `lib/silk.ts` composition math, count-up stepping, WebGL/motion gate logic. Deterministic, no DOM.
- **Visual:** puppeteer-core screenshots (scratchpad `shot.js`/`hero.js` pattern already in repo) for the silk backdrop + fallback across themes; verify text legibility.
- **Motion:** manual real-browser click-through per archetype, light + dark, plus reduced-motion emulation.
- **Gate stays green:** `npm run test` · `type-check` · `lint` · `build` after every phase.

## 9. Phasing (each independently shippable)

The plan (writing-plans) will decompose into sub-phases:

- **VP1 — Palette & tokens:** `--silk-*` vars (light+dark), Tailwind mapping, contrast check. No visual motion yet.
- **VP2 — SilkBackground:** `lib/silk.ts` helpers (TDD) + `SilkFallback` (CSS) + `SilkBackground` WebGL path + gate wiring. Ship with backdrop on one page to prove it.
- **VP3 — Motion primitives:** `components/motion/*` archetype components (+ `useCountUp`), reduced-motion behaviour, unit-tested helpers.
- **VP4 — Decorative layer:** `Accents.tsx` blobs + floating shapes, parallax.
- **VP5 — Page rollout:** apply backdrop + archetypes page-by-page (home retrofit first, then about/services/work/blog/contact/legal).
- **VP6 — Perf pass:** Lighthouse mobile, bundle check, CLS/LCP verification; tune intensity/lazy-loading to hold gates.

## 10. Open items / risks

- **WebGL silk shader quality vs CSS fallback parity:** the two paths should read as the *same* motif at different fidelity — the plan must define the CSS fallback to visibly echo the WebGL composition, not diverge.
- **Contrast at low opacity:** must be validated per theme during VP1/VP2, not assumed.
- **Bundle creep:** framer-motion is already a dep; adding archetype components must not pull `three` into the shared chunk. Verify in VP6.
- Copy remains user-owned; this spec changes presentation only.
