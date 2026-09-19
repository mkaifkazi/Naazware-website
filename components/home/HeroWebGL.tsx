'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { shouldRenderWebGL } from '@/lib/motion'

// Code-split: three/R3F/drei live in THIS chunk only, never the initial bundle.
const HeroCanvas = dynamic(() => import('@/components/home/HeroCanvas'), { ssr: false })

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

export default function HeroWebGL() {
  const [enabled, setEnabled] = useState(false)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isCoarseOrSmall =
      window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
    // navigator.connection is non-standard; treat missing as "not save-data".
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection
    const saveData = !!conn?.saveData

    if (
      shouldRenderWebGL({
        prefersReduced,
        isCoarseOrSmall,
        saveData,
        webglSupported: detectWebGL(),
      })
    ) {
      setEnabled(true)
    }
  }, [])

  // Fade in only once the canvas chunk has had a tick to mount.
  useEffect(() => {
    if (!enabled) return
    const t = window.setTimeout(() => setShown(true), 50)
    return () => window.clearTimeout(t)
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
        shown ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <HeroCanvas />
    </div>
  )
}
