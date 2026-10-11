import { useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { useWorldAssets } from '../assets'
import { framing } from '../IntroWorld'
import { Diya, LampStand, Urli, useBrass } from './BrassLamps'
import { DOOR } from './PalaceDoors'
import { Garland, hangingStrand, swag } from './Garland'
import { Lotus, LotusLeaf } from './Lotus'
import { FloralCorner } from './FloralCluster'
import { Bougainvillea, type Strand } from './Florals'

/**
 * The palace vestibule around the doorway: carved wall panels, gold-trimmed
 * jambs and lintel, a jasmine toran with brass bells, garlands down the jambs,
 * the gold pedestal for the invitation, brass lamps, urlis of lotus and diyas.
 */

const HALF = DOOR.opening / 2

function Bell({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const brass = useBrass(0.26)
  const geo = useMemo(
    () =>
      new THREE.LatheGeometry(
        [
          [0.001, 0],
          [0.05, 0.002],
          [0.052, 0.012],
          [0.045, 0.03],
          [0.034, 0.07],
          [0.022, 0.095],
          [0.012, 0.105],
          [0.001, 0.11],
        ].map(([x, y]) => new THREE.Vector2(x, y)),
        32,
      ),
    [],
  )
  return (
    <group position={position} scale={scale}>
      <mesh geometry={geo} material={brass} position-y={-0.11} />
      <mesh position-y={-0.112} material={brass}>
        <sphereGeometry args={[0.012, 10, 8]} />
      </mesh>
      <mesh position-y={0.09} material={brass}>
        <cylinderGeometry args={[0.0025, 0.0025, 0.18, 6]} />
      </mesh>
    </group>
  )
}

/** Carved wall panelling: the door carving re-used darker, in panels between pilasters. */
function WallPanels({ side }: { side: -1 | 1 }) {
  const { doorL, doorR, wood } = useWorldAssets()
  const set = side < 0 ? doorL : doorR
  const panelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: set.map,
        normalMap: set.normalMap,
        aoMap: set.ormMap,
        roughnessMap: set.ormMap,
        metalnessMap: set.ormMap,
        color: '#7a6a5c',
        envMapIntensity: 0.6,
      }),
    [set],
  )
  const pilasterMat = useMemo(() => new THREE.MeshStandardMaterial({ map: wood.map, color: '#a07858', roughness: 0.6 }), [wood.map])
  const panels = [0, 1, 2]
  return (
    <group>
      {panels.map((k) => {
        const x = side * (HALF + 0.42 + 0.62 + k * 1.36)
        return (
          <group key={k}>
            <mesh position={[x, 2.05, -0.06]} material={panelMat} receiveShadow>
              <boxGeometry args={[1.2, 3.9, 0.08]} />
            </mesh>
            <mesh position={[x + side * 0.68, 2.3, 0.02]} material={pilasterMat} castShadow receiveShadow>
              <boxGeometry args={[0.16, 4.6, 0.22]} />
            </mesh>
          </group>
        )
      })}
      {/* upper wall above the panels */}
      <mesh position={[side * (HALF + 2.6), 4.75, -0.06]} material={pilasterMat}>
        <boxGeometry args={[4.6, 1.3, 0.1]} />
      </mesh>
    </group>
  )
}

/** Half the visible width of the frame at depth z (for props that should hug the frame's edges). */
function useHalfWidth() {
  const size = useThree((s) => s.size)
  return useMemo(() => {
    const aspect = size.width / size.height
    const { fov, eye } = framing(aspect)
    const t = Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect
    return (z: number) => t * (eye.z - z)
  }, [size.width, size.height])
}

