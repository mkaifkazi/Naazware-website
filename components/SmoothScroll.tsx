'use client'

import { useEffect, useRef } from 'react'

export default function SmoothScroll() {
  const scrollRef = useRef<{ destroy: () => void } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Honour user's reduced-motion preference: skip Lenis/locomotive smoothing entirely.
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    let active = true
    // @ts-expect-error - locomotive-scroll ships without bundled types
    import('locomotive-scroll').then((LocomotiveScroll) => {
      if (!active) return
      scrollRef.current = new LocomotiveScroll.default({
        lenisOptions: {
          duration: 1.1,
          smoothWheel: true,
          smoothTouch: false,
        },
      })
    })

    return () => {
      active = false
      scrollRef.current?.destroy()
    }
  }, [])

  return null
}
