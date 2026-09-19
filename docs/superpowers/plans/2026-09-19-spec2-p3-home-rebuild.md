# Spec 2 · Phase 3 — Home Rebuild (Implementation Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the home page to the approved 6-section SMB narrative (Hero → Problem → Services → Proof → Process → CTA) with rewritten light-first copy, a static poster hero (WebGL comes in P4), the existing `Reveal` motion, and one GSAP scroll-story beat (hero parallax + animated proof metrics).

**Architecture:** All home copy + section data moves into a single pure module `lib/home-content.ts` (testable shape/order), so `app/(site)/page.tsx` becomes thin composition. The new Problem section and the GSAP-driven pieces (hero parallax, metric count-up) are small focused components under `components/home/`. GSAP work reuses `shouldEnableMotion` from `lib/motion.ts` (P2) and is fully reduced-motion-safe. The existing IntersectionObserver `Reveal` + `.reveal` CSS stay the reveal workhorse; GSAP adds scroll-story on top, it does not replace `Reveal`.

**Tech Stack:** Next 14 App Router (RSC home + client motion islands), TypeScript, Tailwind, GSAP + ScrollTrigger (P2), Vitest (node env).

## Global Constraints

- Gate GREEN every task: `npm run test` (currently 76) · `npm run type-check` · `npm run lint` · `npm run build`.
- Buyer = SMB / local business (non-technical, trust + ROI). Copy is Claude-drafted, plain-English, outcome-led; the user edits later. No fabricated proof — proof section renders CMS data (`getFeaturedProjects`, `getTestimonials`), Ripple surfaces naturally as real featured work.
- Light-first look (P1). Serif display (Fraunces) headings. Teal-only accent.
- No WebGL in P3 — hero uses the existing static grid/glow as its poster; leave a clearly-marked seam for the P4 WebGL swap.
- Motion: reuse `Reveal`; any GSAP is `transform`/`opacity` only and gated by `shouldEnableMotion(prefersReduced)`.
- Vitest env is `node` — new tests must be pure (data-shape assertions on `home-content`).
- Keep existing `ServiceCard`, `CaseStudyCard`, `Reveal`, `services-data`, `content` APIs unchanged. Commit after every task. Branch: `feat/custom-cms`.

---

### Task 1: Home content module + tests

**Files:**
- Create: `lib/home-content.ts`
- Test: `lib/__tests__/home-content.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `HOME_SECTION_ORDER: readonly string[]` = `['hero','problem','services','proof','process','cta']`.
  - `hero: { eyebrow: string; headline: string; sub: string; primaryCta: {label:string;href:string}; secondaryCta: {label:string;href:string}; capabilities: string[] }`.
  - `problem: { eyebrow: string; heading: string; intro: string; points: {title:string;body:string}[] }` (3 points).
  - `sections: { services: SectionHead; proof: SectionHead; process: SectionHead; testimonials: SectionHead }` where `SectionHead = { eyebrow: string; heading: string; ctaLabel?: string; ctaHref?: string }`.
  - `process: { no: string; title: string; body: string }[]` (4 steps: Talk → Plan → Build → Launch & grow).
  - `cta: { heading: string; body: string; primary: {label:string;href:string} }`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/home-content.test.ts
import { describe, it, expect } from 'vitest'
import { HOME_SECTION_ORDER, hero, problem, sections, process, cta } from '@/lib/home-content'

describe('HOME_SECTION_ORDER', () => {
  it('is the approved 6-section SMB narrative in order', () => {
    expect(HOME_SECTION_ORDER).toEqual(['hero', 'problem', 'services', 'proof', 'process', 'cta'])
  })
})

describe('hero', () => {
  it('has SMB conversion copy and two CTAs', () => {
    expect(hero.headline.length).toBeGreaterThan(0)
    expect(hero.sub.length).toBeGreaterThan(0)
    expect(hero.primaryCta.href).toBe('/contact')
    expect(hero.secondaryCta.href).toBe('/work')
    expect(hero.capabilities.length).toBeGreaterThanOrEqual(3)
  })
})

describe('problem', () => {
  it('names the pain with exactly three points', () => {
    expect(problem.heading.length).toBeGreaterThan(0)
    expect(problem.points).toHaveLength(3)
    problem.points.forEach((p) => {
      expect(p.title.length).toBeGreaterThan(0)
      expect(p.body.length).toBeGreaterThan(0)
    })
  })
})

describe('sections', () => {
  it('provides heads for services, proof, process, testimonials', () => {
    ;(['services', 'proof', 'process', 'testimonials'] as const).forEach((k) => {
      expect(sections[k].eyebrow.length).toBeGreaterThan(0)
      expect(sections[k].heading.length).toBeGreaterThan(0)
    })
  })
})

describe('process', () => {
  it('is four ordered steps', () => {
    expect(process).toHaveLength(4)
    expect(process.map((s) => s.no)).toEqual(['01', '02', '03', '04'])
  })
})

describe('cta', () => {
  it('drives to contact', () => {
    expect(cta.heading.length).toBeGreaterThan(0)
    expect(cta.primary.href).toBe('/contact')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/__tests__/home-content.test.ts`
