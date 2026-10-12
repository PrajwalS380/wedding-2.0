import { useMemo } from 'react'
import * as THREE from 'three'
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { createNoise2D, fbm } from '../textures/noise'
import { useBrass } from './BrassLamps'
import { Garland } from './Garland'

/**
 * A carved sandstone elephant on its plinth (Reference B, the closing scene), dressed for
 * the wedding. The body is sculpted as one smooth form from overlapping spheres (a metaball
 * field polygonised by marching cubes): barrel, rump, the two domes of the head, cheeks, a
 * trunk curling at its tip, fanned ears, pillar legs and a tail. The stone is mottled with
 * weathering. Over it: ivory tusks with gilt bands, a velvet caparison that follows the
 * body's own surface (worked with a gold border, buti and a scalloped, tasselled hem), a gilt
 * forehead plate, a chain of bells and a marigold garland. Faces -x; feet on the plinth.
 */

type Ball = [number, number, number, number] // x, y, z, radius (metres)

const BOX = 3.2 // the sculpting volume, metres
const SUB = 30 // field fall-off: higher keeps forms crisper where spheres meet
const ISO = 80
/** Height of the body above the plinth's top: the legs below are long, as an elephant's are. */
const L = 0.42

function balls(): Ball[] {
  const b: Ball[] = []
  const up = (x: number, y: number, z: number, r: number) => b.push([x, y + L, z, r])
  // barrel, belly, withers and rump
  up(-0.3, 1.5, 0, 0.5)
  up(0.05, 1.52, 0, 0.53)
  up(0.4, 1.48, 0, 0.5)
  up(0.6, 1.42, 0, 0.42)
  up(0.1, 1.24, 0, 0.42)
  up(-0.15, 1.78, 0, 0.32)
  up(0.62, 1.62, 0, 0.36)
  // head: the skull, the twin domes on top, forehead, cheeks
  up(-0.75, 1.72, 0, 0.35)
  up(-0.93, 1.86, 0, 0.24)
  up(-0.84, 2.04, 0.1, 0.15)
  up(-0.84, 2.04, -0.1, 0.15)
  up(-0.84, 1.58, 0.15, 0.22)
  up(-0.84, 1.58, -0.15, 0.22)
  // trunk, tapering and curling forward at its tip
  const trunk: Array<[number, number, number]> = [
    [-1.04, 1.54, 0.16], [-1.08, 1.38, 0.14], [-1.1, 1.22, 0.125], [-1.1, 1.06, 0.112], [-1.09, 0.9, 0.1], [-1.07, 0.75, 0.09], [-1.04, 0.6, 0.082], [-0.99, 0.47, 0.075], [-0.92, 0.39, 0.068], [-0.85, 0.4, 0.06], [-0.81, 0.46, 0.055],
  ]
  for (const [x, y, r] of trunk) up(x, y, 0, r)
  // ears: broad flaps fanned against the sides of the head, thinner at the rim
  for (const s of [-1, 1])
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        const x = -0.4 - i * 0.13
        const y = 1.34 + j * 0.15 + (i === 3 ? 0.06 : 0)
        const rim = i === 3 || j === 0 || j === 3
        up(x, y, s * (0.4 + i * 0.025), rim ? 0.085 : 0.1)
      }
  // legs: long pillars from the body to broad round feet on the plinth
  for (const [lx, lz] of [[-0.38, 0.27], [-0.38, -0.27], [0.48, 0.27], [0.48, -0.27]])
    for (let k = 0; k <= 11; k++) {
      const y = 1.3 + L - k * 0.11
      const r = k === 11 ? 0.2 : k === 7 ? 0.172 : 0.165
      b.push([lx, y, lz, r])
    }
  // tail with its tuft
  up(0.92, 1.56, 0, 0.06)
  up(0.96, 1.41, 0, 0.05)
  up(0.98, 1.26, 0, 0.045)
  up(0.99, 1.12, 0, 0.04)
  up(0.99, 1.02, 0, 0.055)
  return b
}

