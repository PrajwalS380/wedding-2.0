import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Flame, FlameLight } from './Flame'

/** Polished, slightly warm brass. */
export function useBrass(roughness = 0.24) {
  return useMemo(() => new THREE.MeshStandardMaterial({ color: '#cf9d42', metalness: 1, roughness }), [roughness])
}

const lathe = (pts: Array<[number, number]>, segments = 64) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segments)

/** Kuthuvilakku profile (radius, height) for a 1.2 m lamp; spouts merged in. */
const LAMP_PROFILE: Array<[number, number]> = [
  [0.001, 0],
  [0.17, 0],
  [0.172, 0.018],
  [0.15, 0.03],
  [0.155, 0.05],
  [0.12, 0.075],
  [0.07, 0.11],
  [0.04, 0.14],
  [0.05, 0.16],
  [0.036, 0.18],
  [0.026, 0.24],
  [0.03, 0.3],
  [0.045, 0.32],
  [0.03, 0.34],
  [0.022, 0.48],
  [0.032, 0.54],
  [0.05, 0.56],
  [0.032, 0.58],
  [0.02, 0.74],
  [0.03, 0.8],
  [0.046, 0.82],
  [0.03, 0.85],
  [0.024, 0.9],
  [0.05, 0.93],
  [0.12, 0.96],
  [0.165, 0.995],
  [0.17, 1.012],
  [0.155, 1.015],
  [0.12, 0.995],
  [0.06, 0.985],
  [0.025, 0.99],
  [0.02, 1.05],
  [0.04, 1.08],
  [0.02, 1.12],
  [0.03, 1.16],
  [0.001, 1.2],
]
const SPOUT_ANGLES = Array.from({ length: 5 }, (_, i) => (i / 5) * Math.PI * 2 + 0.3)
let lampGeoCache: THREE.BufferGeometry | null = null
/** One merged geometry: the turned body plus five petal spouts (one draw call per lamp). */
export function lampGeometry(): THREE.BufferGeometry {
  if (lampGeoCache) return lampGeoCache
  const body = lathe(LAMP_PROFILE, 48)
  const parts: THREE.BufferGeometry[] = [body.toNonIndexed()]
  for (const a of SPOUT_ANGLES) {
    const c = new THREE.ConeGeometry(0.02, 0.05, 10)
    c.rotateZ(-Math.PI / 2)
    c.translate(0.17, 1.0, 0)
    c.rotateY(-a)
    parts.push(c.toNonIndexed())
  }
  for (const p of parts) p.deleteAttribute('uv')
  lampGeoCache = mergeGeometries(parts)
  return lampGeoCache
}
const flameOffsets = (s: number) => SPOUT_ANGLES.map((a) => [Math.cos(a) * 0.168 * s, 1.045 * s, -Math.sin(a) * 0.168 * s] as [number, number, number])

/** Kuthuvilakku: a tall South-Indian brass oil lamp with five wicks and a finial. */
export function LampStand({ position = [0, 0, 0] as [number, number, number], height = 1.15, light = true, castShadow = true }) {
  const brass = useBrass(0.22)
  const s = height / 1.2
  return (
    <group position={position}>
      <mesh geometry={lampGeometry()} material={brass} scale={s} castShadow={castShadow} />
      {flameOffsets(s).map((p, i) => (
        <Flame key={i} position={p} size={0.042 * s} />
      ))}
      {light && <FlameLight position={[0, 1.12 * s, 0]} intensity={2.2} distance={3.4} />}
    </group>
  )
}

/** A row of identical lamps drawn as one instanced mesh (flames via the shared FlameField). */
export function LampRow({ positions, height = 1.05 }: { positions: Array<[number, number, number]>; height?: number }) {
  const brass = useBrass(0.26)
  const ref = useRef<THREE.InstancedMesh>(null)
  const s = height / 1.2
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    positions.forEach((p, i) => {
      m.compose(new THREE.Vector3(...p), new THREE.Quaternion(), new THREE.Vector3(s, s, s))
      ref.current?.setMatrixAt(i, m)
    })
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true
  }, [positions, s])
  return (
    <group>
      <instancedMesh ref={ref} args={[lampGeometry(), brass, positions.length]} />
      {positions.map((p, i) =>
        flameOffsets(s).map((o, k) => <Flame key={`${i}-${k}`} position={[p[0] + o[0], p[1] + o[1], p[2] + o[2]]} size={0.04 * s} />),
      )}
    </group>
  )
}

