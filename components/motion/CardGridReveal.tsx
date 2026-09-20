'use client'

import { Children, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'

export default function CardGridReveal({
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
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ staggerChildren: 0.06 }}
    >
      {Children.map(children, (child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 16, scale: 0.96 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.6, ease: EASE_OUT_EXPO },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
