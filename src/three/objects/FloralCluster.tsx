import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { mulberry32 } from '../textures/noise'
import { Bougainvillea, type Strand } from './Florals'

type V3 = [number, number, number]

/**
 * A garden rose built petal by petal: a tight spiral bud at the heart, cupped
 * middle petals, and an open outer ring whose tips roll back. Each petal is a
 * curved surface with a colour gradient from a deeper base to a paler, sunlit edge.
 */
function rosePetal(len: number, width: number, cup: number, roll: number, tone: THREE.Color, rand: () => number): THREE.BufferGeometry {
  const U = 10
  const V = 10
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const deep = tone.clone().multiplyScalar(0.38)
  const edge = tone.clone().lerp(new THREE.Color('#fff0f3'), 0.28)
  const c = new THREE.Color()
  for (let i = 0; i <= U; i++) {
    const u = i / U
    // broad, rounded petal: narrow claw, wide rounded top
    const w = width * (0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, u * 0.85 + 0.12))) * (1 - 0.12 * u)
    for (let j = 0; j <= V; j++) {
      const v = (j / V) * 2 - 1
      const x = v * w
      const y = u * len
      // cupped across, rolling back near the rim
      const z = cup * (1 - v * v) * w * (1 - u * 0.4) + roll * Math.pow(u, 3) * len * (0.6 + 0.4 * Math.abs(v)) + (rand() - 0.5) * 0.0004
      pos.push(x, y, z)
      c.copy(deep).lerp(tone, Math.min(1, u * 1.35)).lerp(edge, Math.pow(u, 2.5) * 0.85 * (0.7 + 0.3 * Math.abs(v)))
      col.push(c.r, c.g, c.b)
    }
  }
  for (let i = 0; i < U; i++)
    for (let j = 0; j < V; j++) {
      const a = i * (V + 1) + j
      const b = a + V + 1
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export function makeRoseGeometry(seed: number, size: number, tone: string): THREE.BufferGeometry {
  const rand = mulberry32(seed)
  const base = new THREE.Color(tone)
  const parts: THREE.BufferGeometry[] = []
  // petals on a golden-angle spiral: small, upright and wrapped at the heart; large, open and rolled back outside
  const N = 24
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1)
    const len = size * (0.34 + 0.66 * Math.pow(t, 0.7))
    const width = len * (0.9 + 0.3 * t)
    const cup = 2.0 - 1.4 * t
    const roll = 0.04 + 0.7 * t * t
    const tilt = 0.04 + 1.4 * Math.pow(t, 1.25) + (rand() - 0.5) * 0.08
    const shade = base.clone().multiplyScalar(0.72 + 0.34 * t)
    const p = rosePetal(len, width, cup, roll, shade, rand)
    p.translate(0, 0, -size * 0.06 * (1 - t))
    p.rotateX(-tilt)
    p.rotateY(i * 2.39996 + (rand() - 0.5) * 0.2)
    parts.push(p)
  }
  return mergeGeometries(parts)
}

const roseMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.55, sheen: 0.8, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffd6e0'), side: THREE.DoubleSide })

/** A glossy leaf with a folded midrib and a pointed tip, pointing along +Y. */
const leafGeo = (() => {
  const U = 14
  const V = 10
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  const mid = new THREE.Color('#9cbf6e')
  const body = new THREE.Color('#4c7d36')
  const rim = new THREE.Color('#2a4f1f')
  const c = new THREE.Color()
  for (let i = 0; i <= U; i++) {
    const u = i / U
    const w = 0.5 * Math.sin(Math.PI * Math.pow(u, 0.8)) * (1 - 0.15 * u)
    for (let j = 0; j <= V; j++) {
      const v = (j / V) * 2 - 1
      pos.push(v * w, u, Math.abs(v) * w * 0.35 - 0.12 * u * u + 0.025 * Math.sin(u * 9 + v * 2) * Math.abs(v))
      const vein = Math.pow(Math.abs(Math.sin((u * 6 - Math.abs(v) * 2.2) * Math.PI)), 18) * 0.25
      c.copy(body).lerp(mid, Math.max(0, 1 - Math.abs(v) * 7) * 0.8 + vein).lerp(rim, Math.pow(Math.abs(v), 3) * 0.6)
      col.push(c.r, c.g, c.b)
    }
  }
  for (let i = 0; i < U; i++)
    for (let j = 0; j < V; j++) {
      const a = i * (V + 1) + j
      const b = a + V + 1
      idx.push(a, b, a + 1, b, b + 1, a + 1)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
})()
const leafMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.35, side: THREE.DoubleSide })

/** Five-petalled jasmine blossoms and slim buds, for sprays. */
const jasmineGeo = (() => {
  const parts: THREE.BufferGeometry[] = []
  for (let k = 0; k < 5; k++) {
    const p = new THREE.CircleGeometry(1, 12)
    p.scale(0.0065, 0.013, 1)
    p.translate(0, 0.012, 0)
    p.rotateX(-1.2)
    p.rotateY((k / 5) * Math.PI * 2)
    p.deleteAttribute('uv')
    parts.push(p)
  }
  const tube = new THREE.CylinderGeometry(0.0018, 0.0012, 0.02, 6)
  tube.translate(0, -0.006, 0)
  tube.deleteAttribute('uv')
  parts.push(tube)
  const g = mergeGeometries(parts)
  g.computeVertexNormals()
  return g
})()
const jasmineMat = new THREE.MeshStandardMaterial({ color: '#fffaf2', roughness: 0.5, emissive: '#fff4e0', emissiveIntensity: 0.18, side: THREE.DoubleSide })

