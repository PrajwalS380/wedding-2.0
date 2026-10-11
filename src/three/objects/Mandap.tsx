import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useWorldAssets } from '../assets'
import { DiyaRow, LampRow, useBrass } from './BrassLamps'
import { cuspedArch, flutedShaft } from './Archway'
import { RoseBouquet } from './Florals'
import { Garland, swag } from './Garland'
import { Petals } from './Petals'

type V3 = [number, number, number]
const lathe = (pts: Array<[number, number]>, seg = 48) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg)

/** Pale silk with a woven gold border down one edge and along the hem (for the drapes). */
function drapeTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 512
  const g = c.getContext('2d')!
  g.fillStyle = '#f9d4d8'
  g.fillRect(0, 0, 256, 512)
  // faint woven buti
  g.fillStyle = 'rgba(214, 160, 70, 0.45)'
  for (let y = 12; y < 512; y += 24)
    for (let x = (y / 24) % 2 ? 10 : 22; x < 256; x += 24) {
      g.beginPath()
      g.arc(x, y, 2.2, 0, Math.PI * 2)
      g.fill()
    }
  const band = (x: number, y: number, w: number, h: number) => {
    const grad = g.createLinearGradient(x, y, x + (w > h ? 0 : w), y + (w > h ? h : 0))
    grad.addColorStop(0, '#b98a2e')
    grad.addColorStop(0.5, '#f4d68a')
    grad.addColorStop(1, '#a27424')
    g.fillStyle = grad
    g.fillRect(x, y, w, h)
  }
  band(0, 0, 22, 512)
  band(234, 0, 22, 512)
  band(0, 470, 256, 42)
  g.fillStyle = '#c4243f'
  for (let y = 10; y < 470; y += 18) {
    g.fillRect(9, y, 4, 4)
    g.fillRect(243, y, 4, 4)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** An ornate wedding seat: a cusped gilt frame around a velvet back, a cushioned seat, scrolled arms. */
function Seat({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  const gold = useBrass(0.3)
  const velvet = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: '#7a1424', roughness: 0.85, sheen: 1, sheenRoughness: 0.4, sheenColor: new THREE.Color('#e0627a') }),
    [],
  )
  const geos = useMemo(() => {
    const outer = cuspedArch(0.66, 0.62, 1.12, 3, 0.04, 60)
    const inner = cuspedArch(0.5, 0.6, 1.02, 3, 0.03, 60)
    const frame = new THREE.Shape()
    frame.moveTo(-0.33, 0)
    for (const [x, y] of outer) frame.lineTo(x, y)
    frame.lineTo(0.33, 0)
    frame.closePath()
    const hole = new THREE.Path()
    hole.moveTo(-0.25, 0.08)
    for (const [x, y] of inner) hole.lineTo(x, y)
    hole.lineTo(0.25, 0.08)
    hole.closePath()
    frame.holes.push(hole)
    const panel = new THREE.Shape()
    panel.moveTo(-0.25, 0.08)
    for (const [x, y] of inner) panel.lineTo(x, y)
    panel.lineTo(0.25, 0.08)
    panel.closePath()
    const arm = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.0, -0.22), new THREE.Vector3(0, 0.2, -0.12), new THREE.Vector3(0, 0.22, 0.12), new THREE.Vector3(0, 0.12, 0.26), new THREE.Vector3(0, 0.0, 0.24)]),
      40,
      0.025,
      8,
      false,
    )
    return {
      frame: new THREE.ExtrudeGeometry(frame, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 }),
      panel: new THREE.ShapeGeometry(panel, 12),
      arm,
      leg: lathe([
        [0.001, 0],
        [0.035, 0],
        [0.03, 0.04],
        [0.02, 0.1],
        [0.03, 0.16],
        [0.03, 0.2],
        [0.001, 0.2],
      ]),
    }
  }, [])
  return (
    <group position={position} rotation-y={rotation}>
      <group position={[0, 0.2, -0.28]}>
        <mesh geometry={geos.frame} material={gold} castShadow />
        <mesh geometry={geos.panel} material={velvet} position-z={0.03} />
      </group>
      <mesh material={velvet} position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.64, 0.12, 0.56]} />
      </mesh>
      <mesh material={gold} position={[0, 0.235, 0]}>
        <boxGeometry args={[0.68, 0.05, 0.6]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geos.arm} material={gold} position={[s * 0.33, 0.36, 0]} />
      ))}
      {[
        [-0.28, -0.24],
        [0.28, -0.24],
        [-0.28, 0.24],
        [0.28, 0.24],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} geometry={geos.leg} material={gold} position={[x, 0, z]} />
      ))}
    </group>
  )
}