/** The metaball field at a point (in metres), with ISO at the surface. */
function field(bs: Ball[], x: number, y: number, z: number) {
  let v = 0
  for (const [bx, by, bz, r] of bs) {
    const rn = r / BOX
    const s = rn * rn * (ISO + SUB)
    const d2 = ((x - bx) / BOX) ** 2 + ((y - by) / BOX) ** 2 + ((z - bz) / BOX) ** 2
    v += Math.max(0, s / (0.000001 + d2) - SUB)
  }
  return v
}

function sculpt(bs: Ball[]): THREE.BufferGeometry {
  const mc = new MarchingCubes(96, new THREE.MeshBasicMaterial(), false, false, 160000)
  mc.isolation = ISO
  mc.reset()
  for (const [x, y, z, r] of bs) {
    const rn = r / BOX
    mc.addBall((x + BOX / 2) / BOX, y / BOX, (z + BOX / 2) / BOX, rn * rn * (ISO + SUB), SUB)
  }
  mc.update()
  const n = mc.count
  const pos = new Float32Array(n * 3)
  const nor = new Float32Array(n * 3)
  pos.set(mc.positionArray.subarray(0, n * 3))
  nor.set(mc.normalArray.subarray(0, n * 3))
  // from the cube's [-1, 1] to metres
  for (let i = 0; i < n; i++) {
    pos[i * 3] *= BOX / 2
    pos[i * 3 + 1] = (pos[i * 3 + 1] + 1) * (BOX / 2)
    pos[i * 3 + 2] *= BOX / 2
  }
  let g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  // one smooth surface: weld the triangles and take the normals from it
  g.deleteAttribute('normal')
  g = mergeVertices(g, 1e-4)
  g.computeVertexNormals()
  return finish(g, bs)
}

/** Weathered, carved stone: darker in the folds (where the stone closes round a point), paler where rain washes it, flecked. */
function finish(g: THREE.BufferGeometry, bs: Ball[]): THREE.BufferGeometry {
  const pos = g.attributes.position.array as Float32Array
  const nor = g.attributes.normal.array as Float32Array
  const n = g.attributes.position.count
  // weathered stone: darker in the folds below, paler where rain has washed it, flecked
  const noise = createNoise2D(5)
  const col = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3]
    const y = pos[i * 3 + 1]
    const z = pos[i * 3 + 2]
    const ny = nor[i * 3 + 1]
    const m = fbm(noise, x * 3 + z * 2, y * 3, 3) * 0.12 + fbm(noise, x * 18 - z * 7, y * 18 + 40, 2) * 0.05
    // a step out along the normal: if the stone is still near, this point sits in a fold
    const out = field(bs, x + nor[i * 3] * 0.07, y + ny * 0.07, z + nor[i * 3 + 2] * 0.07)
    const fold = Math.min(1, out / ISO)
    const v = (0.9 + m + ny * 0.06) * (1 - fold * 0.55)
    col[i * 3] = v * 1.0
    col[i * 3 + 1] = v * 0.93
    col[i * 3 + 2] = v * 0.84
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return g
}

/**
 * A surface laid over the body: for each (u, v) it marches along a ray until it crosses the
 * stone's surface (outward from inside, or inward from outside), then stands off by `lift`.
 */
