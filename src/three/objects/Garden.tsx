import { MeshReflectorMaterial } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { mulberry32 } from '../textures/noise'
import { useWorldAssets } from '../assets'
import { Diya, LampRow } from './BrassLamps'
import { FlameLight } from './Flame'
import { MarbleFloor } from './Floor'
import { Lotus, LotusLeaf } from './Lotus'
import { Petals } from './Petals'
import { Mandap } from './Mandap'
import { Archway } from './Archway'

/**
 * The palace garden beyond the doors at golden hour: a marble walkway lined with
 * brass lamps and flowering shrubs, a flower-hung mandap on a stepped platform,
 * palms backlit against the sky and palace domes fading into the haze.
 */

const lathe = (pts: Array<[number, number]>, seg = 48) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg)

// ------------------------------------------------------------------ palms
function frondTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 1024
  const g = c.getContext('2d')!
  g.clearRect(0, 0, 256, 1024)
  const rand = mulberry32(12)
  // leaflets: filled, tapering blades that overlap, angled toward the tip
  for (let y = 16; y < 1012; y += 8) {
    const t = y / 1024
    const len = 120 * Math.sin(Math.PI * Math.min(1, t * 1.08 + 0.04)) * (0.9 + rand() * 0.15)
    const w = 7.5 - t * 3.5
    for (const s of [-1, 1]) {
      const tipX = 128 + s * len
      const tipY = y + 34 + rand() * 12
      const grad = g.createLinearGradient(128, y, tipX, tipY)
      grad.addColorStop(0, `hsl(${78 + rand() * 8}, 45%, ${30 + rand() * 6}%)`)
      grad.addColorStop(1, `hsl(${100 + rand() * 10}, 48%, ${17 + rand() * 6}%)`)
      g.fillStyle = grad
      g.beginPath()
      g.moveTo(128, y - w * 0.5)
      g.quadraticCurveTo(128 + s * len * 0.55, y - w * 0.2 + 6, tipX, tipY)
      g.quadraticCurveTo(128 + s * len * 0.5, y + w + 8, 128, y + w * 0.6)
      g.closePath()
      g.fill()
    }
  }
  // the rachis
  g.strokeStyle = '#7d7a3a'
  g.lineWidth = 6
  g.beginPath()
  g.moveTo(128, 0)
  g.lineTo(128, 1024)
  g.stroke()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function frondGeometry(len: number, width: number, droop: number): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(width, len, 4, 16)
  g.translate(0, len / 2, 0)
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    const t = y / len
    // arch up then droop down toward the tip; leaflets fold into a shallow V
    pos.setZ(i, droop * t * t * len - Math.abs(pos.getX(i)) * 0.4)
    pos.setY(i, y * (1 - t * 0.15))
  }
  g.computeVertexNormals()
  return g
}

function Palm({ position, height, lean, seed, frondMat }: { position: [number, number, number]; height: number; lean: number; seed: number; frondMat: THREE.Material }) {
  const { trunk, fronds, crown } = useMemo(() => {
    const rand = mulberry32(seed)
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(lean * 0.3, height * 0.35, 0),
      new THREE.Vector3(lean * 0.75, height * 0.7, 0),
      new THREE.Vector3(lean, height, 0),
    ])
    const trunk = new THREE.TubeGeometry(path, 24, 0.16, 8, false)
    // taper the trunk and add ring ridges
    const pos = trunk.attributes.position
    const cols: number[] = []
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / height
      const ring = 0.5 + 0.5 * Math.sin(y * 90)
      const c = new THREE.Color('#5b4430').multiplyScalar(0.75 + ring * 0.25)
      cols.push(c.r, c.g, c.b)
    }
    trunk.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
    const top = path.getPoint(1)
    const parts: THREE.BufferGeometry[] = []
    const n = 13
    for (let k = 0; k < n; k++) {
      const f = frondGeometry(2.6 + rand() * 0.9, 1.0, -0.55 - rand() * 0.25)
      f.rotateX(-(0.35 + rand() * 0.75))
      f.rotateY((k / n) * Math.PI * 2 + rand() * 0.3)
      f.translate(top.x, top.y, top.z)
      parts.push(f)
    }
    const fronds = mergeGeometries(parts)
    return { trunk, fronds, crown: top }
  }, [height, lean, seed])
  return (
    <group position={position}>
      <mesh geometry={trunk}>
        <meshStandardMaterial vertexColors roughness={0.9} />
      </mesh>
      <mesh geometry={fronds} material={frondMat} />
      <mesh position={[crown.x, crown.y - 0.1, crown.z]}>
        <sphereGeometry args={[0.24, 10, 8]} />
        <meshStandardMaterial color="#4a3a22" roughness={0.9} />
      </mesh>
    </group>
  )
}

