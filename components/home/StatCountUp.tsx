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
