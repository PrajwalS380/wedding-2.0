import { useMemo } from 'react'
import * as THREE from 'three'
import { useWorldAssets } from '../assets'
import { useBrass } from './BrassLamps'
import { Bougainvillea, type Strand } from './Florals'
import { Garland, hangingStrand } from './Garland'
import { Repeat } from './Repeat'

type V3 = [number, number, number]
const lathe = (pts: Array<[number, number]>, seg = 48) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg)

/** The opening of a cusped (multifoil) pointed arch, left springing point → apex → right springing point. */
export function cuspedArch(width: number, spring: number, apex: number, lobes = 4, cusp = 0.12, steps = 120): Array<[number, number]> {
  const h = apex - spring
  const R = ((width * width) / 4 + h * h) / width
  const cx = -width / 2 + R
  const phiA = Math.atan2(h, -cx)
  const left: Array<[number, number]> = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const phi = Math.PI - t * (Math.PI - phiA)
    const lobe = Math.abs(Math.sin(t * lobes * Math.PI))
    const r = R - cusp * lobe * (1 - t * 0.35)
    left.push([cx + r * Math.cos(phi), spring + r * Math.sin(phi)])
  }
  const right = left
    .slice(0, -1)
    .reverse()
    .map(([x, y]) => [-x, y] as [number, number])
  return [...left, ...right]
}

/** A fluted column shaft: a lathe whose radius ripples around the circumference. */
export function flutedShaft(r: number, h: number, flutes = 16): THREE.BufferGeometry {
  const g = lathe(
    [
      [r * 1.08, 0],
      [r, 0.04],
      [r, h - 0.04],
      [r * 1.08, h],
    ],
    96,
  )
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const z = p.getZ(i)
    const y = p.getY(i)
    if (y < 0.03 || y > h - 0.03) continue
    const a = Math.atan2(z, x)
    const k = 1 - 0.07 * Math.max(0, Math.cos(a * flutes))
    p.setX(i, x * k)
    p.setZ(i, z * k)
  }
  g.computeVertexNormals()
  return g
}

function bellGeometry(): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = []
  const prof: Array<[number, number]> = [
    [0.001, 0.1],
    [0.012, 0.1],
    [0.016, 0.092],
    [0.03, 0.08],
    [0.04, 0.05],
    [0.05, 0.015],
    [0.06, 0.0],
    [0.056, -0.004],
    [0.001, 0.004],
  ]
  for (const [r, y] of prof) pts.push(new THREE.Vector2(r, y))
  return new THREE.LatheGeometry(pts, 28)
}

/**
 * A carved marble archway over the aisle: square pillars with gilded bands, a
 * cusped arch picked out in gold, carved lotus-vine relief, kalash finials, a
 * jasmine garland along the arch, brass bells, and bougainvillea spilling over
 * the top corners.
 */
