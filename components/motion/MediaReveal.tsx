'use client'

import { type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'

export default function MediaReveal({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0.6 }}
      whileInView={{
        clipPath: 'inset(0 0% 0 0)',
        opacity: 1,
        transition: { duration: 0.9, ease: EASE_OUT_EXPO },
      }}
      viewport={{ once: true, margin: '-10% 0px' }}
    >
      {children}
    </motion.div>
  )
}
