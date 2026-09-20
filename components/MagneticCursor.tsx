'use client'

import { useEffect, useRef } from 'react'
import { shouldEnableCursor } from '@/lib/motion'

export default function MagneticCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isCoarse = window.matchMedia('(pointer: coarse)').matches
    if (!shouldEnableCursor(prefersReduced, isCoarse)) return

    const dot = dotRef.current
    if (!dot) return

    let revealed = false

    // Dot tracks the pointer 1:1 — no easing, no magnetic pull, normal speed.
    const onMove = (e: PointerEvent) => {
      if (!revealed) {
        revealed = true
        document.documentElement.classList.add('has-custom-cursor')
      }
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`
    }

    window.addEventListener('pointermove', onMove)

    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.classList.remove('has-custom-cursor')
    }
  }, [])

  return <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
}