function Instances({ geo, mat, matrices, colours, shadows }: { geo: THREE.BufferGeometry; mat: THREE.Material; matrices: THREE.Matrix4[]; colours?: THREE.Color[]; shadows: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    matrices.forEach((m, i) => {
      ref.current?.setMatrixAt(i, m)
      if (colours) ref.current?.setColorAt(i, colours[i])
    })
    if (ref.current) {
      ref.current.instanceMatrix.needsUpdate = true
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
      ref.current.computeBoundingSphere()
    }
  }, [matrices, colours])
  return <instancedMesh ref={ref} args={[geo, mat, matrices.length]} castShadow={shadows} receiveShadow={shadows} />
}

/**
 * A corner of flowers, as a florist would build it: a bed of glossy leaves
 * fanning outward, garden roses in three tones, sprays of jasmine and
 * bougainvillea reaching along the edges. Grows from the origin toward +X/−Y
 * (a top-left corner); mirror it for the other corners.
 */
export function FloralCorner({ seed = 1, roses = 9, shadows = false }: { seed?: number; roses?: number; shadows?: boolean }) {
  const layout = useMemo(() => {
    const rand = mulberry32(seed)
    const up = new THREE.Vector3(0, 1, 0)
    const q = new THREE.Quaternion()
    // leaves fan out from the corner along two arms (the top edge and the side edge)
    const leaves: THREE.Matrix4[] = []
    for (let i = 0; i < 70; i++) {
      const arm = rand() < 0.5 ? 0 : 1
      const t = Math.pow(rand(), 0.7)
      const dir = arm === 0 ? new THREE.Vector3(1, -0.15 - rand() * 0.3, 0) : new THREE.Vector3(0.15 + rand() * 0.3, -1, 0)
      const p = dir.clone().normalize().multiplyScalar(t * 0.62).add(new THREE.Vector3((rand() - 0.5) * 0.1, (rand() - 0.5) * 0.1, (rand() - 0.5) * 0.08))
      const out = dir.clone().normalize().add(new THREE.Vector3((rand() - 0.5) * 0.9, (rand() - 0.5) * 0.9, rand() * 0.5)).normalize()
      q.setFromUnitVectors(up, out)
      const s = 0.07 + rand() * 0.06
      leaves.push(new THREE.Matrix4().compose(p, q.clone(), new THREE.Vector3(s, s, s)))
    }
    // roses clustered near the corner, a few along each arm
    const rosePos: Array<{ p: V3; s: number; tone: string; rot: THREE.Euler }> = []
    const tones = ['#e0457a', '#f07fa0', '#c2185b', '#f6b3c4', '#fbe3e8']
    for (let i = 0; i < roses; i++) {
      const arm = i % 2
      const t = 0.05 + Math.pow(rand(), 1.3) * 0.42
      const p: V3 = arm === 0 ? [t + 0.02, -0.04 - rand() * 0.12, 0.06 + rand() * 0.05] : [0.03 + rand() * 0.12, -t - 0.02, 0.06 + rand() * 0.05]
      rosePos.push({ p, s: 0.05 + rand() * 0.035, tone: tones[Math.floor(rand() * tones.length)], rot: new THREE.Euler(1.2 + (rand() - 0.5) * 0.7, rand() * 6.28, (rand() - 0.5) * 0.8) })
    }
    // jasmine sprays along both edges
    const jasmine: THREE.Matrix4[] = []
    for (let s = 0; s < 6; s++) {
      const arm = s % 2
      const base = arm === 0 ? new THREE.Vector3(0.18 + s * 0.08, -0.03, 0.08) : new THREE.Vector3(0.03, -0.18 - s * 0.08, 0.08)
      const dir = arm === 0 ? new THREE.Vector3(1, -0.3, 0.2).normalize() : new THREE.Vector3(0.3, -1, 0.2).normalize()
      for (let k = 0; k < 16; k++) {
        const p = base.clone().addScaledVector(dir, 0.02 + rand() * 0.2).add(new THREE.Vector3((rand() - 0.5) * 0.05, (rand() - 0.5) * 0.05, rand() * 0.04))
        q.setFromUnitVectors(up, new THREE.Vector3(rand() - 0.5, rand() - 0.5, 0.8).normalize())
        const sc = 0.9 + rand() * 0.6
        jasmine.push(new THREE.Matrix4().compose(p, q.clone(), new THREE.Vector3(sc, sc, sc)))
      }
    }
    const strands: Strand[] = [
      { from: [0.25, -0.02, 0.02], dir: [1, 0, 0.1], length: 0.5, droop: 0.12 },
      { from: [0.02, -0.25, 0.02], dir: [0.1, 0, 0.2], length: 0.0, droop: 0 },
      { from: [0.05, -0.3, 0.03], dir: [0.12, 0, 0.05], length: 0.35, droop: 0.9 },
    ]
    return { leaves, rosePos, jasmine, strands }
  }, [seed, roses])
  // every rose of the corner merged into one mesh (one draw call)
  const roseGeo = useMemo(() => {
    const m = new THREE.Matrix4()
    return mergeGeometries(
      layout.rosePos.map((r, i) => makeRoseGeometry(seed * 31 + i, r.s, r.tone).applyMatrix4(m.compose(new THREE.Vector3(...r.p), new THREE.Quaternion().setFromEuler(r.rot), new THREE.Vector3(1, 1, 1)))),
    )
  }, [layout, seed])
  return (
    <group>
      <Instances geo={leafGeo} mat={leafMat} matrices={layout.leaves} shadows={shadows} />
      <mesh geometry={roseGeo} material={roseMat} castShadow={shadows} receiveShadow={shadows} />
      <Instances geo={jasmineGeo} mat={jasmineMat} matrices={layout.jasmine} shadows={shadows} />
      <Bougainvillea strands={layout.strands} seed={seed + 5} density={14} clusterRadius={0.07} />
    </group>
  )
}
