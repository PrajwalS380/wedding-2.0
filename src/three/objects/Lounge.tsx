import { useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { useWorldAssets } from '../assets'
import { mulberry32 } from '../textures/noise'
import { Diya, LampStand, Urli, useBrass } from './BrassLamps'
import { RoseBouquet } from './Florals'
import { Garland, swag } from './Garland'
import { Lotus } from './Lotus'
import { Petals } from './Petals'

/**
 * The guests' lounge in the garden (Reference B, Guest Services): a majlis under a draped
 * canopy. A hand-knotted carpet (field of flowers, medallion, corner spandrels, a vine
 * border and guard stripes), three diwans of carved, gilt-trimmed wood with velvet
 * mattresses, silk cushions embroidered at the edges and tasselled bolsters, a brass tea
 * table with kettle, cups, a bowl of roses and a flower-floating urli, lanterns hanging from
 * the canopy, a scalloped valance with tassels and swags of jasmine, brass lamps at the front.
 * Faces +z; origin at the centre of the carpet.
 */
type V3 = [number, number, number]
const lathe = (pts: Array<[number, number]>, seg = 40) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg)

// ------------------------------------------------------------------ textures
function carpetTexture(): THREE.CanvasTexture {
  const W = 1024
  const H = 800
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  const rand = mulberry32(8)
  // outer border: deep green with a gold vine and flowers
  g.fillStyle = '#163a2c'
  g.fillRect(0, 0, W, H)
  const B = 70
  g.strokeStyle = '#d6a64a'
  g.lineWidth = 4
  const vine = (x0: number, y0: number, x1: number, y1: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0)
    const n = Math.floor(len / 46)
    g.beginPath()
    for (let i = 0; i <= n * 8; i++) {
      const t = i / (n * 8)
      const x = x0 + (x1 - x0) * t
      const y = y0 + (y1 - y0) * t
      const o = Math.sin(t * n * Math.PI * 2) * 10
      const nx = -(y1 - y0) / len
      const ny = (x1 - x0) / len
      if (i === 0) g.moveTo(x + nx * o, y + ny * o)
      else g.lineTo(x + nx * o, y + ny * o)
    }
    g.stroke()
    for (let i = 0; i < n; i++) {
      const t = (i + 0.25) / n
      const x = x0 + (x1 - x0) * t
      const y = y0 + (y1 - y0) * t
      flower(x, y, 9, i % 2 ? '#f3e6cc' : '#c4243f')
    }
  }
  const flower = (x: number, y: number, r: number, col: string) => {
    g.fillStyle = col
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2
      g.beginPath()
      g.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.45, r * 0.25, a, 0, Math.PI * 2)
      g.fill()
    }
    g.fillStyle = '#e8b84e'
    g.beginPath()
    g.arc(x, y, r * 0.25, 0, Math.PI * 2)
    g.fill()
  }
  vine(B / 2, B / 2, W - B / 2, B / 2)
  vine(W - B / 2, B / 2, W - B / 2, H - B / 2)
  vine(W - B / 2, H - B / 2, B / 2, H - B / 2)
  vine(B / 2, H - B / 2, B / 2, B / 2)
  // guard stripes
  const stripe = (inset: number, w: number, col: string) => {
    g.strokeStyle = col
    g.lineWidth = w
    g.strokeRect(inset, inset, W - inset * 2, H - inset * 2)
  }
  stripe(5, 6, '#c99a3e')
  stripe(B + 3, 6, '#c99a3e')
  stripe(B + 12, 10, '#f1e2c4')
  g.fillStyle = '#b3122c'
  for (let x = B + 14; x < W - B - 14; x += 16) {
    g.fillRect(x, B + 10, 4, 4)
    g.fillRect(x, H - B - 14, 4, 4)
  }
  for (let y = B + 14; y < H - B - 14; y += 16) {
    g.fillRect(B + 10, y, 4, 4)
    g.fillRect(W - B - 14, y, 4, 4)
  }
  // the field: madder red with a lattice of small flowers
  const F = B + 20
  g.fillStyle = '#7a1622'
  g.fillRect(F, F, W - F * 2, H - F * 2)
  g.strokeStyle = 'rgba(214,166,74,0.35)'
  g.lineWidth = 1.5
  for (let k = -H; k < W; k += 44) {
    g.beginPath()
    g.moveTo(F + k, F)
    g.lineTo(F + k + (H - F * 2), H - F)
    g.moveTo(F + k + (H - F * 2), F)
    g.lineTo(F + k, H - F)
    g.stroke()
  }
  for (let y = F + 22; y < H - F; y += 44)
    for (let x = F + 22 + ((y - F - 22) / 44) % 2 * 22; x < W - F; x += 44) flower(x, y, 6 + rand() * 1.5, rand() < 0.5 ? '#f3e6cc' : '#e8b84e')
  // corner spandrels: quarter medallions
  for (const [cx, cy] of [[F, F], [W - F, F], [F, H - F], [W - F, H - F]] as const) {
    g.save()
    g.beginPath()
    g.rect(F, F, W - F * 2, H - F * 2)
    g.clip()
    g.fillStyle = '#f1e2c4'
    g.beginPath()
    g.ellipse(cx, cy, 120, 96, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#1e4a38'
    g.beginPath()
    g.ellipse(cx, cy, 98, 76, 0, 0, Math.PI * 2)
    g.fill()
    g.restore()
  }
  // central medallion: a lobed gold star, ivory ring, green ground, rose heart
  const mx = W / 2
  const my = H / 2
  const lobed = (r: number, lobes: number, depth: number, col: string) => {
    g.fillStyle = col
    g.beginPath()
    for (let i = 0; i <= 200; i++) {
      const a = (i / 200) * Math.PI * 2
      const rr = r * (1 - depth + depth * Math.abs(Math.cos(a * lobes / 2)))
      const x = mx + Math.cos(a) * rr * 1.25
      const y = my + Math.sin(a) * rr
      if (i === 0) g.moveTo(x, y)
      else g.lineTo(x, y)
    }
    g.fill()
  }
  lobed(190, 16, 0.18, '#d6a64a')
  lobed(170, 16, 0.18, '#f1e2c4')
  lobed(140, 8, 0.12, '#1e4a38')
  lobed(96, 8, 0.2, '#7a1622')
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    flower(mx + Math.cos(a) * 118 * 1.25, my + Math.sin(a) * 118, 12, '#f3e6cc')
  }
  flower(mx, my, 34, '#e8b84e')
  flower(mx, my, 18, '#c4243f')
  // pile: a fine speckle so it reads as knotted wool
  const img = g.getImageData(0, 0, W, H)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (rand() - 0.5) * 22
    img.data[i] += v
    img.data[i + 1] += v
    img.data[i + 2] += v
  }
  g.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** Silk for a cushion: a ground colour, an embroidered gold border with dots and a rosette in the middle. */
