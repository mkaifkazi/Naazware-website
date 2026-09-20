export type AccentPreset = 'hero' | 'section' | 'cta'

export type Blob = {
  id: string
  x: number // % of container
  y: number
  size: number // px
  color: 1 | 2 | 3
  opacity: number
  depth: number // 0 = static, 1 = most parallax
}

export type Shape = {
  id: string
  x: number
  y: number
  size: number
  kind: 'ring' | 'arc'
  rotate: number
  depth: number
}

export type AccentLayout = { blobs: Blob[]; shapes: Shape[] }

const PRESETS: Record<AccentPreset, AccentLayout> = {
  hero: {
    blobs: [
      { id: 'h-b1', x: 12, y: 18, size: 460, color: 1, opacity: 0.28, depth: 0.6 },
      { id: 'h-b2', x: 82, y: 30, size: 380, color: 3, opacity: 0.22, depth: 0.9 },
      { id: 'h-b3', x: 60, y: 78, size: 300, color: 2, opacity: 0.18, depth: 0.4 },
    ],
    shapes: [
      { id: 'h-s1', x: 74, y: 16, size: 120, kind: 'ring', rotate: 12, depth: 0.8 },
      { id: 'h-s2', x: 18, y: 70, size: 90, kind: 'arc', rotate: -20, depth: 0.5 },
    ],
  },
  section: {
    blobs: [
      { id: 's-b1', x: -8, y: 40, size: 360, color: 2, opacity: 0.16, depth: 0.5 },
      { id: 's-b2', x: 96, y: 66, size: 320, color: 1, opacity: 0.14, depth: 0.7 },
    ],
    shapes: [{ id: 's-s1', x: 88, y: 24, size: 80, kind: 'ring', rotate: 8, depth: 0.6 }],
  },
  cta: {
    blobs: [
      { id: 'c-b1', x: 50, y: 50, size: 520, color: 3, opacity: 0.3, depth: 0.3 },
      { id: 'c-b2', x: 20, y: 30, size: 300, color: 1, opacity: 0.2, depth: 0.6 },
    ],
    shapes: [{ id: 'c-s1', x: 78, y: 68, size: 110, kind: 'arc', rotate: 30, depth: 0.7 }],
  },
}

export function buildAccents(preset: AccentPreset): AccentLayout {
  // Return fresh clones so callers can't mutate the shared preset table.
  const p = PRESETS[preset]
  return {
    blobs: p.blobs.map((b) => ({ ...b })),
    shapes: p.shapes.map((s) => ({ ...s })),
  }
}
