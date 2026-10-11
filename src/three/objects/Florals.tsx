import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useWorldAssets } from '../assets'
import { mulberry32 } from '../textures/noise'

type V3 = [number, number, number]

/**
 * Bougainvillea: papery magenta bracts in threes around a tiny cream flower,
 * clustered along drooping strands with small leaves. Instanced, so a whole
 * cascade over an archway is a handful of draw calls.
 */
const bractGeo = (() => {
  const parts: THREE.BufferGeometry[] = []
  for (let k = 0; k < 3; k++) {
    const g = new THREE.CircleGeometry(1, 12)
    const p = g.attributes.position
    const cols: number[] = []
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i)
      const y = p.getY(i)
      const r = Math.hypot(x, y)
      // a papery bract: cupped, with a heart-shaped notch-free oval and a pale throat
      p.setZ(i, -0.35 * r * r + 0.06 * Math.sin(Math.atan2(y, x) * 5) * r)
      const throat = Math.max(0, 1 - Math.hypot(x, y + 0.75) * 1.4)
      const v = 0.82 + 0.18 * (1 - r) + throat * 0.25
      cols.push(Math.min(1.2, v), v * (0.92 + throat * 0.3), v * (0.95 + throat * 0.2))
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
    g.scale(0.017, 0.024, 0.017)
    g.translate(0, 0.019, 0)
    g.rotateX(-0.75)
    g.rotateY((k / 3) * Math.PI * 2)
    g.deleteAttribute('uv')
    parts.push(g)
  }
  const centre = new THREE.TetrahedronGeometry(0.003)
  centre.translate(0, 0.006, 0)
  centre.deleteAttribute('uv')
  centre.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: centre.attributes.position.count * 3 }, () => 1.4), 3))
  parts.push(centre)
  const merged = mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)))
  merged.computeVertexNormals()
  return merged
})()
const smallLeafGeo = (() => {
  const g = new THREE.CircleGeometry(1, 8)
  g.scale(0.016, 0.032, 1)
  g.translate(0, 0.03, 0)
  return g
})()
const bractMat = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.62, side: THREE.DoubleSide, emissive: '#7a0a3a', emissiveIntensity: 0.08 })
const leafMat = new THREE.MeshStandardMaterial({ color: '#3e6a2c', roughness: 0.55, side: THREE.DoubleSide })
const BRACT_TONES = ['#d6247a', '#c2186b', '#e43d8f', '#b5165f', '#ef5a9e'].map((c) => new THREE.Color(c))

export interface Strand {
  from: V3
  /** Horizontal reach direction (normalised internally). */
  dir: V3
  length: number
  droop: number
}

export function Bougainvillea({ strands, seed = 1, density: baseDensity = 9, clusterRadius = 0.1 }: { strands: Strand[]; seed?: number; density?: number; clusterRadius?: number }) {
  const density = Math.max(3, Math.round(baseDensity * useWorldAssets().quality.floral))
  const bracts = useRef<THREE.InstancedMesh>(null)
  const leaves = useRef<THREE.InstancedMesh>(null)
  const layout = useMemo(() => {
    const rand = mulberry32(seed)
    const b: THREE.Matrix4[] = []
    const l: THREE.Matrix4[] = []
    const colours: THREE.Color[] = []
    const q = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    for (const s of strands) {
      const d = new THREE.Vector3(...s.dir).normalize()
      for (let t = 0; t <= s.length; t += 0.075) {
        const c = new THREE.Vector3(...s.from).addScaledVector(d, t).add(new THREE.Vector3(0, -s.droop * t * t, 0))
        const r = clusterRadius * (0.7 + 0.5 * Math.sin((t / s.length) * Math.PI))
        for (let k = 0; k < density; k++) {
          const off = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize().multiplyScalar(r * Math.cbrt(rand()))
          const p = c.clone().add(off)
          const n = off.lengthSq() > 1e-6 ? off.clone().normalize() : up.clone()
          q.setFromUnitVectors(up, n).multiply(new THREE.Quaternion().setFromAxisAngle(up, rand() * 6.28))
          const sc = 0.8 + rand() * 0.6
          b.push(new THREE.Matrix4().compose(p, q.clone(), new THREE.Vector3(sc, sc, sc)))
          colours.push(BRACT_TONES[Math.floor(rand() * BRACT_TONES.length)])
        }
        for (let k = 0; k < 5; k++) {
          const off = new THREE.Vector3(rand() - 0.5, rand() - 0.6, rand() - 0.5).normalize().multiplyScalar(r * (0.7 + rand() * 0.45))
          q.setFromUnitVectors(up, off.clone().normalize()).multiply(new THREE.Quaternion().setFromAxisAngle(up, rand() * 6.28))
          const sc = 0.8 + rand() * 0.5
          l.push(new THREE.Matrix4().compose(c.clone().add(off), q.clone(), new THREE.Vector3(sc, sc, sc)))
        }
      }
    }
    return { b, l, colours }
  }, [strands, seed, density, clusterRadius])
  useLayoutEffect(() => {
    layout.b.forEach((m, i) => {
      bracts.current?.setMatrixAt(i, m)
      bracts.current?.setColorAt(i, layout.colours[i])
    })
    layout.l.forEach((m, i) => leaves.current?.setMatrixAt(i, m))
    if (bracts.current) {
      bracts.current.instanceMatrix.needsUpdate = true
      if (bracts.current.instanceColor) bracts.current.instanceColor.needsUpdate = true
      bracts.current.computeBoundingSphere()
    }
    if (leaves.current) {
      leaves.current.instanceMatrix.needsUpdate = true
      leaves.current.computeBoundingSphere()
    }
  }, [layout])
  return (
    <group>
      <instancedMesh ref={bracts} args={[bractGeo, bractMat, layout.b.length]} />
      <instancedMesh ref={leaves} args={[smallLeafGeo, leafMat, layout.l.length]} />
    </group>
  )
}

