# Glass + glow card system — design

**Date:** 2026-09-21
**Status:** approved (design), pending implementation
**Motivation:** current cards read flat/simple. They use `.card-surface` (opaque solid bg + border + shadow, 1px hover lift). Being opaque, they hide the site-wide silk backdrop, killing depth. Goal: premium frosted-glass cards with an animated gradient border and a cursor-tracking spotlight, unified across the whole site as one primitive.

## Scope

All four `.card-surface` usages migrate to one shared primitive:

1. `components/ServiceCard.tsx` — `<Link>` card (icon, title, bullets, "Learn more").
2. `components/CaseStudyCard.tsx` — `<Link>` card (gradient cover + body + metric tiles).
3. `components/home/ProblemSection.tsx` — inline `<div>` cards (number + title + body).
4. `app/(site)/page.tsx` — inline testimonial `<figure>` cards (quote mark + blockquote + author).

**Out of scope:** Process section (deliberate seamless hairline `gap-px` grid, not a `.card-surface` — left untouched). Admin card UI (internal tooling). `.card-surface` class itself stays defined (may be referenced elsewhere) but the four spots above stop using it.

## Architecture

### `components/GlassCard.tsx` (new, client component)

One polymorphic primitive. Owns the glass surface + spotlight interaction; content is passed as children.

- **Polymorphic `as`** — renders `Link` (default when `href` given), `div`, or `figure`. Prop passthrough (`href`, `className`, `aria-*`, etc.). Type via generic `as` prop; keep it small.
- **Spotlight** — single `onPointerMove` handler sets CSS custom props `--mx`, `--my` (percentages of card box) on the root element, rAF-throttled, written imperatively via a ref. **No React state → no re-render on move.** `onPointerLeave` fades the spotlight out (sets an `--spot` opacity var to 0).
- **Reduced motion** — `useReducedMotion()`; when true, skip the pointer listener entirely and render a static glass card (no spotlight, no lift). CSS `@media (prefers-reduced-motion: reduce)` also hard-disables the moving/lift bits as a belt-and-suspenders.
- **Touch / no fine pointer** — pointer events simply never fire a meaningful spotlight; static glass still looks correct. No extra branching needed.

### `.glass-card` CSS (new, in `styles/globals.css`)

Pure-CSS visuals, both themes, driven by existing tokens (`--ink-*`, `--paper-*`, `--silk-1/2/3`, `--shadow-card*`):

- **Surface** — translucent bg (`rgb(var(--ink-800) / ~0.55)` dark, higher alpha light) + `backdrop-filter: blur()` so the silk shows through. `box-shadow: var(--shadow-card)`.
- **Gradient border** — hairline gradient using `--silk-*`, via a masked pseudo-element (`border` box masked with `padding-box`/`content-box` composite) so the fill stays glass. Dim at rest; opacity ramps up on hover.
- **Top edge highlight** — subtle inset light line for real glass lip.
- **Spotlight layer** — `::before` (or a child span) with `radial-gradient` centered at `var(--mx) var(--my)`, opacity `var(--spot, 0)`, `pointer-events:none`, `mix-blend` soft. Uses `--silk` hue so it matches the palette.
- **Hover** — `transform: translateY(-6px)`, `--shadow-card-hover`, border-glow opacity to full. Transition on transform/opacity/box-shadow only (CLS-safe).

Modifier hooks (data attrs or extra classes) for per-card accents so the primitive stays generic:
- ServiceCard: icon tile gains gradient glow ring on hover.
- CaseStudyCard: metric tiles become mini glass tiles; spotlight scoped to body.
- Testimonial: quote-mark color tracks accent on hover.
- ProblemSection: number `0N` gets glow on hover.

## Data flow

Static/props only. No new data, no network, no server changes. `GlassCard` is presentation; existing content props unchanged. Spotlight state lives in the DOM (CSS vars), never in React.

## Error handling

Not applicable (no I/O). Degradation paths: reduced-motion → static; no-JS/SSR → renders as static glass (surface + border are pure CSS; spotlight is a no-op until hydrated); unsupported `backdrop-filter` → translucent bg still legible over silk (acceptable fallback).

## Testing

- Existing gate must stay green: 113 tests · type-check · lint · build.
- Unit: if any pure helper is extracted (e.g. clamp/format for pointer→percent), test it. If logic stays trivially inline in the component, no new unit test (nothing pure to assert) — rely on type-check + build.
- Manual (owed, real GPU browser, per handover convention): hover spotlight tracks pointer on all four card types; border glow ignites on hover; light + dark both correct; reduced-motion → static, no lift/spotlight; touch → static glass; no layout shift; home First Load JS stays within budget (<180kB routes).

## Perf notes

- One pointer listener per hovered card, rAF-throttled, writes 2–3 CSS vars. No React re-render.
- `backdrop-filter: blur()` on multiple cards has GPU cost; keep blur radius modest and avoid stacking heavy filters. Silk backdrop is CSS fallback site-wide, so no WebGL contention.
- Transform/opacity only for motion → no reflow, CLS-safe. Images already aspect-ratio'd.

## Files touched

- **new** `components/GlassCard.tsx`
- **edit** `styles/globals.css` (add `.glass-card` + accents + reduced-motion guard)
- **edit** `components/ServiceCard.tsx`
- **edit** `components/CaseStudyCard.tsx`
- **edit** `components/home/ProblemSection.tsx`
- **edit** `app/(site)/page.tsx` (testimonial figure)
