import { useFrame } from '@react-three/fiber'
import { createContext, useContext, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { NOISE_GLSL } from '../bake/glsl'

/**
 * Every oil-lamp flame in the world is drawn by ONE instanced mesh: lamps place
 * invisible markers (<Flame/>), the FlameField collects their world positions
 * once and renders them all as camera-facing, flickering, additive flames.
 */

const flameVert = /* glsl */ `
  attribute vec3 iData; // x: seed, y: size, z: intensity
  varying vec2 vUv;
  varying vec3 vData;
  void main() {
    vUv = uv;
    vData = iData;
    vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy * iData.y;
    gl_Position = projectionMatrix * mv;
  }`

const flameFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vData;
  uniform float time;
  ${NOISE_GLSL}
  void main() {
    float seed = vData.x;
    vec2 p = vUv * 2.0 - 1.0;
    float up = p.y * 0.5 + 0.5;
    float sway = snoise(vec2(time * 1.7 + seed, seed)) * 0.18 * up * up;
    float lick = snoise(vec2(p.y * 3.0 - time * 6.0, seed + 3.0)) * 0.12 * up;
    p.x += sway + lick;
    float width = mix(0.55, 0.06, pow(up, 1.35));
    float d = abs(p.x) / max(width, 0.02);
    float base = smoothstep(-1.0, -0.72, p.y);
    float tip = 1.0 - smoothstep(0.55 + snoise(vec2(time * 2.3, seed)) * 0.12, 1.0, p.y);
    float body = (1.0 - smoothstep(0.55, 1.0, d)) * base * tip;
    float core = (1.0 - smoothstep(0.0, 0.42, d)) * smoothstep(-0.92, -0.62, p.y) * (1.0 - smoothstep(-0.2, 0.25, p.y));
    vec3 col = mix(vec3(1.0, 0.3, 0.04), vec3(1.0, 0.58, 0.14), smoothstep(0.0, 0.7, body));
    col = mix(col, vec3(1.0, 0.86, 0.55), core);
    col = mix(col, vec3(0.3, 0.32, 0.8), (1.0 - smoothstep(-1.0, -0.84, p.y)) * 0.35 * body);
    gl_FragColor = vec4(col * vData.z * body, body);
  }`

interface FlameEntry {
  obj: THREE.Object3D
  size: number
  intensity: number
}
interface FlameRegistry {
  add: (e: FlameEntry) => () => void
}
const Ctx = createContext<FlameRegistry | null>(null)

const MAX = 320

/** Provides the registry and renders every registered flame in one draw call. */
export function FlameField({ children }: { children: ReactNode }) {
  const entries = useRef(new Set<FlameEntry>())
  const dirty = useRef(true)
  const mesh = useRef<THREE.InstancedMesh>(null)
  const registry = useMemo<FlameRegistry>(
    () => ({
      add: (e) => {
        entries.current.add(e)
        dirty.current = true
        return () => {
          entries.current.delete(e)
          dirty.current = true
        }
      },
    }),
    [],
  )
  const { geometry, material } = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1.9)
    const data = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3)
    g.setAttribute('iData', data)
    const m = new THREE.ShaderMaterial({
      vertexShader: flameVert,
      fragmentShader: flameFrag,
      uniforms: { time: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
    return { geometry: g, material: m }
  }, [])

  const v = useMemo(() => new THREE.Vector3(), [])
  const mat4 = useMemo(() => new THREE.Matrix4(), [])
  useFrame((_, dt) => {
    material.uniforms.time.value += dt
    const inst = mesh.current
    if (!inst || !dirty.current) return
    dirty.current = false
    const data = geometry.getAttribute('iData') as THREE.InstancedBufferAttribute
    let i = 0
    for (const e of entries.current) {
      if (i >= MAX) break
      e.obj.updateWorldMatrix(true, false)
      e.obj.getWorldPosition(v)
      mat4.makeTranslation(v.x, v.y, v.z)
      inst.setMatrixAt(i, mat4)
      data.setXYZ(i, (i * 7.31) % 100, e.size, e.intensity)
      i++
    }
    inst.count = i
    inst.instanceMatrix.needsUpdate = true
    data.needsUpdate = true
  })
  return (
    <Ctx.Provider value={registry}>
      {children}
      <instancedMesh ref={mesh} args={[geometry, material, MAX]} frustumCulled={false} renderOrder={5} />
    </Ctx.Provider>
  )
}

/** Marks a flame at this position (rendered by the nearest FlameField). */
export function Flame({ position, size = 0.045, intensity = 2.2 }: { position: [number, number, number]; size?: number; intensity?: number }) {
  const ref = useRef<THREE.Object3D>(null)
  const registry = useContext(Ctx)
  useLayoutEffect(() => {
    if (!registry || !ref.current) return
    return registry.add({ obj: ref.current, size, intensity })
  }, [registry, size, intensity])
  return <object3D ref={ref} position={position} />
}

/** A warm flickering point light for a group of flames. */
export function FlameLight({ position, intensity = 1.6, distance = 3.5 }: { position: [number, number, number]; intensity?: number; distance?: number }) {
  const light = useMemo(() => {
    const l = new THREE.PointLight('#ffad5c', intensity, distance, 2)
    l.position.set(...position)
    return l
  }, [position, intensity, distance])
  const seed = useMemo(() => Math.random() * 10, [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed
    light.intensity = intensity * (0.86 + 0.1 * Math.sin(t * 7.3) + 0.06 * Math.sin(t * 13.1 + 1.3) + 0.04 * Math.sin(t * 23.7))
  })
  return <primitive object={light} />
}
