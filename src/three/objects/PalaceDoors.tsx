import { forwardRef, useMemo } from 'react'
import * as THREE from 'three'
import { useWorldAssets } from '../assets'
import type { PBRSet } from '../bake/bakers'

export const DOOR = { width: 1.22, height: 3.9, thickness: 0.11, opening: 2.44 }

function doorMaterials(set: PBRSet, woodMap: THREE.Texture): THREE.Material[] {
  const face = new THREE.MeshStandardMaterial({
    map: set.map,
    normalMap: set.normalMap,
    normalScale: new THREE.Vector2(1.15, 1.15),
    aoMap: set.ormMap,
    aoMapIntensity: 1,
    roughnessMap: set.ormMap,
    metalnessMap: set.ormMap,
    roughness: 1,
    metalness: 1,
    envMapIntensity: 1.1,
  })
  const edge = new THREE.MeshStandardMaterial({ map: woodMap, roughness: 0.55, metalness: 0, color: '#c79b7a' })
  // box faces: +x, -x, +y, -y, +z (front), -z (back)
  return [edge, edge, edge, edge, face, face]
}

/** One carved door, hinged at its outer edge; rotate the returned group about Y to open. */
export const PalaceDoor = forwardRef<THREE.Group, { side: 'left' | 'right'; open: number }>(function PalaceDoor({ side, open }, ref) {
  const { doorL, doorR, wood } = useWorldAssets()
  const set = side === 'left' ? doorL : doorR
  const mats = useMemo(() => doorMaterials(set, wood.map), [set, wood.map])
  const geo = useMemo(() => new THREE.BoxGeometry(DOOR.width, DOOR.height, DOOR.thickness), [])
  const sign = side === 'left' ? 1 : -1
  return (
    <group ref={ref} position={[(-sign * DOOR.opening) / 2, 0, 0]} rotation-y={sign * open}>
      <mesh geometry={geo} material={mats} position={[(sign * DOOR.width) / 2, DOOR.height / 2, 0]} castShadow receiveShadow />
      {/* brass ring handle near the free edge */}
      <mesh position={[sign * (DOOR.width - 0.12), DOOR.height * 0.47, DOOR.thickness / 2 + 0.03]} rotation-y={0} castShadow>
        <torusGeometry args={[0.07, 0.012, 12, 40]} />
        <meshStandardMaterial color="#d8a94f" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[sign * (DOOR.width - 0.12), DOOR.height * 0.47 + 0.07, DOOR.thickness / 2 + 0.012]} castShadow>
        <cylinderGeometry args={[0.026, 0.032, 0.03, 24]} />
        <meshStandardMaterial color="#c9973c" metalness={1} roughness={0.3} />
      </mesh>
    </group>
  )
})