Expected: FAIL — cannot resolve `@/lib/home-content`.

- [ ] **Step 3: Write the content module**

```ts
// lib/home-content.ts
// Home page copy + section data. SMB / local-business voice, plain English,
// outcome-led. Draft — the user edits. Keep proof CMS-driven (no fabricated claims).

export const HOME_SECTION_ORDER = [
  'hero',
  'problem',
  'services',
  'proof',
  'process',
  'cta',
] as const

export type SectionHead = {
  eyebrow: string
  heading: string
  ctaLabel?: string
  ctaHref?: string
}

export const hero = {
  eyebrow: 'Digital studio for growing businesses',
  headline: 'Websites & software that win you customers.',
  sub: 'We design, build, and run the digital side of your business — so you get more enquiries, look the part, and stay ahead of your local competition.',
  primaryCta: { label: 'Get a free quote', href: '/contact' },
  secondaryCta: { label: 'See our work', href: '/work' },
  capabilities: ['Websites', 'Web & mobile apps', 'Branding', 'Care & hosting'],
}

export const problem = {
  eyebrow: 'The problem',
  heading: 'Your website should be your best salesperson.',
  intro: 'Most business websites quietly cost their owners customers every day. If any of this sounds familiar, you are leaving money on the table.',
  points: [
    {
      title: 'It looks dated',
      body: 'A slow, cluttered, or DIY-builder site makes a great business look small — and sends buyers straight to a competitor.',
    },
    {
      title: 'It brings no enquiries',
      body: 'Pretty is not the point. If your site is not turning visitors into calls and messages, it is just an expensive brochure.',
    },
    {
      title: 'It is a headache to run',
      body: 'You should not need a developer to change a price or add a photo. Most owners are stuck waiting — or paying — for tiny edits.',
    },
  ],
}

export const sections: Record<'services' | 'proof' | 'process' | 'testimonials', SectionHead> = {
  services: {
    eyebrow: 'What we do',
    heading: 'Everything you need to grow online, under one roof.',
    ctaLabel: 'All services',
    ctaHref: '/services',
  },
  proof: {
    eyebrow: 'Proof',
    heading: 'Real work. Real results.',
    ctaLabel: 'All projects',
    ctaHref: '/work',
  },
  process: {
    eyebrow: 'How it works',
    heading: 'A simple path from first chat to launch.',
  },
  testimonials: {
    eyebrow: 'Kind words',
    heading: 'Businesses that would work with us again.',
  },
}

export const process = [
  { no: '01', title: 'Talk', body: 'A free, no-jargon chat about your business, your goals, and what a better website or app could do for you.' },
  { no: '02', title: 'Plan', body: 'We map out exactly what you get, what it costs, and when it launches — in plain English, before any work starts.' },
  { no: '03', title: 'Build', body: 'We design and build in the open, showing you real screens as we go, so there are no surprises at the end.' },
  { no: '04', title: 'Launch & grow', body: 'We go live, keep it fast and secure, and are here whenever you need a change or want to do more.' },
]

export const cta = {
  heading: 'Ready to grow your business online?',
  body: 'Tell us what you need. We reply within 1 business day with honest advice, a clear plan, and a price — no pressure.',
  primary: { label: 'Get a free quote', href: '/contact' },
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- lib/__tests__/home-content.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Verify gate**

Run: `npm run type-check && npm run lint`
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add lib/home-content.ts lib/__tests__/home-content.test.ts
git commit -m "feat(home): SMB home content module + tests (Spec 2 P3)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Rebuild `app/(site)/page.tsx` to the 6-section narrative

**Files:**
- Create: `components/home/ProblemSection.tsx`
- Modify (rewrite): `app/(site)/page.tsx`

**Interfaces:**
- Consumes: `hero`, `problem`, `sections`, `process`, `cta` from `lib/home-content`; existing `ServiceCard`, `CaseStudyCard`, `Reveal`, `getFeaturedProjects`, `getTestimonials`, `services`.
- Produces: home page rendering the order Hero → Problem → Services → Proof (featured work + testimonials) → Process → CTA. Proof merges the old "Selected work" + "Testimonials" into one section group before Process.

- [ ] **Step 1: Create the Problem section component**

```tsx
// components/home/ProblemSection.tsx
import Reveal from '@/components/Reveal'
import { problem } from '@/lib/home-content'

