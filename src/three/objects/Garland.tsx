import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useWorldAssets } from '../assets'
import { mulberry32 } from '../textures/noise'

/**
 * Jasmine (mallige) garlands: thousands of small five-petal flowers and buds
 * packed around a hanging cord, with green leaves and the odd rose or marigold —
 * drawn with instancing so a whole doorway of garlands costs a few draw calls.
 */

/** A five-petal star as a 10-triangle fan, petals lifted slightly into a cup. */
function jasmineFlower(): THREE.BufferGeometry {
  const pos: number[] = []
  const rim: Array<[number, number, number]> = []
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2
    const r = k % 2 === 0 ? 0.0115 : 0.0042
    rim.push([Math.cos(a) * r, Math.sin(a) * r, k % 2 === 0 ? 0.003 : 0])
  }
  for (let k = 0; k < 10; k++) {
    const a = rim[k]
    const b = rim[(k + 1) % 10]
    pos.push(0, 0, 0.0015, ...a, ...b)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.computeVertexNormals()
  return g
}

const flowerGeo = jasmineFlower()
/** A closed jasmine bud: a slim teardrop on a short stem, pointing along +Y. */
const budGeo = (() => {
  // a few rings are plenty at this size (about 2 cm): 40 triangles
  const pts: THREE.Vector2[] = []
  for (let i = 0; i <= 4; i++) {
    const t = i / 4
    pts.push(new THREE.Vector2(0.0001 + 0.0042 * Math.sin(Math.PI * Math.pow(t, 0.8)) * (t < 0.25 ? 0.55 + t * 1.8 : 1), t * 0.019))
  }
  return new THREE.LatheGeometry(pts, 5)
})()
const leafGeo = (() => {
  const g = new THREE.CircleGeometry(1, 6)
  g.scale(0.008, 0.022, 1)
  g.translate(0, 0.02, 0)
  return g
})()
/** A ruffled ball (marigold / rose head): an icosphere with its surface jittered. */
const accentGeo = (() => {
  const g = new THREE.IcosahedronGeometry(0.012, 2)
  const p = g.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    const n = 1 + 0.16 * Math.sin(v.x * 900) * Math.sin(v.y * 1100) * Math.sin(v.z * 1000)
    v.multiplyScalar(n)
    p.setXYZ(i, v.x, v.y, v.z)
  }
  g.computeVertexNormals()
  return g
})()

const flowerMat = new THREE.MeshStandardMaterial({ color: '#fffaf0', roughness: 0.6, emissive: '#fff3df', emissiveIntensity: 0.12, side: THREE.DoubleSide })
const budMat = new THREE.MeshStandardMaterial({ color: '#f4efd9', roughness: 0.55, emissive: '#fff3df', emissiveIntensity: 0.08 })
const leafMat = new THREE.MeshStandardMaterial({ color: '#3f6b2a', roughness: 0.5, side: THREE.DoubleSide })
const roseMat = new THREE.MeshStandardMaterial({ color: '#b3123c', roughness: 0.45 })
const marigoldMat = new THREE.MeshStandardMaterial({ color: '#f39a1c', roughness: 0.6 })

interface GarlandProps {
  /** Points the cord passes through (it is smoothed with a Catmull-Rom curve). */
  /** Points the cord passes through — or several cords, drawn together in one set of instanced meshes. */
  points: Array<[number, number, number]> | Array<Array<[number, number, number]>>
  /** Flowers per metre. */
  density?: number
  radius?: number
  seed?: number
  accents?: boolean
}