function conform(bs: Ball[], nu: number, nv: number, at: (u: number, v: number) => { o: THREE.Vector3; d: THREE.Vector3 }, lift: number, fromOutside = false, hang = false) {
  const g = new THREE.PlaneGeometry(1, 1, nu, nv)
  const p = g.attributes.position
  const uv = g.attributes.uv
  const q = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    const { o, d } = at(uv.getX(i), uv.getY(i))
    let t = 0.02
    const inside = (k: number) => field(bs, o.x + d.x * k, o.y + d.y * k, o.z + d.z * k) > ISO
    if (fromOutside) while (t < 1.4 && !inside(t)) t += 0.005
    else while (t < 1.4 && inside(t)) t += 0.01
    q.copy(o).addScaledVector(d, fromOutside ? t - lift : t + lift)
    p.setXYZ(i, q.x, q.y, q.z)
  }
  if (hang) {
    // cloth does not follow the belly back in: below its widest point each column falls plumb
    for (let col = 0; col <= nu; col++)
      for (const half of [0, 1]) {
        let widest = 0
        for (let k = 0; k <= nv / 2; k++) {
          const row = half ? nv / 2 - k : nv / 2 + k
          const i = row * (nu + 1) + col
          const z = Math.abs(p.getZ(i))
          if (z >= widest) widest = z
          else {
            // falling plumb, in soft folds that deepen toward the hem
            const drop = Math.min(1, k / (nv / 2) - 0.2)
            const fold = Math.sin((col / nu) * Math.PI * 14) * 0.022 * Math.max(0, drop)
            p.setZ(i, Math.sign(p.getZ(i)) * (widest + fold + 0.012 * Math.max(0, drop)))
          }
        }
      }
  }
  g.computeVertexNormals()
  return g
}

