'use client'

import { useEffect, useRef } from 'react'
import { shouldEnableCursor, magneticOffset } from '@/lib/motion'

export default function MagneticCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isCoarse = window.matchMedia('(pointer: coarse)').matches
    if (!shouldEnableCursor(prefersReduced, isCoarse)) return

    const dot = dotRef.current
    if (!dot) return

    document.documentElement.classList.add('has-custom-cursor')

    let raf = 0
    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let x = targetX
    let y = targetY

    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest('[data-magnetic]') as HTMLElement | null
      if (el) {
        const rect = el.getBoundingClientRect()
        const off = magneticOffset({ x: e.clientX, y: e.clientY }, rect, 0.3)
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        targetX = cx + off.x
        targetY = cy + off.y
        dot.classList.add('is-magnetic')
      } else {
        targetX = e.clientX
        targetY = e.clientY
        dot.classList.remove('is-magnetic')
      }
    }

    const tick = () => {
      x += (targetX - x) * 0.18
      y += (targetY - y) * 0.18
      dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove)
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('has-custom-cursor')
    }
  }, [])

  return <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
}
