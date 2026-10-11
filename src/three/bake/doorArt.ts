/**
 * Vector artwork of a carved rosewood palace door, drawn with Canvas 2D in a
 * 512 × 1536 design space (scaled to the bake size). Three greyscale layers:
 *   height — the carved relief (white = proud of the surface)
 *   gold   — gilded inlay lines and brass bosses
 *   groove — fine incised details cut into the relief after rounding
 */
import { makeCanvas } from './canvas'

const DW = 512
const DH = 1536
type Ctx = CanvasRenderingContext2D

const g = (v: number) => {
  const c = Math.round(v * 255)
  return `rgb(${c},${c},${c})`
}

function elephant(ctx: Ctx, x: number, y: number, s: number, flip: boolean) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(flip ? -s : s, s)
  ctx.beginPath()
  ctx.moveTo(16, 26)
  ctx.bezierCurveTo(18, 16, 34, 12, 50, 13)
  ctx.bezierCurveTo(58, 13, 63, 9, 70, 7)
  ctx.bezierCurveTo(80, 4, 90, 10, 92, 22)
  ctx.bezierCurveTo(94, 32, 92, 38, 90, 44)
  ctx.bezierCurveTo(92, 54, 94, 62, 96, 66)
  ctx.bezierCurveTo(98, 70, 94, 72, 91, 69)
  ctx.bezierCurveTo(89, 66, 88, 60, 86, 54)
  ctx.bezierCurveTo(85, 50, 84, 48, 83, 47)
  ctx.lineTo(80, 50)
  ctx.lineTo(79, 78)
  ctx.lineTo(70, 78)
  ctx.lineTo(69, 54)
  ctx.bezierCurveTo(64, 56, 60, 56, 58, 55)
  ctx.lineTo(57, 78)
  ctx.lineTo(49, 78)
  ctx.lineTo(49, 56)
  ctx.bezierCurveTo(44, 57, 40, 57, 36, 56)
  ctx.lineTo(35, 78)
  ctx.lineTo(27, 78)
  ctx.lineTo(26, 54)
  ctx.bezierCurveTo(22, 52, 18, 48, 17, 42)
  ctx.bezierCurveTo(16, 38, 15, 32, 16, 26)
  ctx.closePath()
  ctx.restore()
}

function elephantDetails(ctx: Ctx, x: number, y: number, s: number, flip: boolean) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(flip ? -s : s, s)
  ctx.beginPath()
  // ear
  ctx.moveTo(66, 15)
  ctx.bezierCurveTo(57, 20, 57, 39, 66, 45)
  ctx.bezierCurveTo(73, 41, 75, 26, 70, 17)
  // caparison outline with scalloped hem
  ctx.moveTo(31, 15)
  ctx.lineTo(59, 13.5)
  ctx.lineTo(61, 43)
  for (let k = 0; k <= 6; k++) {
    const xx = 61 - k * 4.6
    ctx.quadraticCurveTo(xx - 2.3, 48, xx - 4.6, 43)
  }
  ctx.lineTo(31, 15)
  // diamond lattice on the caparison
  for (let k = 0; k < 5; k++) {
    ctx.moveTo(33 + k * 6, 16)
    ctx.lineTo(39 + k * 6, 42)
    ctx.moveTo(57 - k * 6, 16)
    ctx.lineTo(51 - k * 6, 42)
  }
  // headdress, tusk, tail, trunk rings, anklets
  ctx.moveTo(72, 8)
  ctx.quadraticCurveTo(82, 14, 88, 26)
  ctx.moveTo(84, 46)
  ctx.quadraticCurveTo(88, 55, 95, 55)
  ctx.moveTo(16, 28)
  ctx.quadraticCurveTo(10, 40, 12, 52)
  for (const ty of [52, 57, 62]) {
    ctx.moveTo(87, ty)
    ctx.lineTo(92, ty - 1)
  }
  for (const [lx, lw] of [
    [26.5, 8.5],
    [35, 7.5],
    [49, 8],
    [69.5, 9],
  ]) {
    ctx.moveTo(lx, 72)
    ctx.lineTo(lx + lw, 72)
  }
  ctx.moveTo(81, 23.5)
  ctx.arc(80, 23.5, 1.4, 0, Math.PI * 2)
  ctx.restore()
}