// ------------------------------------------------------------------ shrubs with blossoms
/** A cluster of glossy leaves on a transparent card (canvas, generated once). */
function leafClusterTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const g = c.getContext('2d')!
  const rand = mulberry32(17)
  for (let i = 0; i < 46; i++) {
    const x = 40 + rand() * 176
    const y = 40 + rand() * 176
    const a = rand() * Math.PI * 2
    const len = 30 + rand() * 34
    const l = 26 + rand() * 24
    g.save()
    g.translate(x, y)
    g.rotate(a)
    const grad = g.createLinearGradient(0, -len, 0, 0)
    grad.addColorStop(0, `hsl(${92 + rand() * 18}, 48%, ${l + 14}%)`)
    grad.addColorStop(1, `hsl(${100 + rand() * 14}, 52%, ${l}%)`)
    g.fillStyle = grad
    g.beginPath()
    g.moveTo(0, 0)
    g.quadraticCurveTo(len * 0.32, -len * 0.5, 0, -len)
    g.quadraticCurveTo(-len * 0.32, -len * 0.5, 0, 0)
    g.fill()
    g.strokeStyle = 'rgba(200,225,160,0.22)'
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(0, -2)
    g.lineTo(0, -len * 0.9)
    g.stroke()
    g.restore()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const blossomGeo = (() => {
  const pos: number[] = []
  for (let k = 0; k < 10; k++) {
    const a0 = (k / 10) * Math.PI * 2
    const a1 = ((k + 1) / 10) * Math.PI * 2
    const r0 = k % 2 === 0 ? 1 : 0.42
    const r1 = (k + 1) % 2 === 0 ? 1 : 0.42
    pos.push(0, 0, 0.15, Math.cos(a0) * r0, Math.sin(a0) * r0, 0, Math.cos(a1) * r1, Math.sin(a1) * r1, 0)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.computeVertexNormals()
  return g
})()

function Shrubs({ count, area, seed, size = 1, bloom = '#e2507e' }: { count: number; area: [[number, number], [number, number]]; seed: number; size?: number; bloom?: string }) {
  const leafRef = useRef<THREE.InstancedMesh>(null)
  const bloomRef = useRef<THREE.InstancedMesh>(null)
  const leafMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: leafClusterTexture(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.82, color: '#9fb07c' }),
    [],
  )
  const cards = count * 26
  const blooms = count * 16
  useLayoutEffect(() => {
    const rand = mulberry32(seed)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const [[x0, z0], [x1, z1]] = area
    const centres: Array<[number, number, number, number]> = []
    for (let i = 0; i < count; i++) {
      const s = (0.4 + rand() * 0.38) * size
      centres.push([x0 + rand() * (x1 - x0), s * 0.75, z0 + rand() * (z1 - z0), s])
    }
    for (let i = 0; i < cards; i++) {
      const [x, y, z, s] = centres[i % count]
      const dir = new THREE.Vector3(rand() - 0.5, (rand() - 0.3) * 0.8, rand() - 0.5).normalize()
      const p = new THREE.Vector3(x, y, z).addScaledVector(dir, s * (0.35 + rand() * 0.55))
      e.set(rand() * Math.PI, rand() * Math.PI * 2, rand() * Math.PI)
      q.setFromEuler(e)
      const cs = s * (0.75 + rand() * 0.5)
      m.compose(p, q, new THREE.Vector3(cs, cs, cs))
      leafRef.current?.setMatrixAt(i, m)
    }
    for (let i = 0; i < blooms; i++) {
      const [x, y, z, s] = centres[i % count]
      const dir = new THREE.Vector3(rand() - 0.5, rand() * 0.9, rand() - 0.5).normalize()
      const p = new THREE.Vector3(x, y, z).addScaledVector(dir, s * 0.92)
      q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
      const bs = (0.028 + rand() * 0.022) * Math.sqrt(size)
      m.compose(p, q, new THREE.Vector3(bs, bs, bs))
      bloomRef.current?.setMatrixAt(i, m)
    }
    if (leafRef.current) leafRef.current.instanceMatrix.needsUpdate = true
    if (bloomRef.current) bloomRef.current.instanceMatrix.needsUpdate = true
  }, [area, count, cards, blooms, seed, size])
  return (
    <group>
      <instancedMesh ref={leafRef} args={[undefined, leafMat, cards]} receiveShadow>
        <planeGeometry args={[0.7, 0.7]} />
      </instancedMesh>
      <instancedMesh ref={bloomRef} args={[blossomGeo, undefined, blooms]}>
        <meshStandardMaterial color={bloom} roughness={0.55} emissive={bloom} emissiveIntensity={0.14} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  )
}

