import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useWorldAssets } from '../assets'
import { mulberry32 } from '../textures/noise'

/**
 * The tree line beyond the lawn, as painted cards: four kinds of tree (a broad rain tree, a
 * round mango, a columnar ashoka and a ragged neem), each crown built from thousands of leaf
 * dabs gathered into clumps. Every clump is shaded as a small dome under the low sun behind
 * the trees: dark and cool underneath, mid-green in the body, a warm gold rim along its top
 * where the light comes through, with a few gaps of sky. Two rows at different depths, tinted
 * one by one, turned toward the garden and lit by the scene, so dusk darkens them like
 * everything else.
 */

type Lobe = { x: number; y: number; rx: number; ry: number }
type Kind = { lobes: (r: () => number) => Lobe[]; trunk: Array<[number, number, number, number, number]>; dabs: number; aspect: number; height: [number, number] }

const SIZE = 512

const KINDS: Kind[] = [
  // rain tree: a wide, flat-topped umbrella on a short trunk with spreading limbs
  {
    lobes: (r) =>
      Array.from({ length: 16 }, (_, i) => {
        // an upper arc of clumps over a lower, inner row: a domed umbrella
        const upper = i < 11
        const t = upper ? i / 10 : (i - 11) / 4
        const x = upper ? 40 + t * 432 : 120 + t * 272
        const y = upper ? 175 - Math.sin(Math.PI * t) * 70 : 215 - Math.sin(Math.PI * t) * 30
        return { x: x + (r() - 0.5) * 30, y: y + (r() - 0.5) * 24, rx: 58 + r() * 30, ry: 50 + r() * 24 }
      }),
    trunk: [
      [256, 512, 256, 300, 30],
      [256, 330, 130, 215, 14],
      [256, 320, 190, 190, 12],
      [256, 320, 330, 195, 12],
      [256, 330, 395, 220, 14],
    ],
    dabs: 3400,
    aspect: 1.7,
    height: [8, 11],
  },
  // mango: a dense, rounded dome
  {
    lobes: (r) =>
      Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2
        const k = i === 0 ? 0 : 1
        return { x: 256 + Math.cos(a) * 95 * k + (r() - 0.5) * 20, y: 210 + Math.sin(a) * 85 * k + (r() - 0.5) * 20, rx: 80 + r() * 22, ry: 72 + r() * 20 }
      }),
    trunk: [
      [256, 512, 256, 380, 26],
      [256, 400, 205, 300, 12],
      [256, 400, 310, 290, 12],
    ],
    dabs: 3000,
    aspect: 1.05,
    height: [7.5, 10],
  },
  // ashoka: tall and columnar, its leaves hanging in tiers
  {
    lobes: (r) =>
      Array.from({ length: 10 }, (_, i) => {
        const t = i / 9
        return { x: 256 + (r() - 0.5) * 16, y: 40 + t * 400, rx: 34 + Math.sin(Math.PI * Math.min(1, t * 1.15)) * 46 + r() * 8, ry: 38 + r() * 10 }
      }),
    trunk: [[256, 512, 256, 420, 14]],
    dabs: 2400,
    aspect: 0.42,
    height: [10, 13.5],
  },
  // neem: an open, ragged crown of separate clumps on a leaning trunk
  {
    lobes: (r) =>
      Array.from({ length: 12 }, () => ({ x: 70 + r() * 372, y: 70 + r() * 230, rx: 42 + r() * 36, ry: 34 + r() * 26 })),
    trunk: [
      [240, 512, 268, 330, 24],
      [268, 340, 160, 230, 12],
      [268, 340, 360, 200, 12],
      [268, 340, 270, 170, 10],
      [160, 230, 110, 170, 7],
    ],
    dabs: 3000,
    aspect: 1.3,
    height: [8.5, 11.5],
  },
]

function inside(lobes: Lobe[], x: number, y: number) {
  for (const l of lobes) if (((x - l.x) / l.rx) ** 2 + ((y - l.y) / l.ry) ** 2 < 1) return true
  return false
}

