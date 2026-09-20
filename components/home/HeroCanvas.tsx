'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type RibbonSpec = {
  color: string
  seed: number
  speed: number
  radius: number
  amp: [number, number, number]
  freq: [number, number, number]
}

// Multicolour ribbons flowing from different angles (Windows "Ribbons" vibe).
const RIBBONS: RibbonSpec[] = [
  { color: '#14B8A6', seed: 0.0, speed: 0.5, radius: 0.09, amp: [3.4, 2.1, 1.6], freq: [1.0, 0.8, 1.2] },
  { color: '#F59E0B', seed: 1.7, speed: 0.42, radius: 0.08, amp: [3.0, 2.4, 1.3], freq: [0.8, 1.1, 0.9] },
  { color: '#0EA5E9', seed: 3.1, speed: 0.58, radius: 0.075, amp: [3.6, 1.8, 1.7], freq: [1.2, 0.9, 1.0] },
  { color: '#EC4899', seed: 4.4, speed: 0.47, radius: 0.065, amp: [2.8, 2.6, 1.4], freq: [0.9, 1.2, 1.1] },
  { color: '#8B5CF6', seed: 5.7, speed: 0.53, radius: 0.06, amp: [3.2, 2.0, 1.5], freq: [1.1, 1.0, 0.85] },
]

const SAMPLES = 28
const TUBULAR = 80

function Ribbon({ color, seed, speed, radius, amp, freq }: RibbonSpec) {
  const mesh = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const meshRef = mesh.current
    if (!meshRef) return
    const t = state.clock.elapsedTime * speed + seed
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < SAMPLES; i++) {
      const u = i / (SAMPLES - 1)
      const p = u * Math.PI * 2
      pts.push(
        new THREE.Vector3(
          Math.sin(t + p * freq[0] + seed) * amp[0],
          Math.cos(t * 0.85 + p * freq[1]) * amp[1],
          Math.sin(t * 1.15 + p * freq[2] + seed) * amp[2]
        )
      )
    }
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5)
    const geo = new THREE.TubeGeometry(curve, TUBULAR, radius, 10, false)
    meshRef.geometry.dispose()
    meshRef.geometry = geo
  })

  return (
    <mesh ref={mesh}>
      <tubeGeometry />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} emissive={color} emissiveIntensity={0.25} />
    </mesh>
  )
}

function RibbonField() {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!group.current) return
    const { x, y } = state.pointer
    group.current.rotation.y += (x * 0.3 - group.current.rotation.y) * 0.04
    group.current.rotation.x += (-y * 0.2 - group.current.rotation.x) * 0.04
  })
  return (
    <group ref={group}>
      {RIBBONS.map((r, i) => (
        <Ribbon key={i} {...r} />
      ))}
    </group>
  )
}

export default function HeroCanvas() {
  return (
    <Canvas
      className="!absolute inset-0"
      camera={{ position: [0, 0, 9], fov: 50 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 5, 6]} intensity={1.1} />
      <directionalLight position={[-5, -3, 2]} intensity={0.5} color="#8B5CF6" />
      <RibbonField />
    </Canvas>
  )
}