function cushionTexture(ground: string, accent: string): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = ground
  g.fillRect(0, 0, 256, 256)
  // faint woven stripes
  g.fillStyle = 'rgba(255,240,210,0.08)'
  for (let y = 0; y < 256; y += 6) g.fillRect(0, y, 256, 2)
  g.strokeStyle = '#d9ae58'
  g.lineWidth = 14
  g.strokeRect(14, 14, 228, 228)
  g.strokeStyle = '#f6dc94'
  g.lineWidth = 2
  g.strokeRect(24, 24, 208, 208)
  g.fillStyle = accent
  for (let i = 30; i < 230; i += 12) {
    g.beginPath()
    g.arc(i, 14, 2.5, 0, Math.PI * 2)
    g.arc(i, 242, 2.5, 0, Math.PI * 2)
    g.fill()
    g.beginPath()
    g.arc(14, i, 2.5, 0, Math.PI * 2)
    g.arc(242, i, 2.5, 0, Math.PI * 2)
    g.fill()
  }
  // rosette
  g.fillStyle = '#e2b860'
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    g.beginPath()
    g.ellipse(128 + Math.cos(a) * 26, 128 + Math.sin(a) * 26, 20, 9, a, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = accent
  g.beginPath()
  g.arc(128, 128, 16, 0, Math.PI * 2)
  g.fill()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Ivory voile for the canopy: woven buti and a gold border; and a scalloped valance with an alpha edge. */
function canopyTexture(valance: boolean): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = valance ? 128 : 512
  const g = c.getContext('2d')!
  g.fillStyle = '#fbf1e0'
  g.fillRect(0, 0, c.width, c.height)
  g.fillStyle = 'rgba(208,160,70,0.55)'
  for (let y = 10; y < c.height; y += 22)
    for (let x = (y / 22) % 2 ? 8 : 19; x < 512; x += 22) {
      g.beginPath()
      g.arc(x, y, 2, 0, Math.PI * 2)
      g.fill()
    }
  const grad = (y: number, h: number) => {
    const gr = g.createLinearGradient(0, y, 0, y + h)
    gr.addColorStop(0, '#b98a2e')
    gr.addColorStop(0.5, '#f4d68a')
    gr.addColorStop(1, '#a27424')
    g.fillStyle = gr
    g.fillRect(0, y, 512, h)
  }
  if (valance) {
    grad(0, 16)
    grad(78, 10)
    // scallops: cut away below a row of arcs
    g.globalCompositeOperation = 'destination-out'
    for (let x = 0; x < 512; x += 64) {
      g.beginPath()
      g.moveTo(x, 128)
      g.lineTo(x, 96)
      g.quadraticCurveTo(x + 32, 136, x + 64, 96)
      g.lineTo(x + 64, 128)
      g.fill()
    }
    g.globalCompositeOperation = 'source-over'
  } else {
    grad(0, 26)
    grad(486, 26)
    g.fillRect(0, 0, 26, 512)
    g.fillRect(486, 0, 26, 512)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// ------------------------------------------------------------------ geometry
/** A plump cushion: square in plan with rounded corners, lens-shaped through its thickness (seamed at the edge). */
function pillowGeometry(w: number, h: number, t: number): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 40, 28)
  const p = g.attributes.position
  const sq = (v: number, e: number) => Math.sign(v) * Math.abs(v) ** e
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const z = p.getZ(i)
    const lat = Math.asin(Math.max(-1, Math.min(1, z)))
    const lon = Math.atan2(y, x)
    const r = Math.cos(lat)
    p.setXYZ(i, (w / 2) * r * sq(Math.cos(lon), 0.35), (h / 2) * r * sq(Math.sin(lon), 0.35), (t / 2) * sq(Math.sin(lat), 0.8))
  }
  g.computeVertexNormals()
  return g
}

