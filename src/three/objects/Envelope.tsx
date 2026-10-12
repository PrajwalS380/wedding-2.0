import { useFrame, type ThreeElements } from '@react-three/fiber'
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useWorldAssets } from '../assets'
import { EMB_H, EMB_W, flapEdge } from '../bake/embroideryArt'
import { mulberry32 } from '../textures/noise'

/** Envelope size in metres (front face). */
export const ENV = { w: 0.64, h: 0.43, d: 0.05 }
const SEAL_R = 0.064

export interface EnvelopeHandle {
  flap: THREE.Group
  sealTop: THREE.Group
  card: THREE.Group
  glow: THREE.Mesh
  root: THREE.Group
  /** Give the tassel a swing (e.g. when the seal cracks). */
  nudge: (amount: number) => void
}

/** Design-pixel point → envelope-space (metres, origin bottom-centre, y up). */
const toEnv = ([px, py]: [number, number]): [number, number] => [(px / EMB_W - 0.5) * ENV.w, ENV.h - (py / EMB_H) * ENV.h]

function flapOutline(steps = 48): Array<[number, number]> {
  const pts: Array<[number, number]> = []
  for (let i = 0; i <= steps; i++) pts.push(toEnv(flapEdge(i / steps, -1)))
  for (let i = steps; i >= 0; i--) pts.push(toEnv(flapEdge(i / steps, 1)))
  return pts // from top-left, down to the apex, back up to top-right
}

function planarUV(geo: THREE.BufferGeometry, x0: number, y0: number, w: number, h: number) {
  const pos = geo.attributes.position
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - x0) / w
    uv[i * 2 + 1] = (pos.getY(i) - y0) / h
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return geo
}