function mandala(ctx: Ctx, cx: number, cy: number, r: number, rings: number) {
  for (let ring = rings; ring >= 1; ring--) {
    const rr = (r * ring) / rings
    const n = 8 + ring * 4
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + (ring % 2) * (Math.PI / n)
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(a)
      ctx.beginPath()
      ctx.moveTo(0, -rr * 0.36)
      ctx.quadraticCurveTo(rr * 0.24, -rr * 0.7, 0, -rr)
      ctx.quadraticCurveTo(-rr * 0.24, -rr * 0.7, 0, -rr * 0.36)
      ctx.fill()
      ctx.restore()
    }
  }
}

function leaf(ctx: Ctx, x: number, y: number, len: number, wid: number, a: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(a)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(wid, -len * 0.5, 0, -len)
  ctx.quadraticCurveTo(-wid, -len * 0.5, 0, 0)
  ctx.fill()
  ctx.restore()
}

/** A scrolling vine that fills a band: an S-curve with curls, leaves and buds. */
function vineBand(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, steps: number, amp: number, phase = 0) {
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  const dy = (y1 - y0) / steps
  const dx = (x1 - x0) / steps
  const pts: Array<[number, number, number]> = []
  for (let k = 0; k < steps; k++) {
    const sx = x0 + dx * k
    const sy = y0 + dy * k
    const side = (k + phase) % 2 ? 1 : -1
    ctx.bezierCurveTo(sx + side * amp, sy + dy * 0.3, sx + dx + side * amp, sy + dy * 0.7, sx + dx, sy + dy)
    pts.push([sx + side * amp * 0.75, sy + dy * 0.5, side])
  }
  ctx.stroke()
  for (const [px, py, side] of pts) {
    // a curl
    ctx.beginPath()
    ctx.arc(px + side * amp * 0.5, py, amp * 0.28, 0, Math.PI * 1.6 * side)
    ctx.stroke()
    leaf(ctx, px, py, amp * 0.9, amp * 0.3, side * 0.9)
    leaf(ctx, px, py, amp * 0.7, amp * 0.25, side * 2.2)
  }
}

function cuspedArch(ctx: Ctx, x0: number, x1: number, ySpring: number, yTop: number, yBottom: number, lobes = 7) {
  const span = x1 - x0
  const amp = (span / lobes) * 0.28
  ctx.moveTo(x0, yBottom)
  ctx.lineTo(x0, ySpring)
  const steps = lobes * 16
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const bx = x0 + span * t
    const by = ySpring - (ySpring - yTop) * (1 - Math.pow(Math.abs(2 * t - 1), 1.6))
    const lobe = Math.sin(Math.PI * ((t * lobes) % 1))
    ctx.lineTo(bx, by - amp * Math.pow(lobe, 0.7))
  }
  ctx.lineTo(x1, yBottom)
  ctx.closePath()
}

