'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Float } from '@react-three/drei'
import type { Mesh } from 'three'

function Blob() {
  const mesh = useRef<Mesh>(null)

  useFrame((state) => {
    if (!mesh.current) return
    // Gentle pointer-follow rotation — cheap, no per-frame allocations.
    const { x, y } = state.pointer
    mesh.current.rotation.x += (y * 0.3 - mesh.current.rotation.x) * 0.05
    mesh.current.rotation.y += (x * 0.3 - mesh.current.rotation.y) * 0.05
  })

  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
      {/* Tucked into the top-right corner so it clears the headline. */}
      <mesh ref={mesh} scale={1.35} position={[3.1, 1.5, 0]}>
        <icosahedronGeometry args={[1, 12]} />
        <MeshDistortMaterial color="#2DD4BF" roughness={0.3} metalness={0.15} distort={0.32} speed={1.3} />
      </mesh>
    </Float>
  )
}

export default function HeroCanvas() {
  return (
    <Canvas
      className="!absolute inset-0"
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <Blob />
    </Canvas>
  )
}