// ------------------------------------------------------------------ the pieces
function Diwan({ position, rotation = 0, width, velvet, cushions, back = true }: { position: V3; rotation?: number; width: number; velvet: THREE.Material; cushions: THREE.Material[]; back?: boolean }) {
  const gold = useBrass(0.32)
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a2716', roughness: 0.55, metalness: 0.05 }), [])
  const geos = useMemo(
    () => ({
      base: new RoundedBoxGeometry(width, 0.3, 0.9, 3, 0.04),
      mattress: new RoundedBoxGeometry(width - 0.04, 0.15, 0.86, 4, 0.06),
      back: new RoundedBoxGeometry(width, 0.62, 0.12, 3, 0.04),
      leg: lathe([[0.001, 0], [0.04, 0], [0.05, 0.03], [0.035, 0.06], [0.045, 0.09], [0.001, 0.1]], 16),
      pillow: pillowGeometry(0.58, 0.5, 0.2),
      small: pillowGeometry(0.36, 0.36, 0.14),
      bolster: new THREE.CylinderGeometry(0.1, 0.1, 0.74, 32, 1),
      cap: new THREE.CylinderGeometry(0.105, 0.105, 0.03, 32),
      tassel: new THREE.ConeGeometry(0.025, 0.09, 10),
      rosette: new THREE.SphereGeometry(0.022, 12, 8),
    }),
    [width],
  )
  const n = Math.max(2, Math.round(width / 0.62))
  const rand = useMemo(() => mulberry32(Math.round(width * 100)), [width])
  const smalls = useMemo(() => [0, 1].map(() => ({ x: (rand() - 0.5) * width * 0.5, r: (rand() - 0.5) * 0.5, m: Math.floor(rand() * cushions.length) })), [rand, width, cushions.length])
  return (
    <group position={position} rotation-y={rotation}>
      {/* carved base on turned legs, gilt along its front */}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <mesh key={`${sx}${sz}`} geometry={geos.leg} material={gold} position={[sx * (width / 2 - 0.07), 0, sz * 0.38]} />))}
      <mesh geometry={geos.base} material={wood} position={[0, 0.25, 0]} castShadow receiveShadow />
      <mesh material={gold} position={[0, 0.37, 0.451]}>
        <boxGeometry args={[width - 0.04, 0.03, 0.01]} />
      </mesh>
      <mesh material={gold} position={[0, 0.14, 0.451]}>
        <boxGeometry args={[width - 0.04, 0.02, 0.01]} />
      </mesh>
      {Array.from({ length: Math.floor(width / 0.22) }, (_, i) => (
        <mesh key={i} geometry={geos.rosette} material={gold} position={[-width / 2 + 0.13 + i * 0.22, 0.255, 0.452]} />
      ))}
      <mesh geometry={geos.mattress} material={velvet} position={[0, 0.47, 0]} castShadow receiveShadow />
      {back && (
        <>
          <mesh geometry={geos.back} material={wood} position={[0, 0.66, -0.43]} castShadow />
          <mesh material={gold} position={[0, 0.975, -0.43]}>
            <boxGeometry args={[width + 0.02, 0.035, 0.15]} />
          </mesh>
          {Array.from({ length: n }, (_, i) => (
            <mesh
              key={i}
              geometry={geos.pillow}
              material={cushions[i % cushions.length]}
              position={[-width / 2 + (width / n) * (i + 0.5), 0.78, -0.27]}
              rotation={[-0.22, 0, (i - (n - 1) / 2) * 0.03]}
              castShadow
            />
          ))}
        </>
      )}
      {/* bolsters at either end, with gilt caps and tassels */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (width / 2 - 0.12), 0.65, 0.02]} rotation-x={Math.PI / 2}>
          <mesh geometry={geos.bolster} material={velvet} castShadow />
          {[-1, 1].map((e) => (
            <group key={e} position={[0, e * 0.38, 0]}>
              <mesh geometry={geos.cap} material={gold} />
              <mesh geometry={geos.tassel} material={gold} position={[0, e * 0.05, -0.1]} rotation-x={e > 0 ? 0 : Math.PI} />
            </group>
          ))}
        </group>
      ))}
      {/* a pair of small cushions tossed on the seat */}
      {smalls.map((c, i) => (
        <mesh key={i} geometry={geos.small} material={cushions[c.m]} position={[c.x, 0.66, -0.08]} rotation={[-0.5, c.r, c.r * 0.6]} castShadow />
      ))}
    </group>
  )
}