/** The seal as two halves split by a jagged crack, extruded and bevelled like soft wax. */
export function sealHalves(): [THREE.BufferGeometry, THREE.BufferGeometry] {
  const rand = mulberry32(9)
  const jitter = Array.from({ length: 64 }, () => (rand() - 0.5) * 0.02)
  const r = (a: number) => {
    const k = Math.round((((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / ((Math.PI * 2) / 64)) % 64
    return SEAL_R * (1 + 0.06 * Math.sin(a * 7 + 1) + 0.03 * Math.sin(a * 13) + jitter[k])
  }
  const crack: Array<[number, number]> = []
  for (let i = 0; i <= 14; i++) {
    const x = -r(Math.PI) * 0.995 + (i / 14) * (r(Math.PI) + r(0)) * 0.995
    crack.push([x, i === 0 || i === 14 ? 0 : SEAL_R * 0.035 * Math.sin(i * 2.3) + (rand() - 0.5) * SEAL_R * 0.07])
  }
  const half = (top: boolean) => {
    const shape = new THREE.Shape()
    shape.moveTo(crack[0][0], crack[0][1])
    for (const [x, y] of crack) shape.lineTo(x, y)
    const steps = 40
    for (let i = 1; i < steps; i++) {
      const a = (top ? 1 : -1) * (i / steps) * Math.PI
      shape.lineTo(Math.cos(a) * r(a), Math.sin(a) * r(a))
    }
    shape.closePath()
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.007, bevelSize: 0.006, bevelSegments: 5, curveSegments: 4 })
    return planarUV(geo, -SEAL_R, -SEAL_R, SEAL_R * 2, SEAL_R * 2)
  }
  return [half(true), half(false)]
}

/** An ivory invitation card with a gold border and the monogram (canvas texture). */
function cardTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 768
  c.height = 512
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(384, 180, 40, 384, 256, 520)
  grad.addColorStop(0, '#fffaf0')
  grad.addColorStop(1, '#efe0bf')
  g.fillStyle = grad
  g.fillRect(0, 0, 768, 512)
  g.strokeStyle = '#b98a2e'
  g.lineWidth = 6
  g.strokeRect(22, 22, 724, 468)
  g.lineWidth = 2
  g.strokeRect(36, 36, 696, 440)
  g.fillStyle = '#134d3a'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = '500 120px "Cormorant Garamond", Georgia, serif'
  g.fillText('D', 300, 170)
  g.fillText('V', 470, 170)
  g.fillStyle = '#b98a2e'
  g.font = 'italic 500 80px "Cormorant Garamond", Georgia, serif'
  g.fillText('&', 384, 190)
  g.fillStyle = '#7d1e2c'
  g.font = '400 64px "Pinyon Script", cursive'
  g.fillText('Darshan & Vathsala', 384, 320)
  g.fillStyle = '#5a4630'
  g.font = '500 30px "Cormorant Garamond", Georgia, serif'
  g.fillText('15 & 16 November 2026 · Davangere', 384, 400)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

export const Envelope = forwardRef<EnvelopeHandle, ThreeElements['group']>(function Envelope(props, ref) {
  const { embroidery, velvet, seal } = useWorldAssets()
  const root = useRef<THREE.Group>(null!)
  const flap = useRef<THREE.Group>(null!)
  const sealTop = useRef<THREE.Group>(null!)
  const card = useRef<THREE.Group>(null!)
  const glow = useRef<THREE.Mesh>(null!)
  const tassel = useRef<THREE.Group>(null!)
  const swing = useRef({ angle: 0, vel: 0 })

  useImperativeHandle(ref, () => ({
    flap: flap.current,
    sealTop: sealTop.current,
    card: card.current,
    glow: glow.current,
    root: root.current,
    nudge: (a: number) => {
      swing.current.vel += a
    },
  }))

  const built = useMemo(() => {
    const { w, h, d } = ENV
    const outline = flapOutline()
    const apex = toEnv(flapEdge(1, -1))

    // body: a softly bevelled velvet block
    const bodyShape = new THREE.Shape()
    bodyShape.moveTo(-w / 2, 0)
    bodyShape.lineTo(w / 2, 0)
    bodyShape.lineTo(w / 2, h)
    bodyShape.lineTo(-w / 2, h)
    bodyShape.closePath()
    const body = new THREE.ExtrudeGeometry(bodyShape, { depth: d - 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 4 })
    body.translate(0, 0, -d / 2 + 0.006)
    planarUV(body, -w / 2, 0, w, h)

    // pocket front: the rectangle minus the flap's V, embroidered
    const pocketShape = new THREE.Shape()
    pocketShape.moveTo(-w / 2, 0)
    pocketShape.lineTo(w / 2, 0)
    pocketShape.lineTo(w / 2, h)
    for (let i = outline.length - 1; i >= Math.floor(outline.length / 2); i--) pocketShape.lineTo(outline[i][0], outline[i][1])
    for (let i = Math.floor(outline.length / 2) - 1; i >= 0; i--) pocketShape.lineTo(outline[i][0], outline[i][1])
    pocketShape.closePath()
    const pocket = planarUV(new THREE.ShapeGeometry(pocketShape, 24), -w / 2, 0, w, h)

    // the flap (front + lining), drawn relative to its hinge on the top edge
    const flapShape = new THREE.Shape()
    flapShape.moveTo(outline[0][0], outline[0][1] - h)
    for (const [x, y] of outline) flapShape.lineTo(x, y - h)
    flapShape.closePath()
    const flapFront = new THREE.ShapeGeometry(flapShape, 24)
    // UVs in envelope space so the embroidery lines up with the pocket
    {
      const pos = flapFront.attributes.position
      const uv = new Float32Array(pos.count * 2)
      for (let i = 0; i < pos.count; i++) {
        uv[i * 2] = (pos.getX(i) + w / 2) / w
        uv[i * 2 + 1] = (pos.getY(i) + h) / h
      }
      flapFront.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    }
    // the inside of the envelope (seen through the open V)
    const insideShape = new THREE.Shape()
    insideShape.moveTo(outline[0][0], outline[0][1])
    for (const [x, y] of outline) insideShape.lineTo(x, y)
    insideShape.closePath()
    const inside = planarUV(new THREE.ShapeGeometry(insideShape, 16), -w / 2, 0, w, h)

    // gold piping along the flap's edge (moves with the flap)
    const curve = new THREE.CatmullRomCurve3(outline.map(([x, y]) => new THREE.Vector3(x, y - h, 0.0035)))
    const piping = new THREE.TubeGeometry(curve, 160, 0.0032, 8, false)

    const [sealTopGeo, sealBottomGeo] = sealHalves()
    return { body, pocket, flapFront, inside, piping, apex, sealTopGeo, sealBottomGeo }
  }, [])

  const mats = useMemo(() => {
    const emb = new THREE.MeshPhysicalMaterial({
      map: embroidery.map,
      normalMap: embroidery.normalMap,
      aoMap: embroidery.ormMap,
      roughnessMap: embroidery.ormMap,
      metalnessMap: embroidery.ormMap,
      roughness: 1,
      metalness: 1,
      sheen: 1,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color('#2f7a5c'),
      envMapIntensity: 1,
    })
    const vel = (dark = 1) =>
      new THREE.MeshPhysicalMaterial({
        map: velvet.map,
        normalMap: velvet.normalMap,
        color: new THREE.Color(dark, dark, dark),
        roughness: 0.9,
        sheen: 1,
        sheenRoughness: 0.4,
        sheenColor: new THREE.Color('#2f7a5c').multiplyScalar(dark),
      })
    const sealMat = new THREE.MeshPhysicalMaterial({
      map: seal.map,
      normalMap: seal.normalMap,
      roughnessMap: seal.ormMap,
      metalnessMap: seal.ormMap,
      roughness: 1,
      metalness: 1,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25,
    })
    const gold = new THREE.MeshStandardMaterial({ color: '#d9aa50', metalness: 1, roughness: 0.32 })
    const card = new THREE.MeshStandardMaterial({ map: cardTexture(), roughness: 0.7 })
    // the light from inside: a soft radial bloom (no hard edges), seen through the open V and above the mouth
    const glowTex = (() => {
      const c = document.createElement('canvas')
      c.width = c.height = 128
      const g = c.getContext('2d')!
      const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
      grad.addColorStop(0, 'rgba(255,255,255,1)')
      grad.addColorStop(0.35, 'rgba(255,255,255,0.55)')
      grad.addColorStop(0.7, 'rgba(255,255,255,0.15)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = grad
      g.fillRect(0, 0, 128, 128)
      return new THREE.CanvasTexture(c)
    })()
    const glowMat = new THREE.MeshBasicMaterial({ color: '#ffd9a0', map: glowTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    const lining = vel(0.85)
    lining.side = THREE.BackSide
    return { emb, velvet: vel(1), lining, inside: vel(0.35), sealMat, gold, card, glowMat }
  }, [embroidery, velvet, seal])

  // tassel strands: thin gold threads in a loose cone
  const strands = useMemo(() => {
    const rand = mulberry32(3)
    const geo = new THREE.CylinderGeometry(0.0011, 0.0011, 0.1, 5, 1)
    geo.translate(0, -0.05, 0)
    const mesh = new THREE.InstancedMesh(geo, mats.gold, 140)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    for (let i = 0; i < 140; i++) {
      const a = rand() * Math.PI * 2
      const r = Math.sqrt(rand()) * 0.009
      const tilt = 0.05 + r * 9
      q.setFromEuler(new THREE.Euler(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt))
      m.compose(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r), q, new THREE.Vector3(1, 0.85 + rand() * 0.25, 1))
      mesh.setMatrixAt(i, m)
    }
    mesh.castShadow = true
    return mesh
  }, [mats.gold])

  useFrame((_, dt) => {
    // a damped pendulum for the tassel
    const s = swing.current
    s.vel += (-s.angle * 40 - s.vel * 3.2) * Math.min(dt, 0.05)
    s.angle += s.vel * Math.min(dt, 0.05)
    if (tassel.current) tassel.current.rotation.x = s.angle
  })

  const { w, h, d } = ENV
  const [ax, ay] = built.apex
  const zFront = d / 2
  return (
    <group ref={root} {...props}>
      <mesh geometry={built.body} material={mats.velvet} castShadow receiveShadow />
      {/* the inside of the back panel, in shadow */}
      <mesh geometry={built.inside} material={mats.inside} position-z={zFront + 0.0008} />
      {/* soft light that rises from inside when it opens */}
      {/* (just in front of the back panel, so the pocket hides it except through the V and above the mouth) */}
      <mesh ref={glow} material={mats.glowMat} position={[0, h * 0.86, zFront + 0.001]}>
        <planeGeometry args={[w * 1.15, h * 0.95]} />
      </mesh>
      <group ref={card} position={[0, h * 0.47, zFront + 0.0016]}>
        <mesh material={mats.card} castShadow>
          <planeGeometry args={[w * 0.86, h * 0.78]} />
        </mesh>
      </group>
      <mesh geometry={built.pocket} material={mats.emb} position-z={zFront + 0.0032} receiveShadow />
      {/* the seal's lower half stays on the pocket, with the tassel */}
      <mesh geometry={built.sealBottomGeo} material={mats.sealMat} position={[ax, ay, zFront + 0.006]} castShadow />
      <group ref={tassel} position={[ax, ay - SEAL_R * 0.95, zFront + 0.02]}>
        <mesh position={[0, -0.012, 0]} material={mats.gold} castShadow>
          <cylinderGeometry args={[0.0028, 0.0028, 0.024, 8]} />
        </mesh>
        <mesh position={[0, -0.03, 0]} material={mats.gold} castShadow>
          <sphereGeometry args={[0.009, 20, 14]} />
        </mesh>
        <mesh position={[0, -0.042, 0]} material={mats.gold} castShadow>
          <cylinderGeometry args={[0.0075, 0.0105, 0.016, 20]} />
        </mesh>
        <primitive object={strands} position={[0, -0.048, 0]} />
      </group>
      {/* the flap, hinged on the top edge */}
      <group ref={flap} position={[0, h, zFront + 0.005]}>
        <mesh geometry={built.flapFront} material={mats.emb} castShadow receiveShadow />
        <mesh geometry={built.flapFront} material={mats.lining} position-z={-0.0015} />
        <mesh geometry={built.piping} material={mats.gold} castShadow />
        <group ref={sealTop} position={[ax, ay - h, 0.001]}>
          <mesh geometry={built.sealTopGeo} material={mats.sealMat} castShadow />
        </group>
      </group>
    </group>
  )
})
