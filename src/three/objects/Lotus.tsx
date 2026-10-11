import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { mulberry32 } from '../textures/noise'

/**
 * A pink lotus, built petal by petal: each petal is a cupped, pointed surface
 * with a colour gradient (ivory heart → rose tip) and faint veins; three rings
 * open progressively around a lime seed pod ringed with golden stamens.
 */

const PINK_TIP = new THREE.Color('#e0507e')
const PINK_MID = new THREE.Color('#f39ab4')
const HEART = new THREE.Color('#fff1e6')

function petalGeometry(len: number, width: number, cup: number, curl: number, rand: () => number): THREE.BufferGeometry {
  const L = 12
  const Wn = 8
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const c = new THREE.Color()
  for (let i = 0; i <= L; i++) {
    const u = i / L
    // ovate outline: narrow at the base, widest just past the middle, drawn to a fine point
    const w = width * (Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 0.75) + 0.2 * (1 - u) ** 3)
    for (let j = 0; j <= Wn; j++) {
      const v = (j / Wn) * 2 - 1
      const x = v * w
      const y = u * len
      // boat-shaped: cupped across the width, the tip lifting gently
      const z = cup * (1 - v * v) * w + curl * u * u * len + (rand() - 0.5) * 0.0004
      pos.push(x, y, z)
      // pale heart flushing to rose at the tip, fine lengthwise veins, a deeper edge
      const veins = Math.pow(0.5 + 0.5 * Math.cos(v * Math.PI * 6.5), 3)
      c.copy(HEART).lerp(PINK_MID, Math.min(1, u * 1.25)).lerp(PINK_TIP, Math.pow(u, 2.4) * 0.85 + Math.abs(v) * 0.12 * u)
      c.multiplyScalar(1 - veins * 0.07 * (0.3 + u))
      col.push(c.r, c.g, c.b)
    }
  }
  for (let i = 0; i < L; i++)
    for (let j = 0; j < Wn; j++) {
      const a = i * (Wn + 1) + j
      const b = a + Wn + 1
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export function makeLotusGeometry(seed = 1, size = 0.12, openness = 1): THREE.BufferGeometry {
  const rand = mulberry32(seed)
  const parts: THREE.BufferGeometry[] = []
  const rings: Array<{ n: number; len: number; w: number; tilt: number; cup: number; curl: number }> = [
    { n: 9, len: 1.0, w: 0.36, tilt: 0.98 * openness, cup: 0.85, curl: 0.04 },
    { n: 8, len: 0.95, w: 0.35, tilt: 0.62 * openness, cup: 0.95, curl: 0.06 },
    { n: 7, len: 0.86, w: 0.33, tilt: 0.3 * openness, cup: 1.05, curl: 0.08 },
  ]
  rings.forEach((ring, r) => {
    for (let k = 0; k < ring.n; k++) {
      const p = petalGeometry(ring.len * size, ring.w * size, ring.cup, ring.curl, rand)
      const yaw = (k / ring.n) * Math.PI * 2 + r * 0.31 + (rand() - 0.5) * 0.1
      p.rotateX(-(ring.tilt + (rand() - 0.5) * 0.12))
      p.rotateY(yaw)
      p.translate(0, size * 0.04, 0)
      parts.push(p)
    }
  })
  // seed pod and stamens
  const pod = new THREE.CylinderGeometry(size * 0.13, size * 0.1, size * 0.1, 18)
  pod.translate(0, size * 0.12, 0)
  pod.deleteAttribute('uv')
  const podCol = new THREE.Color('#c8d24a')
  pod.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: pod.attributes.position.count }, () => [podCol.r, podCol.g, podCol.b]).flat(), 3))
  parts.push(pod)
  const stCol = new THREE.Color('#f2b62e')
  for (let k = 0; k < 26; k++) {
    const st = new THREE.CylinderGeometry(size * 0.006, size * 0.006, size * 0.12, 4)
    const a = (k / 26) * Math.PI * 2
    st.deleteAttribute('uv')
    st.translate(0, size * 0.06, 0)
    st.rotateX(-0.5)
    st.rotateY(a)
    st.translate(0, size * 0.08, 0)
    st.setAttribute('color', new THREE.Float32BufferAttribute(Array.from({ length: st.attributes.position.count }, () => [stCol.r, stCol.g, stCol.b]).flat(), 3))
    parts.push(st)
  }
  // every part is indexed with its own normals: merging keeps each petal smoothly shaded
  return mergeGeometries(parts)
}

/** A lotus pad: a slightly wavy disc with its notch, radial veins in the colour. */
export function makeLotusLeafGeometry(radius = 0.16, seed = 2): THREE.BufferGeometry {
  const rand = mulberry32(seed)
  const segA = 48
  const segR = 6
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const notch = 0.18
  const c = new THREE.Color()
  const dark = new THREE.Color('#2c5523')
  const light = new THREE.Color('#9cc062')
  pos.push(0, 0.004, 0)
  c.copy(light)
  col.push(c.r, c.g, c.b)
  for (let i = 0; i <= segR; i++) {
    const rr = ((i + 1) / (segR + 1)) * radius
    for (let j = 0; j <= segA; j++) {
      const a = notch / 2 + (j / segA) * (Math.PI * 2 - notch)
      const wave = Math.sin(a * 7 + seed) * 0.006 * (rr / radius) + (rand() - 0.5) * 0.001
      // floating pad: flat heart, a rim that turns up a little
      pos.push(Math.cos(a) * rr, wave + 0.01 * (rr / radius) ** 2 + 0.028 * radius * (rr / radius) ** 6, Math.sin(a) * rr)
      // fine radial veins, a paler heart, a darker rim and a little mottling
      const vein = Math.pow(0.5 + 0.5 * Math.cos(a * 26), 12)
      c.copy(light).lerp(dark, 0.3 + 0.45 * (rr / radius) + (rand() - 0.5) * 0.08 - vein * 0.18 * (rr / radius))
      col.push(c.r, c.g, c.b)
    }
  }
  for (let j = 0; j < segA; j++) idx.push(0, 1 + j + 1, 1 + j)
  for (let i = 0; i < segR; i++)
    for (let j = 0; j < segA; j++) {
      const a = 1 + i * (segA + 1) + j
      const b = a + segA + 1
      idx.push(a, a + 1, b, b, a + 1, b + 1)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

const lotusMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, side: THREE.DoubleSide, emissive: '#ff6f96', emissiveIntensity: 0.06 })
const leafMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, side: THREE.DoubleSide })

export function Lotus({ position = [0, 0, 0] as [number, number, number], size = 0.12, seed = 1, openness = 1, rotation = 0 }) {
  const geo = useMemo(() => makeLotusGeometry(seed, size, openness), [seed, size, openness])
  return <mesh geometry={geo} material={lotusMaterial} position={position} rotation-y={rotation} receiveShadow />
}

export function LotusLeaf({ position = [0, 0, 0] as [number, number, number], radius = 0.16, seed = 2, rotation = 0, tilt = 0 }) {
  const geo = useMemo(() => makeLotusLeafGeometry(radius, seed), [radius, seed])
  return <mesh geometry={geo} material={leafMaterial} position={position} rotation={[tilt, rotation, 0]} receiveShadow />
}