/** A small brass urn holding a dome of roses. */
function FlowerUrn({ position, seed, scale = 1 }: { position: V3; seed: number; scale?: number }) {
  const gold = useBrass(0.26)
  const urn = useMemo(
    () =>
      lathe([
        [0.001, 0],
        [0.13, 0],
        [0.13, 0.03],
        [0.07, 0.07],
        [0.06, 0.12],
        [0.11, 0.2],
        [0.17, 0.3],
        [0.18, 0.38],
        [0.14, 0.44],
        [0.17, 0.47],
        [0.001, 0.45],
      ]),
    [],
  )
  return (
    <group position={position} scale={scale}>
      <mesh geometry={urn} material={gold} castShadow />
      <RoseBouquet position={[0, 0.46, 0]} radius={0.2} count={46} seed={seed} />
    </group>
  )
}

/** A bell fringe (jhalar) hanging along a straight edge. */
function BellFringe({ from, to, step = 0.16 }: { from: V3; to: V3; step?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const gold = useBrass(0.3)
  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(0.022, 0.05, 10, 1, true)
    g.translate(0, -0.06, 0)
    const stem = new THREE.CylinderGeometry(0.003, 0.003, 0.05, 4)
    stem.translate(0, -0.025, 0)
    return g
  }, [])
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const n = Math.max(1, Math.round(a.distanceTo(b) / step))
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    for (let i = 0; i <= n; i++) {
      m.makeTranslation(a.x + ((b.x - a.x) * i) / n, a.y, a.z + ((b.z - a.z) * i) / n)
      ref.current?.setMatrixAt(i, m)
    }
    if (ref.current) {
      ref.current.instanceMatrix.needsUpdate = true
      ref.current.computeBoundingSphere()
    }
  })
  return <instancedMesh ref={ref} args={[geo, gold, n + 1]} />
}

/**
 * The wedding mandap: a stepped marble platform with a carpet and diyas along
 * its edge; four fluted ivory columns on gilt bases and lotus capitals, each
 * wound with a jasmine-and-marigold garland; a carved entablature with a bell
 * fringe; a gathered silk ceiling with a brass chandelier under the tented
 * canopy and kalash; tied-back silk drapes with woven gold borders; swags of
 * flowers; urns of roses; and the couple's seats at the back.
 */