/** A small clay-shaped brass diya with one flame. */
export function Diya({ position = [0, 0, 0] as [number, number, number], scale = 1, light = false }) {
  const brass = useBrass(0.3)
  const geo = useMemo(
    () =>
      lathe(
        [
          [0.001, 0],
          [0.035, 0],
          [0.05, 0.008],
          [0.062, 0.022],
          [0.066, 0.034],
          [0.06, 0.036],
          [0.048, 0.026],
          [0.001, 0.022],
        ],
        40,
      ),
    [],
  )
  return (
    <group position={position} scale={scale}>
      <mesh geometry={geo} material={brass} receiveShadow />
      <mesh position={[0.06, 0.03, 0]} rotation-z={-1.1} material={brass}>
        <coneGeometry args={[0.012, 0.03, 10]} />
      </mesh>
      {/* oil */}
      <mesh position={[0, 0.026, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.05, 24]} />
        <meshStandardMaterial color="#5a3a10" metalness={0.3} roughness={0.05} />
      </mesh>
      <Flame position={[0.064, 0.068, 0]} size={0.04} intensity={2.2} />
      {light && <FlameLight position={[0.06, 0.12, 0]} intensity={0.9} distance={1.6} />}
    </group>
  )
}

/** The diya's bowl with its spout, as one geometry (for rows of diyas). */
const diyaGeo = (() => {
  const bowl = lathe(
    [
      [0.001, 0],
      [0.035, 0],
      [0.05, 0.008],
      [0.062, 0.022],
      [0.066, 0.034],
      [0.06, 0.036],
      [0.048, 0.026],
      [0.001, 0.022],
    ],
    32,
  )
  const spout = new THREE.ConeGeometry(0.012, 0.03, 10)
  spout.rotateZ(-1.1)
  spout.translate(0.06, 0.03, 0)
  const parts = [bowl, spout].map((g) => {
    g.deleteAttribute('uv')
    return g.index ? g.toNonIndexed() : g
  })
  const merged = mergeGeometries(parts)
  merged.computeVertexNormals()
  return merged
})()
const oilGeo = new THREE.CircleGeometry(0.05, 20).rotateX(-Math.PI / 2).translate(0, 0.026, 0)
const oilMat = new THREE.MeshStandardMaterial({ color: '#5a3a10', metalness: 0.3, roughness: 0.05 })

/** Many diyas in two draw calls (flames join the shared flame field). */
export function DiyaRow({ positions, scale = 1 }: { positions: Array<[number, number, number]>; scale?: number }) {
  const brass = useBrass(0.3)
  const bowls = useRef<THREE.InstancedMesh>(null)
  const oil = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    positions.forEach((p, i) => {
      m.makeScale(scale, scale, scale).setPosition(...p)
      bowls.current?.setMatrixAt(i, m)
      oil.current?.setMatrixAt(i, m)
    })
    for (const r of [bowls.current, oil.current]) {
      if (!r) continue
      r.instanceMatrix.needsUpdate = true
      r.computeBoundingSphere()
    }
  }, [positions, scale])
  return (
    <group>
      <instancedMesh ref={bowls} args={[diyaGeo, brass, positions.length]} receiveShadow />
      <instancedMesh ref={oil} args={[oilGeo, oilMat, positions.length]} />
      {positions.map((p, i) => (
        <Flame key={i} position={[p[0] + 0.064 * scale, p[1] + 0.068 * scale, p[2]]} size={0.04 * scale} intensity={2.2} />
      ))}
    </group>
  )
}

/** A wide brass urli bowl of water (holds floating lotus and petals). */
export function Urli({ position = [0, 0, 0] as [number, number, number], radius = 0.3, children }: { position?: [number, number, number]; radius?: number; children?: ReactNode }) {
  const brass = useBrass(0.28)
  const r = radius
  const geo = useMemo(
    () =>
      lathe([
        [0.001, 0],
        [r * 0.45, 0],
        [r * 0.5, 0.02],
        [r * 0.62, 0.03],
        [r * 0.9, 0.08],
        [r, 0.12],
        [r * 1.04, 0.13],
        [r * 0.98, 0.135],
        [r * 0.9, 0.1],
        [r * 0.6, 0.06],
        [0.001, 0.05],
      ]),
    [r],
  )
  return (
    <group position={position}>
      <mesh geometry={geo} material={brass} receiveShadow />
      <mesh position={[0, 0.105, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[r * 0.93, 40]} />
        <meshStandardMaterial color="#2a1a0c" metalness={0.6} roughness={0.04} envMapIntensity={1.6} />
      </mesh>
      <group position={[0, 0.11, 0]}>{children}</group>
    </group>
  )
}
