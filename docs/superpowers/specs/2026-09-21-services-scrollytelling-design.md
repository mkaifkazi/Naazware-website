# Services page — sticky scrollytelling — design

**Date:** 2026-09-21
**Status:** approved (design), pending implementation
**Motivation:** the services list page renders each service as a plain stacked 2-column block (description + bullets left, tech chips right). Reads flat/normal. The service data already carries an unused narrative arc — `challenge`, `approach`, `result` — ideal for a storytelling treatment that pulls the visitor through each service.

## Concept

Each service becomes a **chapter**. A sticky aside (index number, icon, title, short description, tech chips, "Learn more") stays pinned while the three story beats — **The Challenge → Our Approach → The Result** — scroll past and reveal one by one. A progress line in the aside fills with scroll position through the chapter.

## Architecture

### `components/services/ServicesStory.tsx` (new, client component)

Renders the full list of services as chapters. Maps `services` (passed as prop from the server page, keeping the page a server component and data server-side).

Per chapter (`<article>`):
- **Layout:** `grid md:grid-cols-[0.9fr_1.1fr]`, generous vertical space so beats scroll under the pinned aside.
- **Sticky aside:** `md:sticky md:top-[16vh] md:self-start`. Contents: large ghosted index (`01`–`06`) behind, `ServiceIcon`, title, `shortDescription`, tech chips, `Learn more →` link to `/services/[slug]`, and a vertical **progress line**.
- **Beats column:** three beats, each numbered ①②③ with a step label (`The Challenge` / `Our Approach` / `The Result`) and body text. Each wrapped in the existing `Reveal` (IntersectionObserver, `.reveal` → `.is-visible`; reduced-motion forced-visible in CSS) so beats fade/slide in.

**Progress line** — framer-motion `useScroll({ target: chapterRef, offset: ['start center', 'end center'] })` → `useTransform` → `scaleY` on an `m.div` fill (transform-origin top). Matches the project's existing framer/LazyMotion stack (`m` component). No raw GSAP/ScrollTrigger needed → simpler, less pin jank than JS pinning.

**Reduced motion / mobile:**
- `useReducedMotion()` → progress fill rendered static (full height, no scroll binding); no scroll-linked motion. `Reveal` already self-disables via CSS.
- `<md` → single column, sticky off (`static`), reads top-to-bottom. Ghost number scaled down.

The chapter is a small, self-contained subcomponent (`Chapter`) inside the file so each `useScroll` ref is per-chapter (hooks can't live in a `.map` callback). `ServicesStory` maps services → `<Chapter>`.

### `app/(site)/services/page.tsx` (edit)

Replace only the services-list `<section>` (the `CardGridReveal` of stacked blocks) with `<ServicesStory services={services} />`. PageHeader, FAQ accordion, and CTA sections unchanged. Page stays a server component; passes `services` down.

## Data flow

Static. `services` from `lib/services-data.ts` passed as a prop. No new fields, no schema/DB/network change. Scroll state lives in framer motion values (no React re-render per frame).

## Error handling

Not applicable (no I/O). Degradation: no-JS/SSR → renders as static stacked chapters (sticky + Reveal are progressive); unsupported sticky → normal flow layout, still readable.

## Testing

- Gate stays green: 113 tests · type-check · lint · build.
- No new pure logic to unit test (presentation only). Rely on type-check + build.
- Manual (owed, real browser): scroll a chapter — aside pins, beats reveal in order, progress line fills; light + dark; reduced-motion → static, no scroll animation; mobile → stacked, no pin; keyboard/scroll reachable; no layout shift; `/services` route First Load within budget (<180kB).

## Perf notes

- Sticky = CSS, cheap. Progress via framer scroll motion values (compositor transform, no re-render). `Reveal` unobserves after first trigger.
- transform/opacity only → CLS-safe.

## Files touched

- **new** `components/services/ServicesStory.tsx`
- **edit** `app/(site)/services/page.tsx` (swap one section + pass `services`)