function TeaTable({ position }: { position: V3 }) {
  const brass = useBrass(0.25)
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a2716', roughness: 0.5 }), [])
  const geos = useMemo(
    () => ({
      base: lathe([[0.001, 0], [0.2, 0], [0.22, 0.03], [0.12, 0.06], [0.08, 0.12], [0.1, 0.2], [0.07, 0.26], [0.16, 0.3], [0.001, 0.31]], 32),
      tray: lathe([[0.001, 0], [0.5, 0], [0.52, 0.02], [0.53, 0.05], [0.51, 0.055], [0.49, 0.025], [0.001, 0.02]], 64),
      kettle: lathe([[0.001, 0], [0.06, 0], [0.085, 0.04], [0.09, 0.08], [0.07, 0.13], [0.035, 0.16], [0.04, 0.18], [0.02, 0.2], [0.012, 0.23], [0.001, 0.235]], 32),
      cup: lathe([[0.001, 0], [0.022, 0], [0.026, 0.008], [0.034, 0.05], [0.031, 0.052], [0.022, 0.012], [0.001, 0.01]], 24),
      spout: new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.07, 0.06, 0), new THREE.Vector3(0.12, 0.1, 0), new THREE.Vector3(0.15, 0.16, 0)]), 12, 0.01, 8),
    }),
    [],
  )
  return (
    <group position={position}>
      <mesh geometry={geos.base} material={wood} castShadow />
      <mesh geometry={geos.tray} material={brass} position-y={0.31} castShadow receiveShadow />
      <group position={[-0.16, 0.33, -0.08]}>
        <mesh geometry={geos.kettle} material={brass} castShadow />
        <mesh geometry={geos.spout} material={brass} />
      </group>
      {[[0.14, -0.2], [0.24, -0.02], [-0.32, 0.14], [0.02, 0.26]].map(([x, z], i) => (
        <mesh key={i} geometry={geos.cup} material={brass} position={[x, 0.33, z]} castShadow />
      ))}
      <Urli position={[0.16, 0.33, 0.16]} radius={0.12}>
        <Lotus position={[0, 0.11, 0]} size={0.05} seed={71} />
      </Urli>
      <RoseBouquet position={[-0.12, 0.42, 0.2]} radius={0.08} count={12} seed={14} />
      <Diya position={[0.32, 0.33, -0.16]} scale={0.9} />
      <Diya position={[-0.34, 0.33, -0.1]} scale={0.9} />
    </group>
  )
}

