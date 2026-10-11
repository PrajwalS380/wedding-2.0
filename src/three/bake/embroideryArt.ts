/**
 * Gold-thread embroidery for the front of the velvet envelope (pocket + flap
 * share one texture so the pattern runs across the closed flap), drawn in a
 * 1024 × 672 design space. White = thread. The flap's V edge follows
 * ENVELOPE_V so the 3D flap mesh can be cut along the same curve.
 */
import { makeCanvas } from './canvas'

export const EMB_W = 1024
export const EMB_H = 672
/** Flap V: from the top corners, slightly convex, to the apex (fractions, y down). */
export const ENVELOPE_V = { apexX: 0.5, apexY: 0.56, bulge: 0.06 }

type Ctx = CanvasRenderingContext2D

/** Point on the flap's (curved) left edge at t ∈ [0, 1] — design pixels. */
export function flapEdge(t: number, side: -1 | 1): [number, number] {
  const { apexX, apexY, bulge } = ENVELOPE_V
  const x0 = side < 0 ? 0 : EMB_W
  const y0 = 0
  const x1 = apexX * EMB_W
  const y1 = apexY * EMB_H
  // quadratic with the control point below the chord: the flap bows gently outward
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2 + bulge * EMB_H * 1.6
  const u = 1 - t
  return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]
}

function leaf(ctx: Ctx, x: number, y: number, len: number, wid: number, a: number, fill = true) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(a)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(wid, -len * 0.5, 0, -len)
  ctx.quadraticCurveTo(-wid, -len * 0.5, 0, 0)
  if (fill) ctx.fill()
  else ctx.stroke()
  // midrib
  ctx.beginPath()
  ctx.moveTo(0, -len * 0.1)
  ctx.lineTo(0, -len * 0.85)
  ctx.stroke()
  ctx.restore()
}

