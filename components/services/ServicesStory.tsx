'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { m, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import ServiceIcon from '@/components/ServiceIcon'
import Reveal from '@/components/Reveal'
import type { Service } from '@/lib/services-data'

/**
 * Services as scroll-driven chapters. Each service pins an aside (index, icon,
 * title, tech, CTA) while its three story beats — Challenge → Approach → Result
 * — scroll past and reveal one by one. A progress line in the aside fills with
 * scroll position through the chapter.
 *
 * Pin = CSS `position: sticky` (robust, no JS pin). Progress = framer useScroll
 * (compositor transform, no per-frame re-render). Reduced motion → static fill,
 * no scroll binding; <md → single column, sticky off. Presentation only.
 */
function Chapter({ service, index }: { service: Service; index: number }) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start center', 'end center'],
  })
  const fillHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  const beats = [
    { step: '01', label: 'The Challenge', body: service.challenge },
    { step: '02', label: 'Our Approach', body: service.approach },
    { step: '03', label: 'The Result', body: service.result },
  ]

  return (
    <article
      ref={ref}
      id={service.slug}
      className="scroll-mt-28 border-t border-ink-600/60 py-16 md:py-24"
    >
      <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
        {/* Sticky aside */}
        <div className="relative md:sticky md:top-[16vh] md:self-start">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 right-0 select-none font-display text-8xl font-bold leading-none text-paper/[0.04] md:text-[10rem]"
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          <div className="relative grid grid-cols-[auto_1fr] gap-5">
            {/* Progress rail */}
            <div className="relative my-1 hidden w-[2px] rounded-full bg-ink-600 md:block">
              {reduced ? (
                <div className="absolute inset-x-0 top-0 h-full rounded-full bg-accent" />
              ) : (
                <m.div
                  className="absolute inset-x-0 top-0 rounded-full bg-accent shadow-[0_0_12px_rgb(var(--accent)/0.7)]"
                  style={{ height: fillHeight }}
                >
                  <span className="absolute -bottom-[3px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_10px_rgb(var(--accent)/0.9)]" />
                </m.div>
              )}
            </div>

            <div>
              <span className="relative z-10 grid h-14 w-14 place-items-center rounded-2xl border border-accent/30 bg-accent/10 text-accent shadow-[0_0_28px_-8px_rgb(var(--accent)/0.5)] backdrop-blur-md">
                <ServiceIcon name={service.icon} className="h-6 w-6" />
              </span>
              <h2 className="mt-6 text-3xl font-semibold text-paper md:text-4xl">
                {service.title}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-paper-dim">
                {service.shortDescription}
              </p>

              <ul className="mt-7 space-y-3 border-t border-ink-600/70 pt-7">
                {service.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-paper-dim">
                    <svg className="mt-1 h-4 w-4 shrink-0 text-accent-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-wrap gap-2.5 border-t border-ink-600/70 pt-7">
                {service.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-ink-600 bg-ink-800/60 px-3.5 py-1.5 text-sm text-paper-dim"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <Link
                href={`/services/${service.slug}`}
                className="btn-accent mt-8 !px-6 !py-3 text-sm"
              >
                Learn more
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Story beats */}
        <div className="space-y-6 md:space-y-10">
          {beats.map((b, i) => (
            <Reveal key={b.step} delay={i * 80}>
              <div className="glass-panel p-8 md:p-10">
                <div className="flex items-center gap-4">
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-accent/40 font-mono text-sm text-accent-soft">
                    {b.step}
                  </span>
                  <span className="text-sm font-medium uppercase tracking-[0.18em] text-paper-dim">
                    {b.label}
                  </span>
                </div>
                <p className="mt-5 text-lg leading-relaxed text-paper">{b.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </article>
  )
}

export default function ServicesStory({ services }: { services: Service[] }) {
  return (
    <section className="container-px pb-12">
      {services.map((service, i) => (
        <Chapter key={service.slug} service={service} index={i} />
      ))}
    </section>
  )
}