export function Mandap({ position }: { position: V3 }) {
  const { marble, frieze } = useWorldAssets()
  const gold = useBrass(0.3)
  const P = 2.15
  const mats = useMemo(
    () => ({
      step: new THREE.MeshStandardMaterial({ map: marble.map, roughnessMap: marble.roughnessMap, color: '#d9cbb4', roughness: 0.35 }),
      ivory: new THREE.MeshStandardMaterial({ color: '#f3e8d4', roughness: 0.45, map: marble.map }),
      carved: new THREE.MeshStandardMaterial({ color: '#f1e5cf', roughness: 0.45, normalMap: frieze.normalMap, normalScale: new THREE.Vector2(0.9, 0.9) }),
      carpet: new THREE.MeshPhysicalMaterial({ color: '#7a1424', roughness: 0.85, sheen: 1, sheenColor: new THREE.Color('#d8576d') }),
      canopy: new THREE.MeshPhysicalMaterial({ color: '#d9475e', roughness: 0.7, sheen: 1, sheenColor: new THREE.Color('#ffb3c0'), side: THREE.DoubleSide }),
      ceiling: new THREE.MeshPhysicalMaterial({ color: '#f6e2c4', roughness: 0.75, sheen: 1, sheenColor: new THREE.Color('#fff2d8'), side: THREE.DoubleSide }),
      drape: new THREE.MeshPhysicalMaterial({ map: drapeTexture(), roughness: 0.8, sheen: 1, sheenColor: new THREE.Color('#ffe6ea'), side: THREE.DoubleSide }),
    }),
    [marble, frieze],
  )
  const geos = useMemo(() => {
    const entab = new THREE.BoxGeometry(P * 2 + 0.6, 0.34, P * 2 + 0.6)
    const uv = entab.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2.4, uv.getY(i))
    const canopy = new THREE.ConeGeometry(3.4, 1.3, 4, 1, true)
    canopy.rotateY(Math.PI / 4)
    // gathered silk ceiling: radial pleats sagging toward the centre
    const ceiling = new THREE.CircleGeometry(2.2, 64, 0, Math.PI * 2)
    const cp = ceiling.attributes.position
    for (let i = 0; i < cp.count; i++) {
      const x = cp.getX(i)
      const y = cp.getY(i)
      const r = Math.hypot(x, y)
      const a = Math.atan2(y, x)
      cp.setZ(i, -0.35 * (1 - r / 2.2) + 0.03 * Math.sin(a * 32) * (r / 2.2))
    }
    ceiling.rotateX(Math.PI / 2)
    ceiling.computeVertexNormals()
    const drape = new THREE.PlaneGeometry(1.15, 2.6, 24, 12)
    const dp = drape.attributes.position
    for (let i = 0; i < dp.count; i++) {
      const x = dp.getX(i)
      const y = dp.getY(i)
      const gather = (y + 1.3) / 2.6
      dp.setZ(i, Math.sin(x * 9) * 0.06 * (0.4 + gather))
      dp.setX(i, x * (0.4 + 0.6 * gather) - 0.3 * (1 - gather))
    }
    drape.computeVertexNormals()
    return {
      entab,
      canopy,
      ceiling,
      drape,
      base: lathe([
        [0.001, 0],
        [0.24, 0],
        [0.24, 0.12],
        [0.2, 0.16],
        [0.2, 0.22],
        [0.15, 0.27],
        [0.14, 0.32],
        [0.001, 0.32],
      ]),
      shaft: flutedShaft(0.11, 2.0),
      capital: lathe([
        [0.001, 0],
        [0.12, 0],
        [0.15, 0.04],
        [0.13, 0.08],
        [0.17, 0.14],
        [0.23, 0.2],
        [0.25, 0.24],
        [0.25, 0.28],
        [0.001, 0.28],
      ]),
      ring: new THREE.TorusGeometry(0.42, 0.025, 10, 48),
    }
  }, [])

  const corners: Array<[number, number]> = [
    [-P, -P],
    [P, -P],
    [-P, P],
    [P, P],
  ]
  const swags = useMemo(() => {
    const y = 2.86
    return [swag([-P, y, P + 0.32], [P, y, P + 0.32], 0.38), swag([-P, y, -P - 0.32], [P, y, -P - 0.32], 0.38), swag([-P - 0.32, y, -P], [-P - 0.32, y, P], 0.38), swag([P + 0.32, y, -P], [P + 0.32, y, P], 0.38)]
  }, [])
  const helix = (x: number, z: number) => {
    const pts: V3[] = []
    for (let i = 0; i <= 36; i++) {
      const t = i / 36
      const a = t * Math.PI * 2 * 3.2
      pts.push([x + Math.cos(a) * 0.14, 0.36 + t * 2.0, z + Math.sin(a) * 0.14])
    }
    return pts
  }
  const chandelier = useMemo(() => {
    const strands: V3[][] = []
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * Math.PI * 2
      strands.push([
        [Math.cos(a) * 0.42, 2.42, Math.sin(a) * 0.42],
        [Math.cos(a) * 0.4, 2.15, Math.sin(a) * 0.4],
        [Math.cos(a) * 0.36, 1.92, Math.sin(a) * 0.36],
      ])
    }
    return strands
  }, [])
  const stepDiyas = useMemo(() => {
    const out: V3[] = []
    for (let i = 0; i < 9; i++) out.push([-2.4 + i * 0.6, 0.56, 2.72])
    return out
  }, [])

  return (
    <group position={position}>
      {/* stepped marble platform with gilt nosing */}
      {[0, 1, 2].map((k) => (
        <group key={k}>
          <mesh position={[0, 0.1 + k * 0.18, 0]} material={mats.step} receiveShadow castShadow>
            <boxGeometry args={[6.4 - k * 0.5, 0.2, 6.4 - k * 0.5]} />
          </mesh>
          <mesh position={[0, 0.2 + k * 0.18, (6.4 - k * 0.5) / 2]} material={gold}>
            <boxGeometry args={[6.4 - k * 0.5, 0.02, 0.02]} />
          </mesh>
        </group>
      ))}
      <DiyaRow positions={stepDiyas} scale={1.1} />
      <group position-y={0.64}>
        {/* carpet with a gold border */}
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, 0]} material={gold}>
          <planeGeometry args={[4.3, 4.3]} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.009, 0]} material={mats.carpet} receiveShadow>
          <planeGeometry args={[4.1, 4.1]} />
        </mesh>
        <Petals count={0} bounds={[[-1.9, 0, -1.9], [1.9, 0, 1.9]]} resting={90} floorY={0.012} seed={33} />

        {/* columns: gilt base, fluted ivory shaft, lotus capital, garland wound round */}
        {corners.map(([x, z]) => (
          <group key={`${x}${z}`}>
            <mesh geometry={geos.base} material={gold} position={[x, 0, z]} castShadow />
            <mesh geometry={geos.shaft} material={mats.ivory} position={[x, 0.32, z]} castShadow />
            <mesh geometry={geos.capital} material={gold} position={[x, 2.32, z]} />
          </group>
        ))}
        <Garland points={corners.map(([x, z]) => helix(x, z))} density={460} radius={0.03} seed={120} />

        {/* carved entablature, gilt mouldings, bell fringe */}
        <mesh geometry={geos.entab} material={mats.carved} position={[0, 2.78, 0]} castShadow />
        {[2.6, 2.96].map((y) => (
          <mesh key={y} position={[0, y, 0]} material={gold}>
            <boxGeometry args={[P * 2 + 0.66, 0.04, P * 2 + 0.66]} />
          </mesh>
        ))}
        <BellFringe from={[-P - 0.3, 2.58, P + 0.32]} to={[P + 0.3, 2.58, P + 0.32]} />
        <BellFringe from={[-P - 0.32, 2.58, -P - 0.3]} to={[-P - 0.32, 2.58, P + 0.3]} />
        <BellFringe from={[P + 0.32, 2.58, -P - 0.3]} to={[P + 0.32, 2.58, P + 0.3]} />

        {/* gathered silk ceiling and a brass chandelier hung with jasmine */}
        <mesh geometry={geos.ceiling} material={mats.ceiling} position={[0, 2.6, 0]} />
        <mesh material={gold} position={[0, 2.38, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.44, 6]} />
        </mesh>
        <mesh geometry={geos.ring} material={gold} position={[0, 2.16, 0]} rotation-x={Math.PI / 2} />
        <Garland points={chandelier} density={300} radius={0.018} seed={150} />

        {/* tented canopy and kalash */}
        <mesh geometry={geos.canopy} material={mats.canopy} position={[0, 3.6, 0]} />
        <mesh position={[0, 4.3, 0]} material={gold}>
          <sphereGeometry args={[0.2, 20, 14]} />
        </mesh>
        <mesh position={[0, 4.56, 0]} material={gold}>
          <coneGeometry args={[0.07, 0.36, 14]} />
        </mesh>

        {/* hanging strings and swags of flowers */}
        <Garland points={[-1.6, -0.8, 0, 0.8, 1.6].map((x): V3[] => [[x, 2.58, P + 0.3], [x + 0.02, 1.9, P + 0.32], [x, 1.45, P + 0.31]])} density={300} radius={0.035} seed={70} />
        <Garland points={swags} density={420} radius={0.05} seed={50} />

        {/* silk drapes tied back at the front columns */}
        <mesh geometry={geos.drape} material={mats.drape} position={[-P + 0.5, 1.3, P + 0.12]} />
        <mesh geometry={geos.drape} material={mats.drape} position={[P - 0.5, 1.3, P + 0.12]} scale-x={-1} />

        {/* the couple's seats, urns of roses, lamps */}
        <Seat position={[-0.42, 0, -1.1]} />
        <Seat position={[0.42, 0, -1.1]} />
        {[
          [-1.55, -1.5],
          [1.55, -1.5],
          [-1.7, 1.55],
          [1.7, 1.55],
        ].map(([x, z], i) => (
          <FlowerUrn key={i} position={[x, 0, z]} seed={200 + i} scale={1.15} />
        ))}
        <LampRow positions={[[-1.15, 0, 1.75], [1.15, 0, 1.75]]} height={0.9} />
      </group>
    </group>
  )
}