// ------------------------------------------------------------------ the palace in the haze
/** Thin the scene fog on distant set pieces so their detail survives the haze. */
function hazed<T extends THREE.Material>(m: T, amount: number): T {
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <fog_fragment>',
      `#ifdef USE_FOG
        gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, smoothstep(fogNear, fogFar, vFogDepth) * ${amount.toFixed(2)});
      #endif`,
    )
  }
  m.customProgramCacheKey = () => `hazed-${amount}`
  return m
}

/** A Mughal pointed arch, base centred on the origin. */
function archShape(w: number, h: number): THREE.Shape {
  const r = w / 2
  const spring = h - w * 0.62
  const s = new THREE.Shape()
  s.moveTo(-r, 0)
  s.lineTo(r, 0)
  s.lineTo(r, spring)
  s.quadraticCurveTo(r, spring + w * 0.48, 0, h)
  s.quadraticCurveTo(-r, spring + w * 0.48, -r, spring)
  s.closePath()
  return s
}

const DOME = (t: number) => Math.sin(Math.PI * Math.min(1, t * 0.95)) * (1 - t * 0.3) + 0.001

function Palace({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const mats = useMemo(
    () => ({
      stone: hazed(new THREE.MeshStandardMaterial({ color: '#b07f62', roughness: 0.9 }), 0.5),
      trim: hazed(new THREE.MeshStandardMaterial({ color: '#d8b48c', roughness: 0.8 }), 0.5),
      shade: hazed(new THREE.MeshStandardMaterial({ color: '#3a1f18', roughness: 1 }), 0.45),
      gold: hazed(new THREE.MeshStandardMaterial({ color: '#d9a64a', metalness: 1, roughness: 0.35 }), 0.45),
      glow: hazed(new THREE.MeshBasicMaterial({ color: new THREE.Color(2.1, 1.15, 0.45), side: THREE.DoubleSide }), 0.3),
      bulbs: hazed(new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.2, 1.0) }), 0.2),
    }),
    [],
  )
  const geos = useMemo(() => {
    const domePts: Array<[number, number]> = []
    for (let i = 0; i <= 16; i++) domePts.push([DOME(i / 16), (i / 16) * 1.4])
    const iwanOuter = archShape(5.2, 5.6)
    const ring = archShape(5.2, 5.6)
    ring.holes.push(new THREE.Path(archShape(4.4, 5.1).getPoints(24)))
    return {
      dome: lathe(domePts, 32),
      window: new THREE.ShapeGeometry(archShape(0.8, 1.5), 8),
      door: new THREE.ShapeGeometry(archShape(1.0, 2.1), 8),
      iwan: new THREE.ShapeGeometry(archShape(4.4, 5.1), 16),
      iwanDoor: new THREE.ShapeGeometry(archShape(1.6, 3.0), 12),
      iwanFrame: new THREE.ExtrudeGeometry(ring, { depth: 0.3, bevelEnabled: false, curveSegments: 16 }),
      iwanOuter,
      bulb: new THREE.IcosahedronGeometry(0.1, 0),
      merlon: new THREE.BoxGeometry(0.32, 0.42, 0.32),
    }
  }, [])

  // façade openings (lit) and the crenellation, as instances
  const windowsRef = useRef<THREE.InstancedMesh>(null)
  const doorsRef = useRef<THREE.InstancedMesh>(null)
  const merlonRef = useRef<THREE.InstancedMesh>(null)
  const bulbRef = useRef<THREE.InstancedMesh>(null)
  const layout = useMemo(() => {
    const windows: THREE.Matrix4[] = []
    const doors: THREE.Matrix4[] = []
    const merlons: THREE.Matrix4[] = []
    const bulbs: THREE.Vector3[] = []
    const at = (x: number, y: number, z: number, ry = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(1, 1, 1))
    for (let x = -12; x <= 12.01; x += 1.6) {
      if (Math.abs(x) < 3.2) continue
      doors.push(at(x, 0.35, 3.02))
      windows.push(at(x, 3.4, 3.02))
    }
    // drum windows, facing out
    for (let a = -70; a <= 70; a += 20) {
      const r = THREE.MathUtils.degToRad(a)
      windows.push(at(Math.sin(r) * 4.5, 7.2, Math.cos(r) * 4.5, r))
    }
    for (let x = -12.9; x <= 12.91; x += 0.72) merlons.push(at(x, 6.46, 2.95))
    // strings of lights: parapet, corners, the iwan arch, every dome rib, the minaret galleries
    for (let x = -13; x <= 13.01; x += 0.42) bulbs.push(new THREE.Vector3(x, 6.75, 3.15))
    for (const x of [-13.1, 13.1]) for (let y = 0.2; y < 6.4; y += 0.42) bulbs.push(new THREE.Vector3(x, y, 3.15))
    for (const p of geos.iwanOuter.getPoints(28)) if (p.y > 0.2) bulbs.push(new THREE.Vector3(p.x * 1.03, p.y * 1.02, 3.35))
    const ribs = (cx: number, cy: number, cz: number, sx: number, sy: number, n: number, steps: number, front = false) => {
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2
        if (front && Math.cos(a) < -0.2) continue
        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          const r = DOME(t) * sx * 1.03
          bulbs.push(new THREE.Vector3(cx + Math.sin(a) * r, cy + t * 1.4 * sy, cz + Math.cos(a) * r))
        }
      }
    }
    ribs(0, 10, 0, 4.3, 4.6, 14, 16, true)
    for (let k = 0; k < 40; k++) {
      const a = (k / 40) * Math.PI * 2
      if (Math.cos(a) > -0.2) bulbs.push(new THREE.Vector3(Math.sin(a) * 4.75, 10.05, Math.cos(a) * 4.75))
    }
    for (const [x, z, sc, h] of [[-8, 1, 1.6, 4], [8, 1, 1.6, 4], [-12.5, 0, 1.1, 7], [12.5, 0, 1.1, 7]]) ribs(x, h * sc, z, sc, sc, 8, 7, true)
    for (const x of [-15, 15]) {
      for (const y of [6.2, 11.2]) for (let k = 0; k < 18; k++) {
        const a = (k / 18) * Math.PI * 2
        if (Math.cos(a) > -0.3) bulbs.push(new THREE.Vector3(x + Math.sin(a) * 1.25, y, 1 + Math.cos(a) * 1.25))
      }
      for (let y = 0.3; y < 16; y += 0.5) bulbs.push(new THREE.Vector3(x, y, 1.95 - y * 0.012))
      ribs(x, 16, 1, 0.9, 0.9, 8, 6, true)
    }
    return { windows, doors, merlons, bulbs }
  }, [geos])
  useLayoutEffect(() => {
    const put = (mesh: THREE.InstancedMesh | null, ms: THREE.Matrix4[]) => {
      if (!mesh) return
      ms.forEach((m, i) => mesh.setMatrixAt(i, m))
      mesh.instanceMatrix.needsUpdate = true
    }
    put(windowsRef.current, layout.windows)
    put(doorsRef.current, layout.doors)
    put(merlonRef.current, layout.merlons)
    put(bulbRef.current, layout.bulbs.map((v) => new THREE.Matrix4().makeTranslation(v.x, v.y, v.z)))
  }, [layout])

  const { stone, trim, shade, gold, glow, bulbs } = mats
  const chhatri = (x: number, z: number, s: number, h: number) => (
    <group key={`${x}${z}`} position={[x, 0, z]} scale={s}>
      <mesh material={stone} position-y={h / 2}>
        <cylinderGeometry args={[0.9, 1, h, 12]} />
      </mesh>
      <mesh material={trim} position-y={h - 0.05}>
        <cylinderGeometry args={[1.12, 1.12, 0.12, 16]} />
      </mesh>
      <mesh geometry={geos.dome} material={stone} position-y={h} />
      <mesh material={gold} position-y={h + 1.55}>
        <coneGeometry args={[0.1, 0.5, 8]} />
      </mesh>
    </group>
  )
  return (
    <group position={position} scale={scale}>
      {/* the main block, its cornice and crenellation */}
      <mesh material={stone} position={[0, 3, 0]}>
        <boxGeometry args={[26, 6, 6]} />
      </mesh>
      <mesh material={trim} position={[0, 6.13, 0]}>
        <boxGeometry args={[26.6, 0.26, 6.5]} />
      </mesh>
      <mesh material={trim} position={[0, 2.55, 0]}>
        <boxGeometry args={[26.3, 0.14, 6.3]} />
      </mesh>
      <instancedMesh ref={merlonRef} args={[geos.merlon, trim, layout.merlons.length]} />
      <instancedMesh ref={doorsRef} args={[geos.door, glow, layout.doors.length]} />
      <instancedMesh ref={windowsRef} args={[geos.window, glow, layout.windows.length]} />
      {/* the great arched portal (iwan): a deep shaded recess with a lit doorway */}
      <mesh geometry={geos.iwan} material={shade} position={[0, 0.02, 3.03]} />
      <mesh geometry={geos.iwanDoor} material={glow} position={[0, 0.02, 3.05]} />
      <mesh geometry={geos.iwanFrame} material={trim} position={[0, 0, 3.0]} />
      {/* drum, dome and finial */}
      <mesh material={stone} position={[0, 8, 0]}>
        <cylinderGeometry args={[4.2, 4.6, 4, 32]} />
      </mesh>
      <mesh material={trim} position={[0, 10, 0]}>
        <cylinderGeometry args={[4.6, 4.6, 0.24, 32]} />
      </mesh>
      <mesh geometry={geos.dome} material={stone} position={[0, 10, 0]} scale={[4.3, 4.6, 4.3]} />
      <mesh material={gold} position={[0, 16.7, 0]}>
        <sphereGeometry args={[0.32, 16, 12]} />
      </mesh>
      <mesh material={gold} position={[0, 17.5, 0]}>
        <coneGeometry args={[0.12, 1.3, 10]} />
      </mesh>
      {chhatri(-8, 1, 1.6, 4)}
      {chhatri(8, 1, 1.6, 4)}
      {chhatri(-12.5, 0, 1.1, 7)}
      {chhatri(12.5, 0, 1.1, 7)}
      {/* minarets with two galleries */}
      {[-15, 15].map((x) => (
        <group key={x} position={[x, 0, 1]}>
          <mesh material={stone} position-y={8}>
            <cylinderGeometry args={[0.7, 0.9, 16, 16]} />
          </mesh>
          {[6, 11].map((y) => (
            <mesh key={y} material={trim} position-y={y}>
              <cylinderGeometry args={[1.2, 0.95, 0.35, 16]} />
            </mesh>
          ))}
          <mesh geometry={geos.dome} material={stone} position-y={16} scale={0.9} />
          <mesh material={gold} position-y={17.5}>
            <coneGeometry args={[0.08, 0.5, 8]} />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={bulbRef} args={[geos.bulb, bulbs, layout.bulbs.length]} />
    </group>
  )
}

// ------------------------------------------------------------------ the reflecting pool
/**
 * A long Mughal water channel from the mandap to the palace, with sandstone coping
 * and brass lamps along both banks. On capable renders the water mirrors the lit
 * palace; elsewhere it reflects the sunset sky.
 */
function ReflectingPool({ from = -41, to = -96, width = 5 }: { from?: number; to?: number; width?: number }) {
  const { quality } = useWorldAssets()
  const len = from - to
  const z = (from + to) / 2
  const coping = useMemo(() => new THREE.MeshStandardMaterial({ color: '#b48a68', roughness: 0.78 }), [])
  const floaters = useMemo(() => {
    const rand = mulberry32(17)
    const out: Array<[number, number, number]> = []
    for (let k = from - 1.5; k > to + 1; k -= 1.6) {
      out.push([(rand() - 0.5) * (width - 1.2), k, 0])
      out.push([(rand() - 0.5) * (width - 1.0), k - 0.8, rand() < 0.5 ? 2 : 1])
    }
    return out
  }, [from, to, width])
  const lamps = useMemo(() => {
    const out: Array<[number, number, number]> = []
    for (let k = from - 2; k > to + 1; k -= 4.5) out.push([-(width / 2 + 0.55), 0, k], [width / 2 + 0.55, 0, k])
    return out
  }, [from, to, width])
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, z]}>
        <planeGeometry args={[width, len]} />
        {quality.reflections ? (
          <MeshReflectorMaterial
            resolution={quality.reflectorResolution}
            blur={[60, 20]}
            mixBlur={0.3}
            mixStrength={0.75}
            mirror={0.55}
            color="#0d1a1e"
            metalness={0}
            roughness={0.32}
            envMapIntensity={0.25}
            depthScale={0}
          />
        ) : (
          <meshStandardMaterial color="#26383a" roughness={0.04} metalness={0.35} envMapIntensity={1.4} />
        )}
      </mesh>
      {[
        [0, from + 0.15, width + 0.6, 0.3],
        [0, to - 0.15, width + 0.6, 0.3],
        [-(width / 2 + 0.15), z, 0.3, len],
        [width / 2 + 0.15, z, 0.3, len],
      ].map(([x, zz, w, d]) => (
        <mesh key={`${x}:${zz}`} material={coping} position={[x, 0.06, zz]} receiveShadow>
          <boxGeometry args={[w, 0.14, d]} />
        </mesh>
      ))}
      <LampRow positions={lamps} height={0.95} />
      {/* floating diyas and lotus on the water */}
      {floaters.map(([x, zz, kind], i) =>
        kind === 0 ? (
          <Diya key={i} position={[x, 0.035, zz]} scale={1.6} />
        ) : (
          <group key={i} position={[x, 0.04, zz]}>
            <LotusLeaf radius={0.22} seed={300 + i} rotation={i} />
            {kind === 2 && <Lotus position={[0.03, 0.01, 0.02]} size={0.12} seed={310 + i} />}
          </group>
        ),
      )}
    </group>
  )
}

