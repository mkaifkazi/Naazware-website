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

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div
        className="absolute -top-1/4 left-1/2 h-[55vh] w-[55vh] -translate-x-1/2 rounded-full opacity-[0.12] blur-[150px]"
        style={{ background: 'radial-gradient(closest-side, rgb(var(--accent)), transparent)' }}
      />
    </div>
  )
}
