'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { toCanvasUniforms, type SilkComposition } from '@/lib/silk'

function readSilk(varName: string): THREE.Color {
  if (typeof window === 'undefined') return new THREE.Color('#2DD4BF')
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  const [r, g, b] = raw.split(/\s+/).map(Number)
  return new THREE.Color(r / 255, g / 255, b / 255)
}

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
`

const fragment = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uScale;
  uniform vec2 uOffset;
  uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
  void main() {
    vec2 p = (vUv + uOffset) * uScale;
    float w = sin(p.x * 3.0 + uTime * 0.25) * 0.5
            + sin(p.y * 2.0 - uTime * 0.2) * 0.5;
    float t = smoothstep(-1.0, 1.0, w);
    vec3 col = mix(uC1, uC2, t);
    col = mix(col, uC3, smoothstep(0.4, 1.0, vUv.y + w * 0.15));
    gl_FragColor = vec4(col, uIntensity * 0.5);
  }
`

function SilkPlane({ composition }: { composition: SilkComposition }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const u = toCanvasUniforms(composition)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: u.intensity },
      uScale: { value: u.scale },
      uOffset: { value: new THREE.Vector2(u.offsetX, u.offsetY) },
      uC1: { value: readSilk('--silk-1') },
      uC2: { value: readSilk('--silk-2') },
      uC3: { value: readSilk('--silk-3') },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt
  })
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

export default function SilkCanvas({ composition }: { composition: SilkComposition }) {
  return (
    <Canvas
      className="pointer-events-none absolute inset-0"
      gl={{ antialias: false, alpha: true }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 1] }}
    >
      <SilkPlane composition={composition} />
    </Canvas>
  )
}
