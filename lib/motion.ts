export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

export const LENIS_DEFAULTS = { duration: 1.1, smoothWheel: true }

/** Global motion switch — disabled when the user prefers reduced motion. */
export function shouldEnableMotion(prefersReduced: boolean): boolean {
  return !prefersReduced
}

/** Gate for the signature WebGL hero — desktop, motion-safe, connected, GPU-capable only. */
export function shouldRenderWebGL(opts: {
  prefersReduced: boolean
  isCoarseOrSmall: boolean
  saveData: boolean
  webglSupported: boolean
}): boolean {
  return !opts.prefersReduced && !opts.isCoarseOrSmall && !opts.saveData && opts.webglSupported
}

export const fadeUpVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT_EXPO },
  },
}