function beads(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, r: number, step: number) {
  const len = Math.hypot(x1 - x0, y1 - y0)
  const n = Math.floor(len / step)
  for (let k = 0; k <= n; k++) {
    const t = k / n
    ctx.beginPath()
    ctx.arc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

export interface DoorArt {
  height: HTMLCanvasElement
  gold: HTMLCanvasElement
  groove: HTMLCanvasElement
}

export function drawDoorArt(w: number, h: number, flip: boolean): DoorArt {
  const hc = makeCanvas(w, h)
  const gc = makeCanvas(w, h)
  const dc = makeCanvas(w, h)
  const H = hc.getContext('2d')!
  const G = gc.getContext('2d')!
  const D = dc.getContext('2d')!
  for (const [ctx, bg] of [
    [H, g(0.2)],
    [G, '#000'],
    [D, '#000'],
  ] as const) {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    ctx.scale(w / DW, h / DH)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }
  H.globalCompositeOperation = 'lighten'
  G.fillStyle = '#fff'
  G.strokeStyle = '#fff'
  D.strokeStyle = '#fff'

  const stile = 44
  const railH = 44
  const rails = [0, 300, 1040, DH - railH]
  // frame
  H.fillStyle = g(0.74)
  H.fillRect(0, 0, stile, DH)
  H.fillRect(DW - stile, 0, stile, DH)
  for (const y of rails) H.fillRect(0, y, DW, railH)
  const panels: Array<[number, number, number, number]> = [
    [stile, railH, DW - stile, 300],
    [stile, 300 + railH, DW - stile, 1040],
    [stile, 1040 + railH, DW - stile, DH - railH],
  ]
  // ovolo moulding + a row of beads around each panel; gilt fillet inside it
  for (const [x0, y0, x1, y1] of panels) {
    H.strokeStyle = g(0.9)
    H.lineWidth = 12
    H.strokeRect(x0 + 7, y0 + 7, x1 - x0 - 14, y1 - y0 - 14)
    H.fillStyle = g(0.84)
    beads(H, x0 + 22, y0 + 22, x1 - 22, y0 + 22, 4.2, 13)
    beads(H, x0 + 22, y1 - 22, x1 - 22, y1 - 22, 4.2, 13)
    beads(H, x0 + 22, y0 + 22, x0 + 22, y1 - 22, 4.2, 13)
    beads(H, x1 - 22, y0 + 22, x1 - 22, y1 - 22, 4.2, 13)
    G.lineWidth = 2.6
    G.strokeRect(x0 + 13, y0 + 13, x1 - x0 - 26, y1 - y0 - 26)
  }
  // rosettes on the stiles between rails
  H.fillStyle = g(0.92)
  for (let y = 120; y < DH; y += 260) {
    for (const x of [stile / 2, DW - stile / 2]) {
      for (let k = 0; k < 8; k++) leaf(H, x, y, 15, 5, (k / 8) * Math.PI * 2)
    }
  }

  // ---- panel A: jali lattice of interlocking circles with quatrefoil flowers
  {
    const [x0, y0, x1, y1] = panels[0]
    H.save()
    H.beginPath()
    H.rect(x0 + 30, y0 + 30, x1 - x0 - 60, y1 - y0 - 60)
    H.clip()
    H.fillStyle = g(0.12) // pierced-looking deep ground
    H.globalCompositeOperation = 'source-over'
    H.fillRect(x0 + 30, y0 + 30, x1 - x0 - 60, y1 - y0 - 60)
    H.globalCompositeOperation = 'lighten'
    H.strokeStyle = g(0.72)
    H.lineWidth = 9
    const r = 34
    for (let y = y0 + 30; y < y1; y += r) {
      for (let x = x0 + 30; x < x1; x += r) {
        H.beginPath()
        H.arc(x, y, r, 0, Math.PI * 2)
        H.stroke()
      }
    }
    H.fillStyle = g(0.8)
    for (let y = y0 + 30 + r / 2; y < y1; y += r)
      for (let x = x0 + 30 + r / 2; x < x1; x += r) for (let k = 0; k < 4; k++) leaf(H, x, y, 9, 4, (k * Math.PI) / 2)
    H.restore()
  }

  // ---- panel B: cusped arch, mandala, vine field, elephant
  const [bx0, by0, bx1, by1] = panels[1]
  const cx = (bx0 + bx1) / 2
  const ax0 = bx0 + 30
  const ax1 = bx1 - 30
  const springY = by0 + 190
  const topY = by0 + 34
  {
    // spandrels above the arch: dense leaves
    H.fillStyle = g(0.55)
    for (let k = 0; k < 24; k++) {
      const side = k % 2 ? 1 : -1
      leaf(H, cx + side * (80 + (k % 6) * 22), by0 + 34 + (k % 4) * 30, 22, 7, side * (0.6 + (k % 3) * 0.7))
    }
    H.save()
    H.beginPath()
    cuspedArch(H, ax0, ax1, springY, topY, by1 - 30, 7)
    H.globalCompositeOperation = 'source-over'
    H.fillStyle = g(0.3)
    H.fill()
    H.clip()
    H.globalCompositeOperation = 'lighten'
    // the ground of the arch: two climbing vines filling the field
    H.strokeStyle = g(0.5)
    H.lineWidth = 6
    H.fillStyle = g(0.52)
    vineBand(H, ax0 + 46, by0 + 190, ax0 + 46, by1 - 60, 9, 34, 0)
    vineBand(H, ax1 - 46, by0 + 190, ax1 - 46, by1 - 60, 9, 34, 1)
    H.restore()
    H.lineWidth = 13
    H.strokeStyle = g(0.88)
    H.beginPath()
    cuspedArch(H, ax0, ax1, springY, topY, by1 - 30, 7)
    H.stroke()
    G.lineWidth = 2.6
    G.beginPath()
    cuspedArch(G, ax0 + 9, ax1 - 9, springY + 4, topY + 9, by1 - 39, 7)
    G.stroke()

    // the lotus mandala in the arch head, on a raised disc
    H.fillStyle = g(0.5)
    H.beginPath()
    H.arc(cx, by0 + 236, 112, 0, Math.PI * 2)
    H.fill()
    H.fillStyle = g(0.74)
    mandala(H, cx, by0 + 236, 108, 3)
    H.fillStyle = g(0.95)
    H.beginPath()
    H.arc(cx, by0 + 236, 24, 0, Math.PI * 2)
    H.fill()
    G.lineWidth = 2.4
    for (const rr of [24, 112]) {
      G.beginPath()
      G.arc(cx, by0 + 236, rr, 0, Math.PI * 2)
      G.stroke()
    }
    G.beginPath()
    G.arc(cx, by0 + 236, 12, 0, Math.PI * 2)
    G.fill()

    // the elephant on a beaded ledge, facing the doorway's centre
    const es = 3.55
    const ex = flip ? cx + 50 * es : cx - 50 * es
    const ey = by0 + 420
    H.fillStyle = g(0.8)
    elephant(H, ex, ey, es, flip)
    H.fill()
    H.fillStyle = g(0.9)
    H.fillRect(ax0 + 14, ey + 78 * es + 2, ax1 - ax0 - 28, 18)
    beads(H, ax0 + 24, ey + 78 * es + 30, ax1 - 24, ey + 78 * es + 30, 4.5, 14)
    G.lineWidth = 2.4
    elephant(G, ex, ey, es, flip)
    G.stroke()
    G.fillRect(ax0 + 14, ey + 78 * es + 2, ax1 - ax0 - 28, 3)
    D.lineWidth = 2.4
    elephantDetails(D, ex, ey, es, flip)
    D.stroke()
  }

  // ---- panel C: double lozenge, rosette, corner fans, leaf fillers
  {
    const [x0, y0, x1, y1] = panels[2]
    const ccx = (x0 + x1) / 2
    const ccy = (y0 + y1) / 2
    for (const [inset, lw, v] of [
      [34, 13, 0.84],
      [70, 8, 0.7],
    ] as const) {
      H.strokeStyle = g(v)
      H.lineWidth = lw
      H.beginPath()
      H.moveTo(ccx, y0 + inset)
      H.lineTo(x1 - inset, ccy)
      H.lineTo(ccx, y1 - inset)
      H.lineTo(x0 + inset, ccy)
      H.closePath()
      H.stroke()
    }
    G.lineWidth = 2.6
    G.beginPath()
    G.moveTo(ccx, y0 + 34)
    G.lineTo(x1 - 34, ccy)
    G.lineTo(ccx, y1 - 34)
    G.lineTo(x0 + 34, ccy)
    G.closePath()
    G.stroke()
    H.fillStyle = g(0.76)
    mandala(H, ccx, ccy, 92, 2)
    H.fillStyle = g(0.95)
    H.beginPath()
    H.arc(ccx, ccy, 18, 0, Math.PI * 2)
    H.fill()
    G.beginPath()
    G.arc(ccx, ccy, 10, 0, Math.PI * 2)
    G.fill()
    H.fillStyle = g(0.62)
    for (const [fx, fy, a] of [
      [x0 + 26, y0 + 26, 0],
      [x1 - 26, y0 + 26, Math.PI / 2],
      [x1 - 26, y1 - 26, Math.PI],
      [x0 + 26, y1 - 26, -Math.PI / 2],
    ] as const) {
      for (let k = 0; k < 6; k++) leaf(H, fx, fy, 46, 9, a + Math.PI / 2 + (k / 5) * (Math.PI / 2))
    }
  }

  // brass bosses on the rails
  for (const y of rails) {
    for (const x of [stile / 2, DW / 2, DW - stile / 2]) {
      const by = y + railH / 2
      H.fillStyle = g(1)
      H.beginPath()
      H.arc(x, by, 14, 0, Math.PI * 2)
      H.fill()
      G.beginPath()
      G.arc(x, by, 15, 0, Math.PI * 2)
      G.fill()
    }
  }
  return { height: hc, gold: gc, groove: dc }
}