/** A ruffled rose head: an icosphere whose surface is folded into petals, shaded dark at the heart. */
const roseGeo = (() => {
  const g = new THREE.IcosahedronGeometry(0.035, 2)
  const p = g.attributes.position
  const v = new THREE.Vector3()
  const cols: number[] = []
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    const n = v.clone().normalize()
    // spiral petal ridges, flattened top, a cupped heart
    const a = Math.atan2(n.z, n.x)
    const ridge = 0.12 * Math.sin(a * 5 + n.y * 9)
    const r = 0.035 * (1 + ridge) * (n.y > 0.55 ? 0.82 : 1)
    v.copy(n).multiplyScalar(r)
    if (n.y > 0.8) v.y -= 0.008
    p.setXYZ(i, v.x, v.y * 0.85, v.z)
    const heart = THREE.MathUtils.smoothstep(n.y, 0.55, 0.95)
    cols.push(1 - heart * 0.45, 1 - heart * 0.55, 1 - heart * 0.5)
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
  g.computeVertexNormals()
  return g
})()
const roseMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, color: '#ffffff' })
const ROSE_TONES = ['#c4183c', '#d83a5c', '#f07a96', '#fbe9ea', '#b31234', '#f4a6b8'].map((c) => new THREE.Color(c))

/** A domed bouquet of roses with leaves, centred at `position` (for urns and arrangements). */
export function RoseBouquet({ position = [0, 0, 0] as V3, radius = 0.22, count = 40, seed = 3, palette }: { position?: V3; radius?: number; count?: number; seed?: number; palette?: string[] }) {
  const roses = useRef<THREE.InstancedMesh>(null)
  const leaves = useRef<THREE.InstancedMesh>(null)
  const tones = useMemo(() => (palette ? palette.map((c) => new THREE.Color(c)) : ROSE_TONES), [palette])
  useLayoutEffect(() => {
    const rand = mulberry32(seed)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    for (let i = 0; i < count; i++) {
      // golden-angle spiral over a dome
      const t = (i + 0.5) / count
      const phi = Math.acos(1 - t * 0.95)
      const theta = i * 2.39996
      const n = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta))
      q.setFromUnitVectors(up, n)
      const s = 0.85 + rand() * 0.35
      m.compose(n.clone().multiplyScalar(radius), q, new THREE.Vector3(s, s, s))
      roses.current?.setMatrixAt(i, m)
      roses.current?.setColorAt(i, tones[Math.floor(rand() * tones.length)])
    }
    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI * 2
      const phi = 1.0 + rand() * 0.6
      const n = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta))
      q.setFromUnitVectors(up, n)
      const s = 1.4 + rand() * 0.8
      m.compose(n.clone().multiplyScalar(radius * 1.02), q, new THREE.Vector3(s, s, s))
      leaves.current?.setMatrixAt(i, m)
    }
    if (roses.current) {
      roses.current.instanceMatrix.needsUpdate = true
      if (roses.current.instanceColor) roses.current.instanceColor.needsUpdate = true
      roses.current.computeBoundingSphere()
    }
    if (leaves.current) {
      leaves.current.instanceMatrix.needsUpdate = true
      leaves.current.computeBoundingSphere()
    }
  }, [count, radius, seed, tones])
  return (
    <group position={position}>
      <instancedMesh ref={leaves} args={[smallLeafGeo, leafMat, count]} />
      <instancedMesh ref={roses} args={[roseGeo, roseMat, count]} />
    </group>
  )
}
