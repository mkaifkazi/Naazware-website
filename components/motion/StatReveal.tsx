'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'
import { countUpValue } from '@/lib/motion-anim'

export default function StatReveal({
  to,
  prefix = '',
  suffix = '',
  className = '',
  durationMs = 1400,
}: {
  to: number
  prefix?: string
  suffix?: string
  className?: string
  durationMs?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const reduced = useReducedMotion()
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduced) {
      setVal(to)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs)
      setVal(countUpValue(to, p))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduced, to, durationMs])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {Math.round(val)}
      {suffix}
    </span>
  )
}
