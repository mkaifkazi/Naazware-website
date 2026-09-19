export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

export const LENIS_DEFAULTS = { duration: 1.1, smoothWheel: true }

/** Global motion switch — disabled when the user prefers reduced motion. */
export function shouldEnableMotion(prefersReduced: boolean): boolean {
  return !prefersReduced
}

/** Custom cursor is fine-pointer only, and never under reduced-motion. */
export function shouldEnableCursor(prefersReduced: boolean, isCoarsePointer: boolean): boolean {
  return !prefersReduced && !isCoarsePointer
}

type Point = { x: number; y: number }
type Rect = { left: number; top: number; width: number; height: number }

/** Offset that pulls an element toward the pointer, scaled by `strength`. */
export function magneticOffset(pointer: Point, rect: Rect, strength = 0.3): Point {
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  return {
    x: (pointer.x - centerX) * strength,
    y: (pointer.y - centerY) * strength,
  }
}

export const fadeUpVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT_EXPO },
  },
}