export function Garland({ points, density = 420, radius = 0.028, seed = 1, accents = true }: GarlandProps) {
  // one or many cords; instances are spread along their combined length
  const path = useMemo(() => {
    const strands = (Array.isArray(points[0]?.[0]) ? points : [points]) as Array<Array<[number, number, number]>>
    const curves = strands.filter((s) => s.length > 1).map((s) => new THREE.CatmullRomCurve3(s.map((p) => new THREE.Vector3(...p))))
    const lengths = curves.map((c) => c.getLength())
    const total = lengths.reduce((a, b) => a + b, 0)
    /** position and tangent at fraction u of the combined length */
    const at = (u: number, pos: THREE.Vector3, tan: THREE.Vector3) => {
      let d = Math.min(Math.max(u, 0), 1) * total
      for (let k = 0; k < curves.length; k++) {
        if (d <= lengths[k] || k === curves.length - 1) {
          const t = Math.min(1, d / lengths[k])
          curves[k].getPointAt(t, pos)
          curves[k].getTangentAt(t, tan)
          return
        }
        d -= lengths[k]
      }
    }
    return { at, total }
  }, [points])
  const length = path.total
  const floral = useWorldAssets().quality.floral
  const counts = useMemo(() => {
    const flowers = Math.round(length * density * floral)
    return { flowers, buds: Math.round(flowers * 0.55), leaves: Math.round(length * 16), roses: accents ? Math.round(length * 6) : 0, marigolds: accents ? Math.round(length * 4) : 0 }
  }, [length, density, accents, floral])
  const refs = {
    flowers: useRef<THREE.InstancedMesh>(null),
    buds: useRef<THREE.InstancedMesh>(null),
    leaves: useRef<THREE.InstancedMesh>(null),
    roses: useRef<THREE.InstancedMesh>(null),
    marigolds: useRef<THREE.InstancedMesh>(null),
  }

  useLayoutEffect(() => {
    const rand = mulberry32(seed)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const pos = new THREE.Vector3()
    const tangent = new THREE.Vector3()
    const normal = new THREE.Vector3()
    const binormal = new THREE.Vector3()
    const up = new THREE.Vector3(0, 0, 1)
    const dir = new THREE.Vector3()
    const jitter = new THREE.Quaternion()
    /** facing: the geometry's own forward axis, turned to point out from the cord (null = random tumble) */
    const place = (mesh: THREE.InstancedMesh | null, n: number, spread: number, scaleMin: number, scaleMax: number, outward: boolean, facing: THREE.Vector3 | null = null) => {
      if (!mesh) return
      for (let i = 0; i < n; i++) {
        const t = (i + rand()) / n
        path.at(t, pos, tangent)
        normal.crossVectors(tangent, up).normalize()
        if (normal.lengthSq() < 0.01) normal.set(1, 0, 0)
        binormal.crossVectors(tangent, normal).normalize()
        const a = rand() * Math.PI * 2
        const r = radius * (outward ? 0.85 + rand() * 0.3 : rand() * spread)
        pos.addScaledVector(normal, Math.cos(a) * r).addScaledVector(binormal, Math.sin(a) * r)
        if (facing) {
          // point outward, drooping a little along the cord, with some natural variation
          dir.copy(normal).multiplyScalar(Math.cos(a)).addScaledVector(binormal, Math.sin(a)).addScaledVector(tangent, (rand() - 0.3) * 0.7).normalize()
          q.setFromUnitVectors(facing, dir)
          e.set((rand() - 0.5) * 0.5, (rand() - 0.5) * 0.5, rand() * Math.PI * 2)
          q.multiply(jitter.setFromEuler(e))
        } else {
          e.set(rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2)
          q.setFromEuler(e)
        }
        const s = scaleMin + rand() * (scaleMax - scaleMin)
        m.compose(pos, q, new THREE.Vector3(s, s, s))
        mesh.setMatrixAt(i, m)
      }
      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingSphere()
    }
    place(refs.flowers.current, counts.flowers, 1, 0.85, 1.25, true, new THREE.Vector3(0, 0, 1))
    place(refs.buds.current, counts.buds, 1, 0.8, 1.15, true, new THREE.Vector3(0, 1, 0))
    place(refs.leaves.current, counts.leaves, 1, 0.8, 1.3, true, new THREE.Vector3(0, 1, 0))
    place(refs.roses.current, counts.roses, 0.5, 0.9, 1.2, false)
    place(refs.marigolds.current, counts.marigolds, 0.5, 0.9, 1.2, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, counts, radius, seed])

  return (
    <group>
      <instancedMesh ref={refs.flowers} args={[flowerGeo, flowerMat, counts.flowers]} />
      <instancedMesh ref={refs.buds} args={[budGeo, budMat, counts.buds]} />
      <instancedMesh ref={refs.leaves} args={[leafGeo, leafMat, counts.leaves]} />
      {counts.roses > 0 && <instancedMesh ref={refs.roses} args={[accentGeo, roseMat, counts.roses]} />}
      {counts.marigolds > 0 && <instancedMesh ref={refs.marigolds} args={[accentGeo, marigoldMat, counts.marigolds]} />}
    </group>
  )
}

/** A vertical strand hanging from (x, top, z) with a gentle sway in its shape. */
export function hangingStrand(x: number, top: number, bottom: number, z: number, sway = 0.03): Array<[number, number, number]> {
  const pts: Array<[number, number, number]> = []
  for (let i = 0; i <= 6; i++) {
    const t = i / 6
    pts.push([x + Math.sin(t * Math.PI) * sway, top + (bottom - top) * t, z + Math.sin(t * Math.PI * 1.5) * sway * 0.5])
  }
  return pts
}

/** A swag (catenary) between two points, sagging by `sag`. */
export function swag(a: [number, number, number], b: [number, number, number], sag: number, steps = 10): Array<[number, number, number]> {
  const pts: Array<[number, number, number]> = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag, a[2] + (b[2] - a[2]) * t])
  }
  return pts
}
