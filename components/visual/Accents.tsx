'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { buildAccents, type AccentPreset, type Blob, type Shape } from '@/lib/accents'

// Layered to avoid transform conflicts: outer = framer parallax `y`,
// middle = static centering translate, inner = CSS float animation + visual.
function ParallaxItem({
  depth,
  x,
  y,
  progress,
  reduced,
  children,
}: {
  depth: number
  x: number
  y: number
  progress: MotionValue<number>
  reduced: boolean
  children: React.ReactNode
}) {
  const shift = useTransform(progress, [0, 1], [0, reduced ? 0 : -depth * 60])
  return (
    <motion.div className="absolute" style={{ left: `${x}%`, top: `${y}%`, y: shift }}>
      <div style={{ transform: 'translate(-50%, -50%)' }}>{children}</div>
    </motion.div>
  )
}

function BlobEl({ b, progress, reduced }: { b: Blob; progress: MotionValue<number>; reduced: boolean }) {
  return (
    <ParallaxItem depth={b.depth} x={b.x} y={b.y} progress={progress} reduced={reduced}>
      <div
        className={reduced ? '' : 'animate-accent-float'}
        style={{
          width: b.size,
          height: b.size,
          borderRadius: '9999px',
          filter: 'blur(90px)',
          background: `radial-gradient(closest-side, rgb(var(--silk-${b.color}) / ${b.opacity}), transparent)`,
        }}
      />
    </ParallaxItem>
  )
}

function ShapeEl({ s, progress, reduced }: { s: Shape; progress: MotionValue<number>; reduced: boolean }) {
  const stroke = 'rgb(var(--silk-2) / 0.35)'
  return (
    <ParallaxItem depth={s.depth} x={s.x} y={s.y} progress={progress} reduced={reduced}>
      <div style={{ transform: `rotate(${s.rotate}deg)` }}>
        <svg viewBox="0 0 100 100" width={s.size} height={s.size} fill="none">
          {s.kind === 'ring' ? (
            <circle cx="50" cy="50" r="44" stroke={stroke} strokeWidth="1.5" />
          ) : (
            <path d="M6 50 A44 44 0 0 1 94 50" stroke={stroke} strokeWidth="1.5" />
          )}
        </svg>
      </div>
    </ParallaxItem>
  )
}

export default function Accents({
  preset,
  className = '',
}: {
  preset: AccentPreset
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion() ?? false
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const { blobs, shapes } = buildAccents(preset)

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {blobs.map((b) => (
        <BlobEl key={b.id} b={b} progress={scrollYProgress} reduced={reduced} />
      ))}
      {shapes.map((s) => (
        <ShapeEl key={s.id} s={s} progress={scrollYProgress} reduced={reduced} />
      ))}
    </div>
  )
}