/** Paints one kind of tree onto a canvas: limbs, then the crown dab by dab, then gaps of sky. */
function paintTree(kind: Kind, seed: number, density: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = c.height = SIZE
  const g = c.getContext('2d')!
  const rand = mulberry32(seed)
  const lobes = kind.lobes(rand)
  // limbs: tapering strokes, darker toward the shadowed side
  g.lineCap = 'round'
  for (const [x0, y0, x1, y1, w] of kind.trunk) {
    for (let k = 0; k < 6; k++) {
      const f = k / 5
      g.strokeStyle = `rgb(${34 + f * 26},${24 + f * 16},${16 + f * 8})`
      g.lineWidth = w * (1 - f * 0.55)
      g.beginPath()
      g.moveTo(x0 + f * w * 0.12, y0)
      g.quadraticCurveTo((x0 + x1) / 2 + (rand() - 0.5) * 18, (y0 + y1) / 2, x1 + f * w * 0.1, y1)
      g.stroke()
    }
  }
  // the crown's bounds, for the global dome
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const l of lobes) {
    minX = Math.min(minX, l.x - l.rx)
    maxX = Math.max(maxX, l.x + l.rx)
    minY = Math.min(minY, l.y - l.ry)
    maxY = Math.max(maxY, l.y + l.ry)
  }
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const hx = (maxX - minX) / 2
  const hy = (maxY - minY) / 2
  // underpaint so the crown reads as a mass, not confetti
  g.fillStyle = '#1b2614'
  for (const l of lobes) {
    g.beginPath()
    g.ellipse(l.x, l.y + l.ry * 0.08, l.rx * 0.82, l.ry * 0.8, 0, 0, Math.PI * 2)
    g.fill()
  }
  // dabs, shaded by their clump and by the crown as a whole
  type Dab = { x: number; y: number; z: number; col: string; r: number; a: number }
  const dabs: Dab[] = []
  const n = Math.round(kind.dabs * density)
  for (let i = 0; i < n; i++) {
    const l = lobes[Math.floor(rand() * lobes.length)]
    const a = rand() * Math.PI * 2
    const d = Math.sqrt(rand())
    const lx = Math.cos(a) * d
    const ly = Math.sin(a) * d
    const x = l.x + lx * l.rx
    const y = l.y + ly * l.ry
    const lz = Math.sqrt(Math.max(0, 1 - lx * lx - ly * ly))
    const gx = (x - cx) / hx
    const gy = (y - cy) / hy
    // light: soft sky from above and in front; the sun from behind catches the tops and edges
    const sky = 0.35 + 0.35 * (-ly * 0.6 + lz * 0.5) + 0.2 * -gy
    // (and the crown's outer flanks glow faintly where the light wraps round them)
    const rim = Math.max(0, -ly) ** 2 * (1 - lz) * 1.6 + Math.max(0, -gy - 0.35) * 0.6 + Math.max(0, Math.abs(gx) - 0.75) * 0.5
    const shade = Math.max(0, ly) * 0.5 + Math.max(0, gy) * 0.35
    const jitter = (rand() - 0.5) * 0.18
    const v = Math.min(1.2, Math.max(0, sky - shade + jitter))
    let r = 22 + v * 52
    let gg = 32 + v * 62
    let b = 18 + v * 26
    r += rim * 150
    gg += rim * 118
    b += rim * 30
    dabs.push({ x, y, z: lz + rand() * 0.3, col: `rgb(${Math.min(255, r) | 0},${Math.min(255, gg) | 0},${Math.min(255, b) | 0})`, r: 3 + rand() * 4.5, a: rand() * Math.PI })
  }
  dabs.sort((p, q) => p.z - q.z)
  for (const d of dabs) {
    g.fillStyle = d.col
    g.beginPath()
    g.ellipse(d.x, d.y, d.r, d.r * 0.55, d.a, 0, Math.PI * 2)
    g.fill()
  }
  // a ragged edge: loose leaves just outside the crown, and gaps of sky inside it
  for (let i = 0; i < 260 * density; i++) {
    const l = lobes[Math.floor(rand() * lobes.length)]
    const a = rand() * Math.PI * 2
    const x = l.x + Math.cos(a) * l.rx * (1 + rand() * 0.12)
    const y = l.y + Math.sin(a) * l.ry * (1 + rand() * 0.12)
    if (inside(lobes, x + Math.cos(a) * 6, y + Math.sin(a) * 6)) continue
    const top = Math.max(0, -Math.sin(a))
    g.fillStyle = `rgb(${40 + top * 150 | 0},${52 + top * 120 | 0},${24 + top * 30 | 0})`
    g.beginPath()
    g.ellipse(x, y, 2 + rand() * 2.5, 1.2 + rand(), a, 0, Math.PI * 2)
    g.fill()
  }
  g.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 16; i++) {
    const l = lobes[Math.floor(rand() * lobes.length)]
    const a = rand() * Math.PI * 2
    const d = 0.8 + rand() * 0.18
    const x = l.x + Math.cos(a) * l.rx * d
    const y = l.y + Math.sin(a) * l.ry * d
    // only where the gap opens to the outside of the crown, never as a hole in its middle
    if (inside(lobes, x + Math.cos(a) * 14, y + Math.sin(a) * 14)) continue
    g.beginPath()
    g.ellipse(x, y, 1.5 + rand() * 2.5, 1 + rand() * 1.8, rand() * Math.PI, 0, Math.PI * 2)
    g.fill()
  }
  g.globalCompositeOperation = 'source-over'
  return c
}

