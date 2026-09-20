'use client'

import { type ElementType } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_EXPO } from '@/lib/motion'
import { splitWords } from '@/lib/motion-anim'

export default function HeadingReveal({
  text,
  as = 'h2',
  className = '',
}: {
  text: string
  as?: ElementType
  className?: string
}) {
  const reduced = useReducedMotion()
  const words = splitWords(text)
  const MotionTag = motion(as as ElementType)

  if (reduced) {
    const Tag = as
    return <Tag className={className}>{text}</Tag>
  }

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10% 0px' }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-baseline" aria-hidden="true">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: '110%' },
              visible: {
                y: '0%',
                transition: { duration: 0.7, ease: EASE_OUT_EXPO, delay: i * 0.06 },
              },
            }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  )
}