function caparisonTexture(): THREE.CanvasTexture {
  const W = 1024
  const H = 512
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!
  g.fillStyle = '#7a1424'
  g.fillRect(0, 0, W, H)
  // buti in gold over the velvet
  g.fillStyle = '#d9ae58'
  for (let y = 70; y < H - 70; y += 34)
    for (let x = ((y / 34) % 2) * 17 + 60; x < W - 50; x += 34) {
      g.beginPath()
      g.ellipse(x, y, 5, 8, 0.5, 0, Math.PI * 2)
      g.fill()
    }
  // borders: a broad gold band with a red-and-green inlay, along both hems and the ends
  const band = (x: number, y: number, w: number, h: number) => {
    const horizontal = w > h
    const gr = g.createLinearGradient(x, y, horizontal ? x : x + w, horizontal ? y + h : y)
    gr.addColorStop(0, '#9a7426')
    gr.addColorStop(0.5, '#f4d68a')
    gr.addColorStop(1, '#9a7426')
    g.fillStyle = gr
    g.fillRect(x, y, w, h)
    g.fillStyle = '#1e5a44'
    for (let k = horizontal ? x + 10 : y + 10; k < (horizontal ? x + w : y + h) - 10; k += 22) {
      if (horizontal) g.fillRect(k, y + h / 2 - 4, 10, 8)
      else g.fillRect(x + w / 2 - 4, k, 8, 10)
    }
    g.fillStyle = '#c4243f'
    for (let k = horizontal ? x + 21 : y + 21; k < (horizontal ? x + w : y + h) - 10; k += 22) {
      g.beginPath()
      if (horizontal) g.arc(k, y + h / 2, 3, 0, Math.PI * 2)
      else g.arc(x + w / 2, k, 3, 0, Math.PI * 2)
      g.fill()
    }
  }
  band(0, 0, W, 48)
  band(0, H - 48, W, 48)
  band(0, 0, 40, H)
  band(W - 40, 0, 40, H)
  // scalloped hems: cut the edge into arcs
  g.globalCompositeOperation = 'destination-out'
  for (let x = 0; x < W; x += 64)
    for (const [y0, dir] of [[0, 1], [H, -1]] as const) {
      g.beginPath()
      g.moveTo(x, y0)
      g.lineTo(x, y0 + dir * 6)
      g.quadraticCurveTo(x + 32, y0 + dir * 30, x + 64, y0 + dir * 6)
      g.lineTo(x + 64, y0)
      g.fill()
    }
  g.globalCompositeOperation = 'source-over'
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function frontletTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 512
  const g = c.getContext('2d')!
  // a shield of gold: raised border, a lotus at the top, a column of jewels
  g.fillStyle = '#c9963e'
  g.fillRect(0, 0, 256, 512)
  g.strokeStyle = '#f6dc94'
  g.lineWidth = 10
  g.strokeRect(10, 10, 236, 492)
  g.fillStyle = '#f6dc94'
  for (let y = 40; y < 480; y += 30) {
    g.beginPath()
    g.arc(128, y, 9, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = '#b3122c'
  for (let y = 55; y < 480; y += 60) {
    g.beginPath()
    g.arc(128, y, 7, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = '#1e7a5a'
  for (let y = 85; y < 480; y += 60) {
    g.beginPath()
    g.arc(70, y, 6, 0, Math.PI * 2)
    g.arc(186, y, 6, 0, Math.PI * 2)
    g.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/**
 * Sandstone: the surface normal is broken up by a fine grain (3D value noise), and the trunk is
 * ringed with the creases of its skin, all computed in the shader from the object-space position.
 */
function carvedStone() {
  const m = new THREE.MeshStandardMaterial({ color: '#b8a088', roughness: 0.92, vertexColors: true })
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObj;\nvarying vec3 vAx;\nvarying vec3 vAy;\nvarying vec3 vAz;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvObj = position;\nmat4 mv = viewMatrix * modelMatrix;\nvAx = (mv * vec4(1.0, 0.0, 0.0, 0.0)).xyz;\nvAy = (mv * vec4(0.0, 1.0, 0.0, 0.0)).xyz;\nvAz = (mv * vec4(0.0, 0.0, 1.0, 0.0)).xyz;',
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vObj;
        varying vec3 vAx;
        varying vec3 vAy;
        varying vec3 vAz;
        float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        float vn(vec3 p) {
          vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
        }
        float grain(vec3 p) {
          float trunk = smoothstep(-0.92, -1.0, p.x) * smoothstep(${(1.55 + 0.42).toFixed(2)}, ${(1.35 + 0.42).toFixed(2)}, p.y);
          float creases = trunk * pow(abs(sin(p.y * 95.0 + vn(p * 6.0) * 2.0)), 6.0) * 0.6;
          return vn(p * 40.0) * 0.5 + vn(p * 110.0) * 0.25 - creases;
        }`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        {
          float e = 0.004;
          float g0 = grain(vObj);
          vec3 gr = vec3(grain(vObj + vec3(e, 0.0, 0.0)) - g0, grain(vObj + vec3(0.0, e, 0.0)) - g0, grain(vObj + vec3(0.0, 0.0, e)) - g0) / e;
          vec3 gv = vAx * gr.x + vAy * gr.y + vAz * gr.z;
          normal = normalize(normal - (gv - dot(gv, normal) * normal) * 0.006);
        }`,
      )
  }
  m.customProgramCacheKey = () => 'carved-stone'
  return m
}

/** A carved band of lotus petals between two beads, for the plinth's middle course (colour and relief). */
function lotusBand(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const W = 2048
  const H = 112
  const make = () => {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    return c
  }
  const col = make()
  const rel = make()
  const c = col.getContext('2d')!
  const b = rel.getContext('2d')!
  c.fillStyle = '#c4a98c'
  c.fillRect(0, 0, W, H)
  b.fillStyle = '#707070'
  b.fillRect(0, 0, W, H)
  for (const [g, light, dark] of [[c, '#d8bfa2', 'rgba(70,46,30,0.55)'], [b, '#d0d0d0', '#303030']] as const) {
    // beads top and bottom
    for (let x = 6; x < W; x += 14)
      for (const y of [10, H - 10]) {
        g.fillStyle = light
        g.beginPath()
        g.arc(x, y, 5, 0, Math.PI * 2)
        g.fill()
      }
    // petals
    for (let x = 0; x < W; x += 48) {
      g.fillStyle = dark
      g.beginPath()
      g.moveTo(x + 2, H - 22)
      g.quadraticCurveTo(x + 2, 28, x + 24, 20)
      g.quadraticCurveTo(x + 46, 28, x + 46, H - 22)
      g.closePath()
      g.fill()
      g.fillStyle = light
      g.beginPath()
      g.moveTo(x + 7, H - 24)
      g.quadraticCurveTo(x + 7, 32, x + 24, 25)
      g.quadraticCurveTo(x + 41, 32, x + 41, H - 24)
      g.closePath()
      g.fill()
    }
  }
  const map = new THREE.CanvasTexture(col)
  map.colorSpace = THREE.SRGBColorSpace
  return { map, bump: new THREE.CanvasTexture(rel) }
}

/** A tube whose radius narrows along its length (for the tusks). */
function taperedTube(points: THREE.Vector3[], r0: number, r1: number) {
  const curve = new THREE.CatmullRomCurve3(points)
  const g = new THREE.TubeGeometry(curve, 24, 1, 12, false)
  const p = g.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    const ring = Math.floor(i / 13)
    const t = ring / 24
    const c = curve.getPointAt(Math.min(1, t))
    v.set(p.getX(i), p.getY(i), p.getZ(i)).sub(c)
    v.multiplyScalar(r0 + (r1 - r0) * t * t)
    p.setXYZ(i, c.x + v.x, c.y + v.y, c.z + v.z)
  }
  g.computeVertexNormals()
  return g
}

export function Elephant({ position = [0, 0, 0] as [number, number, number], rotation = 0 }: { position?: [number, number, number]; rotation?: number }) {
  const gold = useBrass(0.28)
  const parts = useMemo(() => {
    const bs = balls()
    const body = sculpt(bs)
    // the caparison wraps the barrel from hem to hem
    const caparison = conform(bs, 60, 40, (u, v) => {
      const x = -0.32 + u * 0.88
      const th = (v - 0.5) * 4.6
      return { o: new THREE.Vector3(x, 1.5 + L, 0), d: new THREE.Vector3(0, Math.cos(th), Math.sin(th)) }
    }, 0.025, false, true)
    // tassels along both hems
    const tassels: THREE.Vector3[] = []
    const cp = caparison.attributes.position
    for (let col = 2; col < 60; col += 4)
      for (const row of [0, 40]) {
        const i = row * 61 + col
        tassels.push(new THREE.Vector3(cp.getX(i), cp.getY(i) - 0.02, cp.getZ(i)))
      }
    // the gilt frontlet down the forehead onto the trunk
    const frontlet = conform(bs, 12, 30, (u, v) => {
      const y = 1.22 + L + v * 0.78
      const half = 0.07 + 0.11 * v
      return { o: new THREE.Vector3(-1.6, y, (u - 0.5) * 2 * half), d: new THREE.Vector3(1, 0, 0) }
    }, 0.012, true)
    const tusks = [-1, 1].map((s) => taperedTube([new THREE.Vector3(-0.97, 1.42 + L, s * 0.15), new THREE.Vector3(-1.13, 1.26 + L, s * 0.2), new THREE.Vector3(-1.31, 1.24 + L, s * 0.22), new THREE.Vector3(-1.43, 1.34 + L, s * 0.2)], 0.05, 0.012))
    // a garland round the neck and a chain of bells under the throat
    const neck: Array<[number, number, number]> = []
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 2
      neck.push([-0.5 + Math.cos(a) * 0.06, 1.52 + L + Math.cos(a) * 0.56, Math.sin(a) * 0.6])
    }
    const bells: Array<[number, number, number]> = []
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (i - 3) * 0.24
      bells.push([-0.58 + Math.cos(a) * 0.05, 1.52 + L + Math.cos(a) * 0.53 - 0.04, Math.sin(a) * 0.56])
    }
    return { body, caparison, frontlet, tusks, neck, bells, tassels }
  }, [])
  const mats = useMemo(
    () => ({
      stone: carvedStone(),
      ivory: new THREE.MeshStandardMaterial({ color: '#f0e4c8', roughness: 0.35 }),
      cloth: new THREE.MeshPhysicalMaterial({ map: caparisonTexture(), roughness: 0.8, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color('#e0627a'), alphaTest: 0.5, side: THREE.DoubleSide }),
      frontlet: new THREE.MeshStandardMaterial({ map: frontletTexture(), metalness: 0.85, roughness: 0.32 }),
      plinth: new THREE.MeshStandardMaterial({ color: '#b39a80', roughness: 0.9 }),
      carved: (() => {
        const { map, bump } = lotusBand()
        return new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 3, color: '#cbb194', roughness: 0.9 })
      })(),
    }),
    [],
  )
  const bellGeo = useMemo(() => new THREE.LatheGeometry([[0.001, 0], [0.035, 0.0], [0.04, 0.01], [0.032, 0.04], [0.02, 0.07], [0.006, 0.08], [0.001, 0.082]].map(([r, y]) => new THREE.Vector2(r, y)), 16), [])
  return (
    <group position={position} rotation-y={rotation}>
      {/* the plinth: three stepped courses with a moulded cap */}
      <mesh material={mats.plinth} position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.9, 0.2, 1.4]} />
      </mesh>
      <mesh material={[mats.plinth, mats.plinth, mats.plinth, mats.plinth, mats.carved, mats.carved]} position={[0, 0.27, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 0.14, 1.24]} />
      </mesh>
      <mesh material={mats.plinth} position={[0, 0.375, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.78, 0.07, 1.3]} />
      </mesh>
      <mesh material={gold} position={[0, 0.2, 0.701]}>
        <boxGeometry args={[2.9, 0.02, 0.005]} />
      </mesh>
      {/* the elephant stands on the plinth (its feet are sculpted down to its top) */}
      <mesh geometry={parts.body} material={mats.stone} castShadow receiveShadow />
      {parts.tusks.map((g, i) => (
        <mesh key={i} geometry={g} material={mats.ivory} castShadow />
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} material={gold} position={[-1.14, 1.255 + L, s * 0.2]} rotation={[s * 0.35, 0, -0.9]}>
          <torusGeometry args={[0.04, 0.008, 8, 20]} />
        </mesh>
      ))}
      <mesh geometry={parts.caparison} material={mats.cloth} castShadow receiveShadow />
      <mesh geometry={parts.frontlet} material={mats.frontlet} />
      {/* eyes, deep-set under the brow */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-0.98, 1.76 + L, s * 0.19]}>
          <sphereGeometry args={[0.025, 12, 8]} />
          <meshStandardMaterial color="#2a1c12" roughness={0.3} />
        </mesh>
      ))}
      <Garland points={parts.neck} radius={0.085} density={240} seed={77} />
      {/* toenails round the front of each foot */}
      {[[-0.38, 0.27], [-0.38, -0.27], [0.48, 0.27], [0.48, -0.27]].flatMap(([lx, lz]) =>
        [-0.5, 0, 0.5].map((a) => (
          <mesh key={`${lx}${lz}${a}`} material={mats.ivory} position={[lx - Math.cos(a) * 0.19, 0.47, lz + Math.sin(a) * 0.19]} scale={[0.6, 1, 1]}>
            <sphereGeometry args={[0.042, 12, 8]} />
          </mesh>
        )),
      )}
      {parts.tassels.map((p, i) => (
        <group key={i} position={p}>
          <mesh material={gold} position-y={-0.03}>
            <coneGeometry args={[0.018, 0.07, 8]} />
          </mesh>
          <mesh material={gold} position-y={0.012}>
            <sphereGeometry args={[0.012, 8, 6]} />
          </mesh>
        </group>
      ))}
      {parts.bells.map((p, i) => (
        <group key={i} position={p}>
          <mesh geometry={bellGeo} material={gold} position-y={-0.09} castShadow />
          <mesh material={gold} position-y={-0.01}>
            <cylinderGeometry args={[0.004, 0.004, 0.05, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