// ------------------------------------------------------------------ the far tree line
/** A broad tree crown with a trunk, as an alpha silhouette (generated once). */
function treeSilhouette(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const g = c.getContext('2d')!
  const rand = mulberry32(5)
  g.fillStyle = '#fff'
  g.fillRect(122, 150, 12, 106)
  g.fillRect(104, 176, 8, 40)
  g.fillRect(144, 168, 8, 44)
  for (let i = 0; i < 70; i++) {
    const a = rand() * Math.PI * 2
    const d = Math.sqrt(rand())
    const x = 128 + Math.cos(a) * d * 96
    const y = 104 + Math.sin(a) * d * 70
    g.beginPath()
    g.arc(x, y, 9 + rand() * 20, 0, Math.PI * 2)
    g.fill()
  }
  // a ragged edge of leaf clumps
  for (let i = 0; i < 120; i++) {
    const a = rand() * Math.PI * 2
    g.beginPath()
    g.arc(128 + Math.cos(a) * (88 + rand() * 18), 104 + Math.sin(a) * (62 + rand() * 14), 2 + rand() * 6, 0, Math.PI * 2)
    g.fill()
  }
  const t = new THREE.CanvasTexture(c)
  return t
}

function TreeLine() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const mat = useMemo(
    () => hazed(new THREE.MeshBasicMaterial({ color: '#232619', alphaMap: treeSilhouette(), alphaTest: 0.5, side: THREE.DoubleSide }), 0.85),
    [],
  )
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), [])
  const N = 64
  useLayoutEffect(() => {
    const rand = mulberry32(31)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    for (let i = 0; i < N; i++) {
      const side = i % 2 ? 1 : -1
      const x = side * (23 + rand() * 55)
      const z = -74 - rand() * 34
      const h = 7 + rand() * 7
      const w = h * (0.9 + rand() * 0.5) * (rand() < 0.5 ? -1 : 1)
      m.compose(new THREE.Vector3(x, -0.4, z), q, new THREE.Vector3(w, h, 1))
      ref.current?.setMatrixAt(i, m)
    }
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true
  }, [])
  return <instancedMesh ref={ref} args={[geo, mat, N]} />
}