/** A brass lantern with amber glass, hung on a chain; it lights the lounge from above. */
function Lantern({ position, drop }: { position: V3; drop: number }) {
  const brass = useBrass(0.3)
  const geos = useMemo(
    () => ({
      glass: lathe([[0.001, 0.02], [0.05, 0.03], [0.09, 0.08], [0.105, 0.15], [0.09, 0.23], [0.05, 0.28], [0.001, 0.29]], 24),
      cap: lathe([[0.001, 0.27], [0.07, 0.27], [0.06, 0.3], [0.03, 0.34], [0.015, 0.4], [0.001, 0.42]], 24),
      base: lathe([[0.001, 0], [0.05, 0], [0.07, 0.03], [0.04, 0.04], [0.001, 0.035]], 24),
      rib: new THREE.CylinderGeometry(0.006, 0.006, 0.24, 6),
    }),
    [],
  )
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffcf8a', emissive: new THREE.Color('#ff9a3a'), emissiveIntensity: 2.6, roughness: 0.4 }), [])
  return (
    <group position={position}>
      <mesh material={brass} position-y={-drop / 2}>
        <cylinderGeometry args={[0.005, 0.005, drop, 6]} />
      </mesh>
      <group position-y={-drop - 0.42}>
        <mesh geometry={geos.glass} material={glass} />
        <mesh geometry={geos.cap} material={brass} />
        <mesh geometry={geos.base} material={brass} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2
          return <mesh key={i} geometry={geos.rib} material={brass} position={[Math.cos(a) * 0.1, 0.15, Math.sin(a) * 0.1]} />
        })}
        <pointLight position={[0, 0.15, 0]} color="#ffb060" intensity={1.6} distance={3.2} decay={2} />
      </group>
    </group>
  )
}

function Canopy({ width, depth, height }: { width: number; depth: number; height: number }) {
  const gold = useBrass(0.3)
  const mats = useMemo(() => {
    const roof = new THREE.MeshStandardMaterial({ map: canopyTexture(false), side: THREE.DoubleSide, roughness: 0.9, emissive: new THREE.Color('#3a2210'), emissiveIntensity: 0.25 })
    const val = new THREE.MeshStandardMaterial({ map: canopyTexture(true), side: THREE.DoubleSide, roughness: 0.9, alphaTest: 0.5 })
    return { roof, val }
  }, [])
  const roof = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, depth, 24, 24)
    g.rotateX(-Math.PI / 2)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const u = (p.getX(i) / width) * 2
      const v = (p.getZ(i) / depth) * 2
      // sags between the poles, gathered up at the centre
      const sag = 0.28 * (1 - u * u) * (1 - v * v) - 0.22 * Math.exp(-(u * u + v * v) * 9)
      p.setY(i, -sag)
    }
    g.computeVertexNormals()
    return g
  }, [width, depth])
  const corners: Array<[number, number]> = [[-width / 2, -depth / 2], [width / 2, -depth / 2], [-width / 2, depth / 2], [width / 2, depth / 2]]
  const front = depth / 2
  const swags = useMemo(() => {
    const out: Array<Array<[number, number, number]>> = []
    const n = 4
    for (let i = 0; i < n; i++) {
      const x0 = -width / 2 + (width / n) * i
      out.push(swag([x0, height - 0.04, front + 0.02], [x0 + width / n, height - 0.04, front + 0.02], 0.22, 10))
    }
    return out
  }, [width, height, front])
  return (
    <group>
      {corners.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh material={gold} position-y={height / 2} castShadow>
            <cylinderGeometry args={[0.03, 0.035, height, 12]} />
          </mesh>
          <mesh material={gold} position-y={height + 0.08}>
            <sphereGeometry args={[0.055, 16, 12]} />
          </mesh>
          <mesh material={gold} position-y={0.03}>
            <cylinderGeometry args={[0.08, 0.1, 0.06, 16]} />
          </mesh>
        </group>
      ))}
      <mesh geometry={roof} material={mats.roof} position-y={height} receiveShadow castShadow />
      {/* scalloped valance on all four sides */}
      {[
        [0, front, 0, width],
        [0, -front, Math.PI, width],
        [width / 2, 0, Math.PI / 2, depth],
        [-width / 2, 0, -Math.PI / 2, depth],
      ].map(([x, z, ry, len]) => (
        <mesh key={`${x}${z}`} material={mats.val} position={[x, height - 0.16, z]} rotation-y={ry}>
          <planeGeometry args={[len, 0.34]} />
        </mesh>
      ))}
      {/* tassels at the scallop points along the front */}
      {Array.from({ length: Math.round(width / 0.31) + 1 }, (_, i) => (
        <mesh key={i} material={gold} position={[-width / 2 + i * (width / Math.round(width / 0.31)), height - 0.37, front + 0.01]} rotation-x={Math.PI}>
          <coneGeometry args={[0.018, 0.08, 8]} />
        </mesh>
      ))}
      <Garland points={swags} radius={0.03} density={300} seed={61} />
    </group>
  )
}

