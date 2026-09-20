'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type CometSpec = {
  color: string
  amp: [number, number, number]
  freq: [number, number, number]
  phase: number
  speed: number
  headRadius: number
}

// Shooting-star ribbons: thick head → thin tail, arcing across on curved paths.
const COMETS: CometSpec[] = [
  { color: '#14B8A6', amp: [4.2, 2.4, 1.8], freq: [0.90, 1.30, 0.70], phase: 0.0, speed: 0.85, headRadius: 0.16 },
  { color: '#F59E0B', amp: [4.6, 2.0, 1.4], freq: [1.10, 0.80, 1.20], phase: 1.9, speed: 0.72, headRadius: 0.14 },
  { color: '#0EA5E9', amp: [3.8, 2.7, 1.6], freq: [0.70, 1.20, 0.90], phase: 3.3, speed: 0.95, headRadius: 0.13 },
  { color: '#EC4899', amp: [4.4, 2.2, 1.7], freq: [1.30, 0.90, 1.10], phase: 4.7, speed: 0.8, headRadius: 0.12 },
  { color: '#8B5CF6', amp: [4.0, 2.5, 1.5], freq: [0.80, 1.10, 1.30], phase: 6.0, speed: 0.9, headRadius: 0.11 },
]

const SAMPLES = 48 // trail resolution
const DT = 0.045 // seconds between trail samples (trail length = SAMPLES * DT)
const RADIAL = 8

function headAt(t: number, amp: [number, number, number], freq: [number, number, number], phase: number) {
  return new THREE.Vector3(
    Math.sin(t * freq[0] + phase) * amp[0],
    Math.sin(t * freq[1] + phase * 1.3) * amp[1],
    Math.sin(t * freq[2]) * amp[2]
  )
}

const TUBULAR = 80

// Comet tube: thick at the head (u=0), tapering to a thin tail (u=1).
// Built on THREE.TubeGeometry (correct winding/topology), then each ring is
// scaled toward its curve centre by the taper factor.
function taperedTube(points: THREE.Vector3[], rMax: number): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5)
  const geo = new THREE.TubeGeometry(curve, TUBULAR, rMax, RADIAL, false)
  const pos = geo.attributes.position as THREE.BufferAttribute
  const c = new THREE.Vector3()
  const v = new THREE.Vector3()
  for (let i = 0; i <= TUBULAR; i++) {
    const u = i / TUBULAR
    curve.getPointAt(u, c)
    const taper = Math.pow(1 - u, 0.75)
    for (let j = 0; j <= RADIAL; j++) {
      const idx = i * (RADIAL + 1) + j
      v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(taper).add(c)
      pos.setXYZ(idx, v.x, v.y, v.z)
    }
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

function Comet({ color, amp, freq, phase, speed, headRadius }: CometSpec) {
  const mesh = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const m = mesh.current
    if (!m) return
    const t = state.clock.elapsedTime * speed + phase
    // Sample the head path backward in time → a full comet trail every frame.
    const points: THREE.Vector3[] = []
    for (let k = 0; k < SAMPLES; k++) {
      points.push(headAt(t - k * DT, amp, freq, phase))
    }
    if (m.geometry) m.geometry.dispose()
    m.geometry = taperedTube(points, headRadius)
  })

  return (
    <mesh ref={mesh}>
      <bufferGeometry />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.35}
        roughness={0.3}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function CometField() {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!group.current) return
    const { x, y } = state.pointer
    group.current.rotation.y += (x * 0.25 - group.current.rotation.y) * 0.04
    group.current.rotation.x += (-y * 0.18 - group.current.rotation.x) * 0.04
  })
  return (
    <group ref={group}>
      {COMETS.map((c, i) => (
        <Comet key={i} {...c} />
      ))}
    </group>
  )
}

export default function HeroCanvas() {
  return (
    <Canvas
      className="!absolute inset-0"
      camera={{ position: [0, 0, 10], fov: 50 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 5, 6]} intensity={1.1} />
      <directionalLight position={[-5, -3, 2]} intensity={0.5} color="#8B5CF6" />
      <CometField />
    </Canvas>
  )
}