export function Vestibule() {
  const hw = useHalfWidth()
  const edge = (z: number, frac: number, min: number, max: number) => Math.min(max, Math.max(min, hw(z) * frac))
  const { doorL, wood } = useWorldAssets()
  const gold = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c8963c', metalness: 1, roughness: 0.42 }), [])
  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({ map: wood.map, color: '#b08868', roughness: 0.55 }), [wood.map])
  const lintelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: doorL.map,
        normalMap: doorL.normalMap,
        roughnessMap: doorL.ormMap,
        metalnessMap: doorL.ormMap,
        aoMap: doorL.ormMap,
      }),
    [doorL],
  )
  // pedestal: gilded, with a repoussé band (the embroidery relief re-used as metalwork)
  const { frieze } = useWorldAssets()
  const pedestalBand = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#c8963c', metalness: 1, roughness: 0.4, normalMap: frieze.normalMap, normalScale: new THREE.Vector2(1.4, 1.4) }),
    [frieze.normalMap],
  )
  const bandGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(0.76, 0.09, 0.4)
    const uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 2)
    return g
  }, [])

  const toranTop = DOOR.height + 0.32
  const { quality } = useWorldAssets()
  const roses = quality.tier === 'low' ? 4 : quality.tier === 'medium' ? 7 : 10
  // smaller on narrow (portrait) frames, where the corners sit closer to the lettering
  const floralScale = Math.min(1.7, Math.max(1.15, hw(0.42) * 1.15))
  // bougainvillea falling down the walls beside the doors
  const wallCascades: Strand[] = useMemo(() => {
    const out: Strand[] = []
    for (const side of [-1, 1]) {
      out.push({ from: [side * (HALF + 0.8), 2.35, 0.3], dir: [side * 0.25, 0, 0.35], length: 1.4, droop: 0.55 })
      out.push({ from: [side * (HALF + 1.4), 2.4, 0.2], dir: [side * 0.4, 0, 0.25], length: 1.2, droop: 0.75 })
      out.push({ from: [side * (HALF + 0.55), 2.3, 0.44], dir: [-side * 0.2, 0, 0.4], length: 0.8, droop: 0.9 })
    }
    return out
  }, [])
  const garlands = useMemo(() => {
    const g: Array<{ pts: Array<[number, number, number]>; seed: number; accents?: boolean; radius?: number }> = []
    // toran: swags across the lintel
    const n = 4
    for (let i = 0; i < n; i++) {
      const x0 = -HALF - 0.1 + (i * (DOOR.opening + 0.2)) / n
      const x1 = x0 + (DOOR.opening + 0.2) / n
      g.push({ pts: swag([x0, toranTop, 0.2], [x1, toranTop, 0.2], 0.22), seed: 10 + i, radius: 0.042 })
    }
    // strands down both jambs, and shorter drops inside the doorway
    for (const side of [-1, 1] as const) {
      g.push({ pts: hangingStrand(side * (HALF + 0.12), toranTop + 0.05, 1.3, 0.22, 0.03), seed: 20 + side, radius: 0.05 })
      g.push({ pts: hangingStrand(side * (HALF + 0.3), toranTop + 0.05, 1.9, 0.24, 0.025), seed: 30 + side, radius: 0.045 })
      for (let k = 0; k < 3; k++) {
        const x = side * (HALF + 0.42 + 1.3 + k * 1.36)
        g.push({ pts: hangingStrand(x, 4.5, 1.1 + (k % 2) * 0.5, 0.12, 0.03), seed: 60 + k * 3 + side, radius: 0.045 })
      }
      g.push({ pts: hangingStrand(side * (HALF - 0.32), toranTop - 0.05, toranTop - 0.95, 0.18, 0.02), seed: 40 + side, accents: false })
    }
    return g
  }, [toranTop])
  const garlandSets = useMemo(() => {
    const sets = new Map<string, { key: string; strands: Array<Array<[number, number, number]>>; seed: number; accents: boolean; radius: number }>()
    for (const g of garlands) {
      const radius = g.radius ?? 0.032
      const accents = g.accents ?? true
      const key = `${radius}:${accents}`
      if (!sets.has(key)) sets.set(key, { key, strands: [], seed: g.seed, accents, radius })
      sets.get(key)!.strands.push(g.pts)
    }
    return [...sets.values()]
  }, [garlands])

  return (
    <group>
      {/* jambs and lintel */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * (HALF + 0.11), DOOR.height / 2 + 0.15, 0.04]} material={frameMat} castShadow receiveShadow>
            <boxGeometry args={[0.22, DOOR.height + 0.3, 0.3]} />
          </mesh>
          <mesh position={[side * (HALF + 0.005), DOOR.height / 2 + 0.15, 0.2]} material={gold}>
            <boxGeometry args={[0.018, DOOR.height + 0.3, 0.012]} />
          </mesh>
          <WallPanels side={side as -1 | 1} />
        </group>
      ))}
      <mesh position={[0, DOOR.height + 0.32, 0.04]} material={lintelMat} castShadow receiveShadow>
        <boxGeometry args={[DOOR.opening + 0.66, 0.44, 0.32]} />
      </mesh>
      <mesh position={[0, DOOR.height + 0.09, 0.205]} material={gold}>
        <boxGeometry args={[DOOR.opening + 0.6, 0.02, 0.014]} />
      </mesh>
      {/* threshold */}
      <mesh position={[0, 0.03, 0.02]} material={frameMat} receiveShadow>
        <boxGeometry args={[DOOR.opening + 0.5, 0.06, 0.36]} />
      </mesh>

      {/* toran, bells, strands */}
      {garlandSets.map((g) => (
        <Garland key={g.key} points={g.strands} seed={g.seed} accents={g.accents} radius={g.radius} density={520} />
      ))}
      {[-0.95, -0.48, 0, 0.48, 0.95].map((x, i) => (
        <Bell key={x} position={[x, toranTop - 0.3 - (i % 2) * 0.08, 0.22]} scale={0.9} />
      ))}

      {/* roses, jasmine and bougainvillea spilling from the top corners of the doorway (Reference A) */}
      {[-1, 1].map((side) => (
        <group key={`fc${side}`} position={[side * edge(0.42, 1.04, 0.9, HALF + 0.3), 2.3, 0.42]} scale={[-side * floralScale, floralScale, floralScale]}>
          <FloralCorner seed={side < 0 ? 3 : 8} roses={roses} />
        </group>
      ))}
      <Bougainvillea strands={wallCascades} seed={17} density={quality.tier === 'low' ? 10 : 18} clusterRadius={0.13} />

      {/* the pedestal for the invitation */}
      <group position={[0, 0, 2.2]}>
        <mesh position={[0, 0.03, 0]} material={gold} castShadow receiveShadow>
          <boxGeometry args={[0.84, 0.06, 0.46]} />
        </mesh>
        <mesh position={[0, 0.1, 0]} geometry={bandGeo} material={pedestalBand} castShadow receiveShadow />
        <mesh position={[0, 0.16, 0]} material={gold} castShadow receiveShadow>
          <boxGeometry args={[0.81, 0.03, 0.44]} />
        </mesh>
        {[-0.38, 0.38].map((x) =>
          [-0.19, 0.19].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0.025, z]} material={gold} castShadow>
              <sphereGeometry args={[0.035, 16, 12]} />
            </mesh>
          )),
        )}
      </group>

      {/* brass lamp stands either side of the pedestal */}
      <LampStand position={[-edge(2.55, 0.9, 0.66, 1.5), 0, 2.55]} height={1.2} />
      <LampStand position={[edge(2.55, 0.9, 0.66, 1.5), 0, 2.55]} height={1.2} />

      {/* urlis of floating lotus in front */}
      <Urli position={[-edge(3.75, 0.78, 0.3, 1.2), 0, 3.75]} radius={0.3}>
        <Lotus position={[0.02, 0.01, 0]} size={0.1} seed={3} />
        <LotusLeaf position={[0.13, 0.002, 0.08]} radius={0.09} seed={4} />
        <LotusLeaf position={[-0.12, 0.002, -0.06]} radius={0.08} seed={5} rotation={1.4} />
      </Urli>
      <Urli position={[edge(3.6, 0.8, 0.32, 1.25), 0, 3.6]} radius={0.3}>
        <Lotus position={[-0.04, 0.01, 0.02]} size={0.11} seed={7} rotation={0.8} />
        <LotusLeaf position={[0.12, 0.002, -0.08]} radius={0.09} seed={6} rotation={2.2} />
      </Urli>
      {/* lotus beside the pedestal */}
      <Lotus position={[-edge(2.05, 0.7, 0.5, 0.8), 0.0, 2.05]} size={0.14} seed={11} openness={0.9} />
      <LotusLeaf position={[-edge(2.2, 0.62, 0.44, 0.7), 0.003, 2.2]} radius={0.15} seed={12} rotation={0.6} />
      <Lotus position={[edge(2.1, 0.7, 0.5, 0.8), 0.0, 2.1]} size={0.13} seed={13} openness={0.95} rotation={1.1} />
      <LotusLeaf position={[edge(1.95, 0.6, 0.42, 0.7), 0.003, 1.95]} radius={0.14} seed={14} rotation={2.4} />

      {/* diyas on the floor */}
      <Diya position={[-edge(3.1, 0.55, 0.28, 0.6), 0, 3.1]} scale={1.4} light />
      <Diya position={[edge(3.2, 0.55, 0.28, 0.65), 0, 3.2]} scale={1.4} light />
      <Diya position={[-edge(3.0, 0.92, 0.4, 1.75), 0, 3.0]} scale={1.3} />
      <Diya position={[edge(3.05, 0.92, 0.4, 1.8), 0, 3.05]} scale={1.3} />
      <Diya position={[-edge(4.4, 0.7, 0.18, 0.45), 0, 4.4]} scale={1.5} />
      <Diya position={[edge(4.5, 0.7, 0.18, 0.5), 0, 4.5]} scale={1.5} />
    </group>
  )
}
