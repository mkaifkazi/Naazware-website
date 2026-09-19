'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { LENIS_DEFAULTS, shouldEnableMotion } from '@/lib/motion'

/**
 * Site-wide smooth scroll (Lenis) synced to GSAP ScrollTrigger.
 * Skipped entirely when the user prefers reduced motion.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!shouldEnableMotion(prefersReduced)) return

    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis(LENIS_DEFAULTS)
    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [])

  return null
}