function blossom(ctx: Ctx, x: number, y: number, r: number, petals = 5) {
  ctx.save()
  ctx.translate(x, y)
  for (let k = 0; k < petals; k++) {
    ctx.rotate((Math.PI * 2) / petals)
    ctx.beginPath()
    ctx.ellipse(0, -r * 0.9, r * 0.45, r * 0.9, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** A long curling tendril with leaves, buds and blossoms (grows from x,y along angle). */
function tendril(ctx: Ctx, x: number, y: number, a: number, scale: number, mirror: boolean) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(a)
  ctx.scale(mirror ? -scale : scale, scale)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(50, -18, 90, 30, 140, 12)
  ctx.bezierCurveTo(180, -2, 190, -46, 162, -58)
  ctx.bezierCurveTo(142, -66, 128, -44, 146, -34)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(78, 12)
  ctx.bezierCurveTo(80, 50, 112, 64, 126, 46)
  ctx.bezierCurveTo(132, 36, 122, 28, 114, 36)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(36, -6)
  ctx.bezierCurveTo(30, -36, 54, -56, 70, -44)
  ctx.stroke()
  const L: Array<[number, number, number, number]> = [
    [20, -8, 22, -0.9],
    [52, 4, 24, 0.7],
    [100, 22, 24, -0.5],
    [124, 16, 20, 1.2],
    [150, 6, 18, -0.3],
    [96, 48, 20, 2.5],
    [58, -36, 18, -1.9],
  ]
  for (const [lx, ly, len, la] of L) leaf(ctx, lx, ly, len, len * 0.32, la)
  blossom(ctx, 118, -12, 13)
  blossom(ctx, 70, -50, 9)
  for (const [bx, by] of [
    [168, -18],
    [40, 28],
  ]) {
    ctx.beginPath()
    ctx.ellipse(bx, by, 4, 7, 0.4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function lotus(ctx: Ctx, x: number, y: number, s: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  const petal = (a: number, len: number, wid: number) => {
    ctx.save()
    ctx.rotate(a)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(wid, -len * 0.55, 0, -len)
    ctx.quadraticCurveTo(-wid, -len * 0.55, 0, 0)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, -len * 0.15)
    ctx.quadraticCurveTo(wid * 0.35, -len * 0.55, 0, -len * 0.8)
    ctx.stroke()
    ctx.restore()
  }
  petal(0, 52, 16)
  petal(-0.5, 44, 14)
  petal(0.5, 44, 14)
  petal(-1.0, 34, 12)
  petal(1.0, 34, 12)
  petal(-1.45, 24, 9)
  petal(1.45, 24, 9)
  ctx.beginPath()
  ctx.moveTo(-40, 4)
  ctx.quadraticCurveTo(0, 16, 40, 4)
  ctx.stroke()
  ctx.restore()
}

export function drawEmbroidery(w: number, h: number): HTMLCanvasElement {
  const c = makeCanvas(w, h)
  const m = c.getContext('2d')!
  m.fillStyle = '#000'
  m.fillRect(0, 0, w, h)
  m.scale(w / EMB_W, h / EMB_H)
  m.strokeStyle = '#fff'
  m.fillStyle = '#fff'
  m.lineCap = 'round'
  m.lineJoin = 'round'
  const W = EMB_W
  const H = EMB_H
  const { apexX, apexY } = ENVELOPE_V

  // ---- couched gold cord: border and the flap's V
  m.lineWidth = 6
  m.strokeRect(16, 16, W - 32, H - 32)
  m.lineWidth = 2
  m.strokeRect(28, 28, W - 56, H - 56)
  m.lineWidth = 10
  for (const side of [-1, 1] as const) {
    m.beginPath()
    for (let i = 0; i <= 40; i++) {
      const [x, y] = flapEdge(i / 40, side)
      if (i === 0) m.moveTo(x, y)
      else m.lineTo(x, y)
    }
    m.stroke()
  }
  // a row of tiny leaves just inside the V cord
  m.lineWidth = 2.4
  for (const side of [-1, 1] as const) {
    for (let i = 2; i < 18; i++) {
      const t = i / 19
      const [x, y] = flapEdge(t, side)
      const [x2, y2] = flapEdge(t + 0.01, side)
      const ang = Math.atan2(y2 - y, x2 - x)
      leaf(m, x - side * 0 + Math.sin(ang) * 14 * (side < 0 ? 1 : -1), y - Math.cos(ang) * 14 * (side < 0 ? 1 : -1), 16, 5, ang + (side < 0 ? -0.6 : Math.PI + 0.6))
    }
  }
  // the lower fold lines of the pocket
  m.lineWidth = 3
  m.beginPath()
  m.moveTo(apexX * W - 34, apexY * H + 18)
  m.lineTo(34, H - 34)
  m.moveTo(apexX * W + 34, apexY * H + 18)
  m.lineTo(W - 34, H - 34)
  m.stroke()

  // ---- the flap: lotus crown and tendrils toward the corners
  m.lineWidth = 3.4
  lotus(m, apexX * W, H * 0.28, 1.35)
  m.lineWidth = 3
  tendril(m, W * 0.5 - 52, H * 0.29, Math.PI + 0.18, 1.15, true)
  tendril(m, W * 0.5 + 52, H * 0.29, -0.18, 1.15, false)
  tendril(m, 70, 70, 0.32, 0.95, false)
  tendril(m, W - 70, 70, Math.PI - 0.32, 0.95, true)

  // ---- the pocket: rising corner vines and side vines
  m.lineWidth = 3.4
  tendril(m, 50, H - 60, -0.95, 1.55, false)
  tendril(m, W - 50, H - 60, -Math.PI + 0.95, 1.55, true)
  tendril(m, 54, H * 0.48, -0.25, 1.05, false)
  tendril(m, W - 54, H * 0.48, Math.PI + 0.25, 1.05, true)
  // a garland along the hem
  m.lineWidth = 3
  m.beginPath()
  m.moveTo(150, H - 62)
  for (let k = 0; k < 9; k++) {
    const x = 150 + k * 80.5
    m.quadraticCurveTo(x + 40, H - (k % 2 ? 42 : 86), x + 80.5, H - 62)
  }
  m.stroke()
  for (let k = 0; k < 18; k++) {
    leaf(m, 160 + k * 40, H - 62 + (k % 2 ? -12 : 12), 15, 5, k % 2 ? 0.7 : 2.5)
  }
  for (let k = 0; k < 9; k++) blossom(m, 190 + k * 80.5, H - (k % 2 ? 50 : 76), 7)
  // scattered sequins
  for (let k = 0; k < 70; k++) {
    const x = 60 + ((k * 137) % (W - 120))
    const y = 60 + ((k * 89) % (H - 120))
    m.beginPath()
    m.arc(x, y, 2.4, 0, Math.PI * 2)
    m.fill()
  }
  return c
}
