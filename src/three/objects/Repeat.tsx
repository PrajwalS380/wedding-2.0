import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'

type V3 = [number, number, number]

/** The same small part (a bracket, a bead, a bowl) at many positions, in one draw call. */
export function Repeat({
  geometry,
  material,
  positions,
  rotations,
  scale = 1,
  castShadow = false,
}: {
  geometry: THREE.BufferGeometry
  material: THREE.Material
  positions: V3[]
  rotations?: V3[]
  scale?: number
  castShadow?: boolean
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const s = new THREE.Vector3(scale, scale, scale)
    positions.forEach((p, i) => {
      if (rotations?.[i]) q.setFromEuler(e.set(...rotations[i]))
      else q.identity()
      m.compose(new THREE.Vector3(...p), q, s)
      ref.current?.setMatrixAt(i, m)
    })
    if (ref.current) {
      ref.current.instanceMatrix.needsUpdate = true
      ref.current.computeBoundingSphere()
    }
  }, [positions, rotations, scale])
  return <instancedMesh ref={ref} args={[geometry, material, positions.length]} castShadow={castShadow} />
}
