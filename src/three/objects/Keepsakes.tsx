import { useMemo } from 'react'
import * as THREE from 'three'
import { useWorldAssets } from '../assets'
import { mulberry32 } from '../textures/noise'
import { sealHalves } from './Envelope'

/** The D&V wax seal, whole (both halves of the envelope's seal, unbroken). */
export function WaxSeal({ position = [0, 0, 0] as [number, number, number], scale = 1 }) {
  const { seal } = useWorldAssets()
  const [top, bottom] = useMemo(() => sealHalves(), [])
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: seal.map,
        normalMap: seal.normalMap,
        roughnessMap: seal.ormMap,
        metalnessMap: seal.ormMap,
        roughness: 1,
        metalness: 1,
        clearcoat: 0.6,
        clearcoatRoughness: 0.25,
      }),
    [seal],
  )
  return (
    <group position={position} scale={scale}>
      <mesh geometry={top} material={mat} castShadow />
      <mesh geometry={bottom} material={mat} castShadow />
    </group>
  )
}

/**
 * A silk tassel on a twisted cord: gold cap and bead, a skirt of fine threads
 * that flares slightly toward the ends. `length` is the skirt length in metres.
 */
export function Tassel({
  position = [0, 0, 0] as [number, number, number],
  rotation = 0,
  cord = 0.08,
  length = 0.11,
  color = '#7d1e2c',
  seed = 3,
}: {
  position?: [number, number, number]
  rotation?: number
  cord?: number
  length?: number
  color?: string
  seed?: number
}) {
  const gold = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d9aa50', metalness: 1, roughness: 0.3 }), [])
  const silk = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, sheen: 1, sheenRoughness: 0.3, sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffd0d8'), 0.5) }),
    [color],
  )
  const threads = useMemo(() => {
    const rand = mulberry32(seed)
    const n = 420
    const geo = new THREE.CylinderGeometry(0.0008, 0.001, length, 5, 1)
    geo.translate(0, -length / 2, 0)
    const mesh = new THREE.InstancedMesh(geo, silk, n)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2
      const r = Math.sqrt(rand()) * 0.0115
      const tilt = 0.04 + (r / 0.0115) * 0.3
      q.setFromEuler(new THREE.Euler(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt))
      m.compose(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r), q, new THREE.Vector3(1, 0.86 + rand() * 0.16, 1))
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, new THREE.Color(0.82 + rand() * 0.3, 0.82 + rand() * 0.3, 0.82 + rand() * 0.3))
    }
    return mesh
  }, [silk, length, seed])
  // a twisted cord: two helical tubes
  const cordGeo = useMemo(() => {
    const strand = (phase: number) => {
      const pts: THREE.Vector3[] = []
      for (let i = 0; i <= 60; i++) {
        const t = i / 60
        const a = t * Math.PI * 2 * 9 + phase
        pts.push(new THREE.Vector3(Math.cos(a) * 0.0016, -t * cord, Math.sin(a) * 0.0016))
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.0016, 6, false)
    }
    return [strand(0), strand(Math.PI)]
  }, [cord])
  return (
    <group position={position} rotation-z={rotation}>
      {cordGeo.map((g, i) => (
        <mesh key={i} geometry={g} material={silk} castShadow />
      ))}
      <group position={[0, -cord, 0]}>
        <mesh position={[0, -0.007, 0]} material={gold} castShadow>
          <sphereGeometry args={[0.0085, 20, 14]} />
        </mesh>
        <mesh position={[0, -0.02, 0]} material={gold} castShadow>
          <cylinderGeometry args={[0.0075, 0.012, 0.018, 24]} />
        </mesh>
        <mesh position={[0, -0.0295, 0]} material={gold}>
          <torusGeometry args={[0.0118, 0.0018, 8, 24]} />
        </mesh>
        <primitive object={threads} position={[0, -0.028, 0]} />
      </group>
    </group>
  )
}