// ------------------------------------------------------------------ the aisle runner
function Runner({ from, to, width }: { from: number; to: number; width: number }) {
  const { velvet } = useWorldAssets()
  const len = from - to
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, len)
    const uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * width * 1.5, uv.getY(i) * len * 1.5)
    return g
  }, [width, len])
  const cloth = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#7a1424',
        roughness: 0.82,
        sheen: 1,
        sheenRoughness: 0.45,
        sheenColor: new THREE.Color('#e0627a'),
        normalMap: velvet.normalMap,
        normalScale: new THREE.Vector2(0.5, 0.5),
      }),
    [velvet.normalMap],
  )
  const gold = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c8963c', metalness: 1, roughness: 0.38 }), [])
  const z = (from + to) / 2
  return (
    <group>
      <mesh geometry={geo} material={cloth} rotation-x={-Math.PI / 2} position={[0, 0.006, z]} receiveShadow />
      {[-1, 1].map((side) => (
        <mesh key={side} material={gold} position={[side * (width / 2 - 0.05), 0.008, z]}>
          <boxGeometry args={[0.035, 0.004, len]} />
        </mesh>
      ))}
    </group>
  )
}

export function Garden() {
  const frondMat = useMemo(() => {
    const t = frondTexture()
    return new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.45, color: '#c8d0a8', roughness: 0.75, side: THREE.DoubleSide })
  }, [])
  const { grass, quality } = useWorldAssets()
  const lawn = useMemo(() => new THREE.MeshStandardMaterial({ map: grass.map, roughness: 0.95 }), [grass.map])
  const lawnGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(160, 120)
    const uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 40, uv.getY(i) * 30)
    return g
  }, [])
  const lampZs = [-3, -6.4, -9.8, -13.2, -16.6, -20, -23.4, -26.8]
  return (
    <group>
      {/* lawn and the marble walkway to the mandap */}
      <mesh geometry={lawnGeo} rotation-x={-Math.PI / 2} position={[0, -0.01, -62.25]} material={lawn} receiveShadow />
      <MarbleFloor size={[3.2, 28]} position={[0, 0.001, -16.2]} repeat={1.4} reflect={false} tint="#7f6e5c" roughness={0.6} envMapIntensity={0.4} />
      <Runner from={-2.3} to={-30} width={1.3} />
      <Petals count={0} bounds={[[-0.6, 0, -29], [0.6, 0, -2.6]]} resting={160} floorY={0.012} seed={9} />
      <LampRow positions={lampZs.flatMap((z) => [[-2.2, 0, z], [2.2, 0, z]] as Array<[number, number, number]>)} height={1.05} />
      {(quality.tier === 'high' || quality.tier === 'ultra') && <FlameLight position={[0, 1.2, -4]} intensity={2.4} distance={6} />}
      <Shrubs count={24} area={[[-7, -28], [-2.9, -1.5]]} seed={71} />
      <Shrubs count={24} area={[[2.9, -28], [7, -1.5]]} seed={72} />
      {/* low marigold borders along the walkway */}
      <Shrubs count={30} area={[[-1.95, -29], [-1.75, -2.6]]} seed={73} size={0.42} bloom="#f29a1c" />
      <Shrubs count={30} area={[[1.75, -29], [1.95, -2.6]]} seed={74} size={0.42} bloom="#f29a1c" />
      {/* a lotus pool either side of the walkway */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 4.8, 0.02, -12]}>
          <mesh rotation-x={-Math.PI / 2}>
            <planeGeometry args={[2.6, 6]} />
            <meshStandardMaterial color="#0f1f1a" roughness={0.05} envMapIntensity={0.8} />
          </mesh>
          {/* sandstone coping */}
          {[[0, -3.08, 2.86, 0.16], [0, 3.08, 2.86, 0.16], [-1.38, 0, 0.16, 6.32], [1.38, 0, 0.16, 6.32]].map(([x, z, w, d]) => (
            <mesh key={`${x}${z}`} position={[x, 0.03, z]} receiveShadow>
              <boxGeometry args={[w, 0.1, d]} />
              <meshStandardMaterial color="#b49072" roughness={0.75} />
            </mesh>
          ))}
          {[0, 1, 2, 3, 4].map((k) => (
            <group key={k} position={[((k * 37) % 9) * 0.22 - 0.9, 0.01, k * 1.1 - 2.2]}>
              <LotusLeaf radius={0.2} seed={80 + k + side} rotation={k} />
              {k % 2 === 0 && <Lotus position={[0.05, 0.01, 0.02]} size={0.11} seed={90 + k} />}
            </group>
          ))}
        </group>
      ))}
      <Archway position={[0, 0, -17]} />
      <Mandap position={[0, 0, -34]} />
      <ReflectingPool />
      {/* palms */}
      <Palm position={[-7.5, 0, -22]} height={8} lean={-0.6} seed={1} frondMat={frondMat} />
      <Palm position={[7.8, 0, -25]} height={8.6} lean={0.7} seed={2} frondMat={frondMat} />
      <Palm position={[-11, 0, -36]} height={9.5} lean={-0.4} seed={3} frondMat={frondMat} />
      <Palm position={[11.5, 0, -39]} height={10} lean={0.5} seed={4} frondMat={frondMat} />
      <Palm position={[-17, 0, -50]} height={11} lean={0.3} seed={5} frondMat={frondMat} />
      <Palm position={[18, 0, -54]} height={11.5} lean={-0.3} seed={6} frondMat={frondMat} />
      <Palace position={[0, 0, -105]} scale={1.5} />
      <TreeLine />
    </group>
  )
}