export function Archway({ position = [0, 0, 0] as V3, width = 4.2, spring = 3.1, apex = 4.5, pillar = 0.44, depth = 0.5 }) {
  const { frieze, marble } = useWorldAssets()
  const gold = useBrass(0.28)
  const W = width / 2 + pillar
  const top = apex + 0.6
  const opening = useMemo(() => cuspedArch(width, spring, apex), [width, spring, apex])

  const frame = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-W, 0)
    shape.lineTo(-W, top)
    shape.lineTo(W, top)
    shape.lineTo(W, 0)
    shape.lineTo(width / 2, 0)
    for (let i = opening.length - 1; i >= 0; i--) shape.lineTo(opening[i][0], opening[i][1])
    shape.lineTo(-width / 2, 0)
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 8 })
    g.translate(0, 0, -depth / 2)
    // carved relief: the frieze tiles every 2 m across and 0.35 m up
    const uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.5, uv.getY(i) * 2.8)
    return g
  }, [W, top, width, opening, depth])
  const stone = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f0e3c9',
        roughness: 0.42,
        map: marble.map,
        normalMap: frieze.normalMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
      }),
    [frieze, marble],
  )
  // gold piping along the arch, front and back
  const piping = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(opening.map(([x, y]) => new THREE.Vector3(x, y, 0)))
    return new THREE.TubeGeometry(curve, 240, 0.026, 8, false)
  }, [opening])
  const bell = useMemo(() => bellGeometry(), [])
  const bells = useMemo(() => {
    const idx = [0.18, 0.32, 0.5, 0.68, 0.82].map((t) => Math.round(t * (opening.length - 1)))
    return idx.map((i) => opening[i])
  }, [opening])
  const garland = useMemo(() => opening.filter((_, i) => i % 6 === 0).map(([x, y]) => [x * 0.985, y - 0.06, depth / 2 + 0.07] as V3), [opening, depth])
  const cascades: Strand[] = useMemo(
    () => [
      { from: [-W + 0.1, top + 0.05, depth / 2], dir: [0.6, 0, 0.4], length: 1.1, droop: 0.9 },
      { from: [-W + 0.05, top - 0.1, depth / 2 + 0.05], dir: [0, 0, 1], length: 1.6, droop: 1.1 },
      { from: [-W + 0.25, top + 0.05, depth / 2], dir: [0.9, 0, 0.2], length: 1.4, droop: 0.4 },
      { from: [-W - 0.05, top - 0.2, depth / 2], dir: [-0.2, 0, 1], length: 2.0, droop: 0.75 },
      { from: [W - 0.1, top + 0.05, depth / 2], dir: [-0.6, 0, 0.4], length: 1.0, droop: 0.9 },
      { from: [W - 0.05, top - 0.1, depth / 2 + 0.05], dir: [0, 0, 1], length: 1.5, droop: 1.1 },
      { from: [W - 0.25, top + 0.05, depth / 2], dir: [-0.9, 0, 0.2], length: 1.2, droop: 0.4 },
      { from: [W + 0.05, top - 0.2, depth / 2], dir: [0.2, 0, 1], length: 2.2, droop: 0.7 },
      { from: [-W + 0.6, top + 0.12, depth / 2 - 0.1], dir: [1, 0, 0.1], length: 1.3, droop: 0.15 },
      { from: [W - 0.6, top + 0.12, depth / 2 - 0.1], dir: [-1, 0, 0.1], length: 1.2, droop: 0.15 },
      { from: [-W - 0.12, top - 0.6, depth / 2 + 0.1], dir: [-0.05, 0, 0.3], length: 2.4, droop: 0.45 },
      { from: [W + 0.12, top - 0.6, depth / 2 + 0.1], dir: [0.05, 0, 0.3], length: 2.3, droop: 0.45 },
    ],
    [W, top, depth],
  )
  const finial = useMemo(
    () =>
      new THREE.LatheGeometry(
        (
          [
            [0.001, 0],
            [0.16, 0],
            [0.16, 0.05],
            [0.1, 0.08],
            [0.14, 0.16],
            [0.12, 0.24],
            [0.05, 0.3],
            [0.07, 0.36],
            [0.02, 0.44],
            [0.001, 0.5],
          ] as Array<[number, number]>
        ).map(([r, y]) => new THREE.Vector2(r, y)),
        32,
      ),
    [],
  )
  const parts = useMemo(() => {
    const colH = spring - 0.55
    const band = new THREE.BoxGeometry(W * 2, 0.34, 0.03)
    const buv = band.attributes.uv
    for (let i = 0; i < buv.count; i++) buv.setXY(i, buv.getX(i) * 2.6, buv.getY(i))
    return {
      colH,
      shaft: flutedShaft(0.1, colH, 14),
      base: lathe([
        [0.001, 0],
        [0.17, 0],
        [0.17, 0.08],
        [0.13, 0.12],
        [0.13, 0.17],
        [0.11, 0.2],
        [0.001, 0.2],
      ]),
      capital: lathe([
        [0.001, 0],
        [0.11, 0],
        [0.14, 0.04],
        [0.12, 0.07],
        [0.16, 0.12],
        [0.2, 0.17],
        [0.2, 0.2],
        [0.001, 0.2],
      ]),
      band,
      bracket: new THREE.BoxGeometry(0.08, 0.14, 0.16),
      rosette: new THREE.TorusGeometry(0.2, 0.03, 10, 40),
      bead: new THREE.SphereGeometry(0.03, 10, 8),
    }
  }, [spring, W])
  const carved = useMemo(() => new THREE.MeshStandardMaterial({ color: '#efe1c4', roughness: 0.5, normalMap: frieze.normalMap, normalScale: new THREE.Vector2(1.2, 1.2) }), [frieze])
  const jewel = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a3122e', roughness: 0.2, metalness: 0.2, emissive: '#3a0410', emissiveIntensity: 0.4 }), [])
  return (
    <group position={position}>
      <mesh geometry={frame} material={stone} castShadow receiveShadow />
      {/* engaged fluted columns on gilt bases and capitals, in front of each pillar */}
      {[-1, 1].map((s) => (
        <group key={`col${s}`} position={[s * (width / 2 + pillar / 2), 0.36, depth / 2 + 0.07]}>
          <mesh geometry={parts.base} material={gold} />
          <mesh geometry={parts.shaft} material={stone} position-y={0.2} castShadow />
          <mesh geometry={parts.capital} material={gold} position-y={0.2 + parts.colH} />
        </group>
      ))}
      {/* a carved lotus-vine band across the top, a bracketed cornice, a gilt medallion over the apex */}
      <mesh geometry={parts.band} material={carved} position={[0, top - 0.32, depth / 2 + 0.03]} />
      <mesh material={gold} position={[0, top - 0.13, depth / 2 + 0.05]}>
        <boxGeometry args={[W * 2 + 0.04, 0.035, 0.05]} />
      </mesh>
      <mesh material={gold} position={[0, top - 0.51, depth / 2 + 0.05]}>
        <boxGeometry args={[W * 2 + 0.04, 0.035, 0.05]} />
      </mesh>
      <mesh material={stone} position={[0, top + 0.02, 0]} castShadow>
        <boxGeometry args={[W * 2 + 0.34, 0.14, depth + 0.34]} />
      </mesh>
      <Repeat geometry={parts.bracket} material={gold} positions={Array.from({ length: Math.floor((W * 2) / 0.42) + 1 }, (_, i): V3 => [-W + 0.12 + i * 0.42, top - 0.1, depth / 2 + 0.1])} />
      <group position={[0, (apex + top - 0.5) / 2 + 0.02, depth / 2 + 0.04]}>
        <mesh geometry={parts.rosette} material={gold} />
        <mesh material={jewel}>
          <circleGeometry args={[0.12, 32]} />
        </mesh>
        <Repeat geometry={parts.bead} material={gold} positions={Array.from({ length: 12 }, (_, i): V3 => [Math.cos((i / 12) * Math.PI * 2) * 0.28, Math.sin((i / 12) * Math.PI * 2) * 0.28, 0])} />
      </group>
      <mesh geometry={piping} material={gold} position-z={depth / 2 + 0.02} />
      <mesh geometry={piping} material={gold} position-z={-depth / 2 - 0.02} />
      {/* gilded bands: plinths, capitals and the cornice */}
      {[-1, 1].map((s) => (
        <group key={s} position-x={s * (W - pillar / 2)}>
          {[0.16, 0.34, spring - 0.08, spring + 0.06].map((y, i) => (
            <mesh key={i} material={gold} position-y={y}>
              <boxGeometry args={[pillar + (i === 0 ? 0.12 : 0.05), i === 0 ? 0.3 : 0.06, depth + (i === 0 ? 0.12 : 0.05)]} />
            </mesh>
          ))}
          <mesh geometry={finial} material={gold} position-y={top + 0.06} />
        </group>
      ))}
      <mesh material={gold} position-y={top + 0.03}>
        <boxGeometry args={[W * 2 + 0.12, 0.07, depth + 0.12]} />
      </mesh>
      <mesh geometry={finial} material={gold} position-y={top + 0.06} scale={1.3} />
      {/* bells hanging from the cusps */}
      {bells.map(([x, y], i) => (
        <group key={i} position={[x * 0.97, y - 0.02, depth / 2 - 0.12]}>
          <mesh material={gold} position-y={-0.12}>
            <cylinderGeometry args={[0.004, 0.004, 0.24, 6]} />
          </mesh>
          <mesh geometry={bell} material={gold} position-y={-0.34} />
          <mesh material={gold} position-y={-0.35}>
            <sphereGeometry args={[0.014, 10, 8]} />
          </mesh>
        </group>
      ))}
      <Garland points={garland} density={700} radius={0.05} seed={91} />
      <Garland points={[-1, 1].map((s) => hangingStrand(s * (width / 2 - 0.08), spring + 0.1, 0.9, depth / 2 + 0.08, 0.02))} density={600} radius={0.042} seed={93} />
      <Bougainvillea strands={cascades} seed={7} density={20} clusterRadius={0.12} />
    </group>
  )
}