export function Lounge({ position = [0, 0, 0] as V3, rotation = 0 }: { position?: V3; rotation?: number }) {
  const { velvet } = useWorldAssets()
  const mats = useMemo(() => {
    const vel = (color: string, sheen: string) =>
      new THREE.MeshPhysicalMaterial({ color, roughness: 0.82, sheen: 1, sheenRoughness: 0.42, sheenColor: new THREE.Color(sheen), normalMap: velvet.normalMap, normalScale: new THREE.Vector2(0.35, 0.35) })
    const silk = (ground: string, accent: string) =>
      new THREE.MeshPhysicalMaterial({ map: cushionTexture(ground, accent), roughness: 0.42, sheen: 0.8, sheenRoughness: 0.3, sheenColor: new THREE.Color('#fff0d0') })
    return {
      maroon: vel('#6e1220', '#e0627a'),
      emerald: vel('#0f4a36', '#5fbf94'),
      cushions: [silk('#c99a3e', '#8a1426'), silk('#a3182c', '#e8b84e'), silk('#f1e2c4', '#1e4a38'), silk('#1e5a44', '#e8b84e')],
      carpet: new THREE.MeshStandardMaterial({ map: carpetTexture(), roughness: 0.96, normalMap: velvet.normalMap, normalScale: new THREE.Vector2(0.25, 0.25) }),
    }
  }, [velvet.normalMap])
  const W = 4.8
  const D = 3.8
  const H = 2.7
  return (
    <group position={position} rotation-y={rotation}>
      <mesh material={mats.carpet} rotation-x={-Math.PI / 2} position-y={0.012} receiveShadow>
        <planeGeometry args={[4.4, 3.4]} />
      </mesh>
      <Diwan position={[0, 0.012, -1.25]} width={2.6} velvet={mats.maroon} cushions={mats.cushions} />
      <Diwan position={[-1.85, 0.012, 0.2]} rotation={Math.PI / 2} width={1.9} velvet={mats.emerald} cushions={[mats.cushions[0], mats.cushions[2]]} />
      <Diwan position={[1.85, 0.012, 0.2]} rotation={-Math.PI / 2} width={1.9} velvet={mats.emerald} cushions={[mats.cushions[1], mats.cushions[3]]} />
      <TeaTable position={[0, 0.012, 0.05]} />
      <Canopy width={W} depth={D} height={H} />
      <Lantern position={[0, H - 0.2, 0]} drop={0.5} />
      <Lantern position={[-1.3, H - 0.1, -0.6]} drop={0.65} />
      <Lantern position={[1.3, H - 0.1, -0.6]} drop={0.65} />
      <LampStand position={[-2.3, 0, 1.75]} height={1.15} />
      <LampStand position={[2.3, 0, 1.75]} height={1.15} />
      {/* urns of roses at the back corners */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 2.05, 0, -1.6]}>
          <mesh castShadow>
            <latheGeometry args={[[[0.001, 0], [0.16, 0], [0.2, 0.08], [0.24, 0.3], [0.18, 0.52], [0.21, 0.58], [0.001, 0.58]].map(([r, y]) => new THREE.Vector2(r, y)), 32]} />
            <meshStandardMaterial color="#b8823c" metalness={0.85} roughness={0.32} />
          </mesh>
          <RoseBouquet position={[0, 0.72, 0]} radius={0.24} count={34} seed={20 + s} />
        </group>
      ))}
      <Petals count={0} bounds={[[-1.6, 0, -0.6], [1.6, 0, 1.6]]} resting={70} floorY={0.02} seed={33} />
    </group>
  )
}