function hazedLit(map: THREE.Texture, amount: number) {
  const m = new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, roughness: 1, metalness: 0, envMapIntensity: 0.9 })
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <fog_fragment>',
      `#ifdef USE_FOG
        gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, smoothstep(fogNear, fogFar, vFogDepth) * ${amount.toFixed(2)});
      #endif`,
    )
  }
  m.customProgramCacheKey = () => `tree-haze-${amount}`
  return m
}

/** Where the trees stand: a nearer and a farther row either side of the palace, clear of its front. */
function placements(seed: number) {
  const rand = mulberry32(seed)
  const out: Array<{ kind: number; x: number; z: number; h: number; flip: boolean; tint: number }> = []
  for (let i = 0; i < 84; i++) {
    const near = i < 30
    const side = i % 2 ? 1 : -1
    const z = near ? -64 - rand() * 14 : -82 - rand() * 30
    const minX = near ? 21 : 27
    const x = side * (minX + rand() * (near ? 38 : 58))
    const r = rand()
    const kind = r < 0.32 ? 0 : r < 0.58 ? 1 : r < 0.78 ? 3 : 2
    const [h0, h1] = KINDS[kind].height
    out.push({ kind, x, z, h: h0 + rand() * (h1 - h0), flip: rand() < 0.5, tint: 0.82 + rand() * 0.3 })
  }
  return out
}

export function TreeLine() {
  const { quality } = useWorldAssets()
  const density = quality.floral
  const mats = useMemo(
    () =>
      KINDS.map((k, i) => {
        const t = new THREE.CanvasTexture(paintTree(k, 40 + i * 7, density))
        t.colorSpace = THREE.SRGBColorSpace
        t.anisotropy = 4
        return hazedLit(t, 0.52)
      }),
    [density],
  )
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), [])
  const spots = useMemo(() => placements(31), [])
  const refs = useRef<Array<THREE.InstancedMesh | null>>([])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    const colour = new THREE.Color()
    const count = KINDS.map(() => 0)
    for (const s of spots) {
      const mesh = refs.current[s.kind]
      if (!mesh) continue
      const w = s.h * KINDS[s.kind].aspect * (s.flip ? -1 : 1)
      // turned to face the garden
      q.setFromAxisAngle(up, Math.atan2(-s.x, -s.z))
      m.compose(new THREE.Vector3(s.x, -0.3, s.z), q, new THREE.Vector3(w, s.h, 1))
      const i = count[s.kind]++
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, colour.setRGB(s.tint, s.tint * (0.96 + (s.tint - 0.82) * 0.2), s.tint * 0.92))
    }
    refs.current.forEach((mesh, k) => {
      if (!mesh) return
      mesh.count = count[k]
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    })
  }, [spots])
  return (
    <group>
      {mats.map((mat, k) => (
        <instancedMesh
          key={k}
          ref={(el) => {
            refs.current[k] = el
          }}
          args={[geo, mat, spots.filter((s) => s.kind === k).length]}
          frustumCulled={false}
        />
      ))}
    </group>
  )
}