export default function ProblemSection() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="container-px">
        <Reveal as="div" className="mb-14 max-w-2xl">
          <p className="eyebrow mb-4">{problem.eyebrow}</p>
          <h2 className="text-display-md">{problem.heading}</h2>
          <p className="mt-6 text-lg leading-relaxed text-paper-dim">{problem.intro}</p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {problem.points.map((point, i) => (
            <Reveal key={point.title} delay={(i % 3) * 80}>
              <div className="flex h-full flex-col rounded-3xl border border-ink-600 bg-ink-800/60 p-8">
                <span className="font-mono text-xs text-accent-soft">{`0${i + 1}`}</span>
                <h3 className="mt-4 text-lg font-semibold text-paper">{point.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-paper-dim">{point.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Rewrite the home page**

Replace the entire contents of `app/(site)/page.tsx` with:

```tsx
import Link from 'next/link'
import ServiceCard from '@/components/ServiceCard'
import CaseStudyCard from '@/components/CaseStudyCard'
import Reveal from '@/components/Reveal'
import ProblemSection from '@/components/home/ProblemSection'
import { services } from '@/lib/services-data'
import { getFeaturedProjects, getTestimonials } from '@/lib/content'
import { hero, sections, process, cta } from '@/lib/home-content'

export const revalidate = 60

export default async function HomePage() {
  const [featured, testimonials] = await Promise.all([getFeaturedProjects(), getTestimonials()])

  return (
    <>
      {/* ───────────── Hero (static poster — WebGL swaps in at P4) ───────────── */}
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
        {/* HERO-POSTER-SEAM: P4 mounts <HeroCanvas /> here behind this static layer */}
        <div className="grid-bg absolute inset-0" aria-hidden="true" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-1/4 left-1/2 h-[55vh] w-[55vh] -translate-x-1/2 rounded-full opacity-[0.12] blur-[150px]"
          style={{ background: 'radial-gradient(closest-side, rgb(var(--accent)), transparent)' }}
        />

        <div className="container-px relative flex flex-1 flex-col pt-28">
          <Reveal as="div" className="flex items-center justify-between border-b border-ink-600 pb-5">
            <span className="mono-label normal-case">
              <span className="relative mr-1 flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              {hero.eyebrow}
            </span>
            <span className="mono-label hidden sm:inline-flex">Vadodara, IN — Est. 2024</span>
          </Reveal>

          <div className="flex flex-1 flex-col justify-center py-14">
            <Reveal as="h1" className="text-display-xl max-w-[18ch] font-medium">
              {hero.headline}
            </Reveal>
            <Reveal
              as="div"
              delay={120}
              className="mt-12 flex flex-col gap-10 md:flex-row md:items-end md:justify-between"
            >
              <p className="max-w-md text-lg leading-relaxed text-paper-dim">{hero.sub}</p>
              <div className="flex shrink-0 flex-wrap items-center gap-5">
                <Link href={hero.primaryCta.href} className="btn-accent" data-magnetic>
                  {hero.primaryCta.label}
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href={hero.secondaryCta.href}
                  className="group inline-flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-paper underline-offset-8 hover:underline"
                >
                  {hero.secondaryCta.label}
                  <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">↗</span>
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal as="div" delay={200} className="grid grid-cols-2 border-t border-ink-600 md:grid-cols-4">
            {hero.capabilities.map((c, i) => (
              <div key={c} className={`flex items-baseline gap-3 py-6 ${i > 0 ? 'md:border-l md:border-ink-600 md:pl-6' : ''}`}>
                <span className="font-mono text-xs text-accent-soft">{`0${i + 1}`}</span>
                <span className="text-sm text-paper">{c}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ───────────── Problem ───────────── */}
      <ProblemSection />

      {/* ───────────── Services ───────────── */}
      <section className="relative py-24 md:py-32">
        <div className="container-px">
          <Reveal as="div" className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow mb-4">{sections.services.eyebrow}</p>
              <h2 className="text-display-md max-w-2xl">{sections.services.heading}</h2>
            </div>
            {sections.services.ctaHref && (
              <Link href={sections.services.ctaHref} className="btn-ghost shrink-0">
                {sections.services.ctaLabel}
              </Link>
            )}
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <Reveal key={service.slug} delay={(i % 3) * 80}>
                <ServiceCard
                  title={service.title}
                  description={service.shortDescription}
                  bullets={service.bullets}
                  href={`/services/${service.slug}`}
                  icon={service.icon}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Proof (featured work + testimonials) ───────────── */}
      <section className="relative border-y border-ink-600 bg-ink-950 py-24 md:py-32">
        <div className="container-px">
          <Reveal as="div" className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow mb-4">{sections.proof.eyebrow}</p>
              <h2 className="text-display-md max-w-2xl">{sections.proof.heading}</h2>
            </div>
            {sections.proof.ctaHref && (
              <Link href={sections.proof.ctaHref} className="btn-ghost shrink-0">
                {sections.proof.ctaLabel}
              </Link>
            )}
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2">
            {featured.map((study, i) => (
              <Reveal key={study.slug} delay={(i % 2) * 100}>
                <CaseStudyCard
                  title={study.title}
                  client={study.client}
                  industry={study.industry}
                  excerpt={study.excerpt}
                  href={`/work/${study.slug}`}
                  metrics={study.metrics}
                  index={i}
                  coverUrl={study.coverUrl}
                />
              </Reveal>
            ))}
          </div>

          {testimonials.length > 0 && (
            <>
              <Reveal as="div" className="mb-10 mt-24">
                <p className="eyebrow mb-4">{sections.testimonials.eyebrow}</p>
                <h3 className="text-display-sm max-w-2xl">{sections.testimonials.heading}</h3>
              </Reveal>
              <div className="grid gap-6 lg:grid-cols-3">
                {testimonials.map((t, i) => (
                  <Reveal key={t.author} delay={(i % 3) * 80}>
                    <figure className="flex h-full flex-col rounded-3xl border border-ink-600 bg-ink-800/60 p-8">
                      <svg className="h-8 w-8 text-accent/50" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M9.5 5C6.5 6.5 5 9 5 12.5V19h6v-6H8c0-2 1-3.5 3-4.5L9.5 5Zm10 0C16.5 6.5 15 9 15 12.5V19h6v-6h-3c0-2 1-3.5 3-4.5L19.5 5Z" />
                      </svg>
                      <blockquote className="mt-6 flex-1 text-lg leading-relaxed text-paper">
                        &ldquo;{t.quote}&rdquo;
                      </blockquote>
                      <figcaption className="mt-8">
                        <div className="font-medium text-paper">{t.author}</div>
                        <div className="text-sm text-paper-dim">{t.role}</div>
                      </figcaption>
                    </figure>
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ───────────── Process ───────────── */}
      <section className="relative py-24 md:py-32">
        <div className="container-px">
          <Reveal as="div" className="mb-14">
            <p className="eyebrow mb-4">{sections.process.eyebrow}</p>
            <h2 className="text-display-md max-w-2xl">{sections.process.heading}</h2>
          </Reveal>

          <div className="grid gap-px overflow-hidden rounded-4xl border border-ink-600 bg-ink-600 md:grid-cols-2 lg:grid-cols-4">
            {process.map((step, i) => (
              <Reveal key={step.no} delay={i * 80} className="bg-ink-900">
                <div className="flex h-full flex-col p-8">
                  <span className="font-display text-5xl font-semibold text-accent/30">{step.no}</span>
                  <h3 className="mt-6 text-lg font-semibold text-paper">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-paper-dim">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Final CTA ───────────── */}
      <section className="relative overflow-hidden py-28 md:py-36">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[130px]"
          style={{ background: 'radial-gradient(closest-side, rgb(var(--accent)), transparent)' }}
        />
        <div className="container-px relative text-center">
          <Reveal as="div" className="mx-auto max-w-3xl">
            <h2 className="text-display-lg text-gradient">{cta.heading}</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-paper-dim">{cta.body}</p>
            <div className="mt-10 flex justify-center">
              <Link href={cta.primary.href} className="btn-accent" data-magnetic>
                {cta.primary.label}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 3: Verify gate**

Run: `npm run test && npm run type-check && npm run lint && npm run build`
Expected: all pass. Home builds with the new section order.

- [ ] **Step 4: Manual check (user, browser)**

`npm run dev` → `/` shows Hero → Problem → Services → Proof (work + testimonials) → Process → CTA, all with SMB copy in light mode; Reveal animations fire on scroll; primary CTAs carry `data-magnetic` (cursor grows near them).

- [ ] **Step 5: Commit**

```bash
git add "app/(site)/page.tsx" components/home/ProblemSection.tsx
git commit -m "feat(home): rebuild to 6-section SMB narrative + Problem section (Spec 2 P3)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: GSAP scroll-story — hero parallax + animated proof metrics

**Files:**
- Create: `components/home/HeroParallax.tsx`
- Create: `components/home/StatCountUp.tsx`
- Modify: `app/(site)/page.tsx` (mount HeroParallax over the hero poster; no other structural change)

**Interfaces:**
- Consumes: `shouldEnableMotion` from `lib/motion`; `gsap` + `ScrollTrigger`.
- Produces:
  - `HeroParallax` — a client component that GSAP-parallaxes the hero glow/grid layer on scroll (subtle `y` translate), motion-safe.
  - `StatCountUp({ value, className }: { value: string; className?: string })` — client component that counts a numeric metric up when it scrolls into view; renders the raw `value` immediately (and permanently) under reduced-motion or when `value` has no leading number.

- [ ] **Step 1: Create `StatCountUp`**

```tsx
// components/home/StatCountUp.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { shouldEnableMotion } from '@/lib/motion'

/**
 * Counts a numeric metric up on scroll-in. `value` may carry a prefix/suffix
 * (e.g. "60%", "3x", "+40%") — the numeric part animates, affixes are kept.
 * Falls back to the static value under reduced-motion or if there's no number.
 */
export default function StatCountUp({ value, className = '' }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const match = value.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/)
    if (!shouldEnableMotion(prefersReduced) || !match) {
      setDisplay(value)
      return
    }
    const [, prefix, numStr, suffix] = match
    const target = parseFloat(numStr)
    const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0
    const el = ref.current
    if (!el) return

    let raf = 0
    let start = 0
    const duration = 1200
    let began = false

    const step = (t: number) => {
      if (!start) start = t
      const p = Math.min((t - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(`${prefix}${(target * eased).toFixed(decimals)}${suffix}`)
      if (p < 1) raf = requestAnimationFrame(step)
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !began) {
            began = true
            raf = requestAnimationFrame(step)
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.5 }
    )
    io.observe(el)

    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value])

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  )
}
```

- [ ] **Step 2: Create `HeroParallax`**

```tsx
// components/home/HeroParallax.tsx
'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { shouldEnableMotion } from '@/lib/motion'

/**
 * Subtle scroll parallax for the hero's decorative layer.
 * No-op under reduced motion. Purely decorative (aria-hidden layer it targets).
 */
export default function HeroParallax() {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!shouldEnableMotion(prefersReduced)) return

    const el = ref.current
    if (!el) return

    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.to(el, {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: {
          trigger: el.parentElement,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
    })

    return () => ctx.revert()
  }, [])

  return <div ref={ref} className="pointer-events-none absolute inset-0" aria-hidden="true" />
}
```

- [ ] **Step 3: Wire `HeroParallax` into the hero + use `StatCountUp` for metrics**

In `app/(site)/page.tsx`:

Add the imports:

```tsx
import HeroParallax from '@/components/home/HeroParallax'
```

Wrap the hero's decorative glow div inside `HeroParallax` (replace the standalone glow `<div aria-hidden>` in the hero with the parallax layer containing it), keeping the static grid as the poster base:

```tsx
{/* HERO-POSTER-SEAM: P4 mounts <HeroCanvas /> here behind this static layer */}
<div className="grid-bg absolute inset-0" aria-hidden="true" />
<HeroParallax />
<div
  aria-hidden="true"
  className="pointer-events-none absolute -top-1/4 left-1/2 h-[55vh] w-[55vh] -translate-x-1/2 rounded-full opacity-[0.12] blur-[150px]"
  style={{ background: 'radial-gradient(closest-side, rgb(var(--accent)), transparent)' }}
/>
```

Metrics count-up is handled inside `CaseStudyCard` if it renders `metrics`. If `CaseStudyCard` renders metric values as plain text, wrap the value with `StatCountUp` there. **Inspect `components/CaseStudyCard.tsx` first**: if it maps `metrics` to `{m.value}`, replace that with `<StatCountUp value={m.value} />` (import it). If metrics are rendered differently, adapt the same one-line swap. Do not change the card's layout or props.

- [ ] **Step 4: Verify gate**

Run: `npm run test && npm run type-check && npm run lint && npm run build`
Expected: all pass (test count unchanged — GSAP/count-up logic is exercised via the pure `shouldEnableMotion` + the regex fallback path; no new unit test required, behavior is visual).

- [ ] **Step 5: Manual check (user, browser)**

Desktop: hero glow drifts subtly on scroll; proof metric numbers count up when they enter view. Reduced-motion on: no parallax, metrics show final values immediately. Mobile: no jank, values correct.

- [ ] **Step 6: Commit**

```bash
git add components/home/HeroParallax.tsx components/home/StatCountUp.tsx "app/(site)/page.tsx" components/CaseStudyCard.tsx
git commit -m "feat(home): GSAP hero parallax + scroll count-up metrics, motion-safe (Spec 2 P3)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage (Section 1 narrative + Section 6 P3):**
- 6-section order Hero → Problem → Services → Proof → Process → CTA → `HOME_SECTION_ORDER` (Task 1) + page rebuild (Task 2). ✓
- Rewritten SMB copy → `home-content.ts` (Task 1), consumed everywhere (Task 2). ✓
- New Problem section → Task 2 (`ProblemSection`). ✓
- Proof = Ripple/featured work + testimonials, CMS-driven, no fabrication → Task 2 (renders `getFeaturedProjects`/`getTestimonials`). ✓
- GSAP scroll-story → Task 3 (hero parallax + count-up). ✓
- Reveals kept → `Reveal` used throughout. ✓
- Static poster hero, WebGL deferred → Task 2 leaves `HERO-POSTER-SEAM` marker for P4. ✓
- Motion-safe → `shouldEnableMotion` gates Task 3; `Reveal`/CSS already reduced-motion-safe. ✓

**Placeholder scan:** none. Task 3 Step 3 contains a conditional ("inspect CaseStudyCard, swap the metric value line") — this is a concrete, bounded instruction with the exact edit, not a placeholder; the metric-count-up is a nice-to-have that degrades to plain text if the card structure differs.

**Type consistency:** `hero`/`problem`/`sections`/`process`/`cta` shapes defined in Task 1 match their consumption in Task 2. `StatCountUp` prop `{ value: string }` matches `Metric.value: string` from `lib/content`. `HeroParallax` renders a decorative layer; no props. `shouldEnableMotion` signature matches P2.

**Scope note:** P3 is a single home page + 3 small components + one content module — appropriately sized for one plan. Other pages (work/services/about/journal/legal) are P6, correctly excluded.
