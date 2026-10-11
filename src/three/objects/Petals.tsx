import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mulberry32 } from '../textures/noise'

/** A rose petal: a cupped, heart-shaped curl (vertex-coloured, deeper at the base). */
function petalGeo(): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(1, 1, 6, 6)
  const pos = g.attributes.position
  const col: number[] = []
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    // heart outline by pinching the plane
    const w = 0.55 * Math.sin(Math.PI * (y + 0.5)) + 0.08
    pos.setX(i, x * w * 2)
    pos.setZ(i, (x * x) * 0.5 + y * y * 0.18)
    c.set('#f06b92').lerp(new THREE.Color('#b8204e'), 0.5 - y)
    col.push(c.r, c.g, c.b)
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.scale(0.024, 0.03, 0.024)
  g.computeVertexNormals()
  return g
}

const geo = petalGeo()
const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, side: THREE.DoubleSide })

interface Props {
  count: number
  /** Box the petals fall through: [minX, minY, minZ], [maxX, maxY, maxZ] */
  bounds: [[number, number, number], [number, number, number]]
  seed?: number
  /** Extra petals already resting on the floor (y = floorY). */
  resting?: number
  floorY?: number
}

/** Rose petals drifting down through the light, tumbling as they fall. */
export function Petals({ count, bounds, seed = 4, resting = 0, floorY = 0.002 }: Props) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const rest = useRef<THREE.InstancedMesh>(null)
  const state = useMemo(() => {
    const rand = mulberry32(seed)
    const [[x0, y0, z0], [x1, y1, z1]] = bounds
    return Array.from({ length: count }, () => ({
      x: x0 + rand() * (x1 - x0),
      y: y0 + rand() * (y1 - y0),
      z: z0 + rand() * (z1 - z0),
      vy: 0.12 + rand() * 0.12,
      drift: rand() * Math.PI * 2,
      spin: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(2.4),
      rot: new THREE.Euler(rand() * 6, rand() * 6, rand() * 6),
      s: 0.8 + rand() * 0.6,
    }))
  }, [count, bounds, seed])

  useLayoutEffect(() => {
    if (!rest.current || !resting) return
    const rand = mulberry32(seed + 9)
    const [[x0, , z0], [x1, , z1]] = bounds
    const m = new THREE.Matrix4()
    for (let i = 0; i < resting; i++) {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + (rand() - 0.5) * 0.4, rand() * 6.28, 0))
      const s = 0.8 + rand() * 0.6
      m.compose(new THREE.Vector3(x0 + rand() * (x1 - x0), floorY, z0 + rand() * (z1 - z0)), q, new THREE.Vector3(s, s, s))
      rest.current.setMatrixAt(i, m)
    }
    rest.current.instanceMatrix.needsUpdate = true
  }, [resting, bounds, seed, floorY])

  const m = useMemo(() => new THREE.Matrix4(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const v = useMemo(() => new THREE.Vector3(), [])
  const sc = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ clock }, dt) => {
    const inst = mesh.current
    if (!inst) return
    const d = Math.min(dt, 0.05)
    const t = clock.elapsedTime
    const [[x0, y0, z0], [x1, y1, z1]] = bounds
    for (let i = 0; i < state.length; i++) {
      const p = state[i]
      p.y -= p.vy * d
      p.x += Math.sin(t * 0.6 + p.drift) * 0.05 * d + 0.03 * d
      p.z += Math.cos(t * 0.5 + p.drift) * 0.04 * d
      p.rot.x += p.spin.x * d
      p.rot.y += p.spin.y * d
      p.rot.z += p.spin.z * d
      if (p.y < y0) {
        p.y = y1
        p.x = x0 + Math.random() * (x1 - x0)
        p.z = z0 + Math.random() * (z1 - z0)
      }
      if (p.x > x1) p.x = x0
      q.setFromEuler(p.rot)
      v.set(p.x, p.y, p.z)
      sc.setScalar(p.s)
      m.compose(v, q, sc)
      inst.setMatrixAt(i, m)
    }
    inst.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={mesh} args={[geo, mat, count]} frustumCulled={false} />
      {resting > 0 && <instancedMesh ref={rest} args={[geo, mat, resting]} receiveShadow />}
    </group>
  )
}
