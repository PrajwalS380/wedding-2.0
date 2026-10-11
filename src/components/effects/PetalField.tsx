import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export interface PetalFieldHandle {
  /** A burst of gold sparks at a point (in % of the canvas). */
  sparkle: (xPct: number, yPct: number, count?: number) => void
  /** 0..1 — petals rush outward past the viewer, as when the camera moves forward. */
  setRush: (value: number) => void
}

interface Props {
  /** Petals on screen at once (scaled down on small screens). */
  petals?: number
  /** Golden dust motes drifting in the light. */
  motes?: number
  /** Focal point (in %) that a camera rush moves away from. */
  focus?: { x: number; y: number }
  className?: string
}

interface Petal {
  x: number
  y: number
  z: number // 0.5 (far) .. 1.6 (near): size and speed
  vx: number
  vy: number
  rot: number
  spin: number
  flip: number
  flipSpeed: number
  sprite: number
}
interface Mote {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  tw: number
}
interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  r: number
}

/** Pre-rendered rose-petal sprites (a few shades, so no two drifts look identical). */
function makeSprites(): HTMLCanvasElement[] {
  const shades: Array<[string, string, string]> = [
    ['#ffd3de', '#f07a9b', '#b8325a'],
    ['#ffc7d4', '#e8638a', '#a82450'],
    ['#ffe0e6', '#f58fab', '#c84a6f'],
    ['#ffcfd9', '#ea5d86', '#9e1f47'],
  ]
  return shades.map(([light, mid, deep]) => {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 64
    const g = c.getContext('2d')!
    g.translate(32, 32)
    // a soft, slightly asymmetric heart-shaped rose petal
    const path = new Path2D('M0 -24 C 14 -26 24 -12 20 4 C 17 16 7 24 0 27 C -8 24 -18 15 -20 2 C -23 -13 -13 -25 0 -24 Z')
    const grad = g.createRadialGradient(-4, -10, 2, 0, 6, 30)
    grad.addColorStop(0, light)
    grad.addColorStop(0.45, mid)
    grad.addColorStop(1, deep)
    g.fillStyle = grad
    g.fill(path)
    // a soft crease and a sheen along the edge
    g.strokeStyle = 'rgba(255,255,255,0.28)'
    g.lineWidth = 1.2
    g.beginPath()
    g.moveTo(0, 22)
    g.quadraticCurveTo(-3, 2, 2, -18)
    g.stroke()
    g.globalCompositeOperation = 'source-atop'
    const sheen = g.createLinearGradient(-20, -20, 20, 20)
    sheen.addColorStop(0, 'rgba(255,255,255,0.35)')
    sheen.addColorStop(0.5, 'rgba(255,255,255,0)')
    g.fillStyle = sheen
    g.fill(path)
    return c
  })
}

/**
 * Drifting rose petals, golden motes and sparks on one canvas. It renders only
 * while the canvas is on screen and the tab is visible, caps its pixel ratio,
 * and does nothing at all for visitors who prefer reduced motion.
 */
export const PetalField = forwardRef<PetalFieldHandle, Props>(function PetalField(
  { petals = 18, motes = 26, focus = { x: 50, y: 30 }, className = '' },
  ref,
) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const api = useRef<PetalFieldHandle>({ sparkle: () => {}, setRush: () => {} })

  useImperativeHandle(ref, () => ({
    sparkle: (x, y, n) => api.current.sparkle(x, y, n),
    setRush: (v) => api.current.setRush(v),
  }))

  useEffect(() => {
    const el = canvas.current
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const ctx = el.getContext('2d')
    if (!ctx) return
    const sprites = makeSprites()
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let w = 0
    let h = 0
    let raf = 0
    let last = performance.now()
    let visible = true
    let rush = 0
    const rand = (a: number, b: number) => a + Math.random() * (b - a)

    const resize = () => {
      const r = el.getBoundingClientRect()
      w = Math.max(1, r.width)
      h = Math.max(1, r.height)
      el.width = Math.round(w * dpr)
      el.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const area = () => Math.min(1, (w * h) / (900 * 1100))
    const petalCount = Math.max(6, Math.round(petals * (0.55 + 0.45 * area())))
    const spawnPetal = (initial: boolean): Petal => {
      const z = rand(0.55, 1.5)
      return {
        x: rand(-0.1, 1.1) * w,
        y: initial ? rand(-0.1, 1) * h : rand(-0.25, -0.05) * h,
        z,
        vx: rand(6, 22) * z,
        vy: rand(16, 34) * z,
        rot: rand(0, Math.PI * 2),
        spin: rand(-0.9, 0.9),
        flip: rand(0, Math.PI * 2),
        flipSpeed: rand(0.8, 2.2),
        sprite: Math.floor(rand(0, sprites.length)),
      }
    }
    const list: Petal[] = Array.from({ length: petalCount }, () => spawnPetal(true))
    const dust: Mote[] = Array.from({ length: motes }, () => ({
      x: rand(0.2, 0.8),
      y: rand(0.05, 0.75),
      r: rand(0.6, 1.8),
      vx: rand(-0.004, 0.004),
      vy: rand(-0.012, -0.003),
      tw: rand(0, Math.PI * 2),
    }))
    const sparks: Spark[] = []

    api.current = {
      sparkle: (xp, yp, n = 26) => {
        for (let i = 0; i < n; i++) {
          const a = rand(0, Math.PI * 2)
          const s = rand(30, 140)
          sparks.push({ x: (xp / 100) * w, y: (yp / 100) * h, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: 0, max: rand(0.6, 1.3), r: rand(0.8, 2.2) })
        }
        if (!raf) loop(performance.now())
      },
      setRush: (v) => {
        rush = Math.max(0, Math.min(1, v))
      },
    }

    const fx = () => (focus.x / 100) * w
    const fy = () => (focus.y / 100) * h

    function frame(dt: number) {
      ctx!.clearRect(0, 0, w, h)
      const cx = fx()
      const cy = fy()

      // golden motes in the light
      ctx!.globalCompositeOperation = 'lighter'
      for (const m of dust) {
        m.tw += dt * 1.6
        m.x += m.vx * dt
        m.y += m.vy * dt
        if (m.y < -0.02) {
          m.y = 0.8
          m.x = rand(0.2, 0.8)
        }
        let px = m.x * w
        let py = m.y * h
        if (rush > 0) {
          const k = 1 + rush * 2.2
          px = cx + (px - cx) * k
          py = cy + (py - cy) * k
        }
        const a = (0.35 + 0.35 * Math.sin(m.tw)) * (1 - rush * 0.6)
        ctx!.fillStyle = `rgba(255, 226, 160, ${a.toFixed(3)})`
        ctx!.beginPath()
        ctx!.arc(px, py, m.r * (1 + rush), 0, Math.PI * 2)
        ctx!.fill()
      }

      // sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.life += dt
        if (s.life >= s.max) {
          sparks.splice(i, 1)
          continue
        }
        s.vy += 60 * dt
        s.vx *= 0.97
        s.x += s.vx * dt
        s.y += s.vy * dt
        const a = 1 - s.life / s.max
        const g = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4)
        g.addColorStop(0, `rgba(255, 244, 205, ${a})`)
        g.addColorStop(1, 'rgba(255, 190, 90, 0)')
        ctx!.fillStyle = g
        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalCompositeOperation = 'source-over'

      // petals
      for (let i = 0; i < list.length; i++) {
        const p = list[i]
        const wind = Math.sin(p.flip * 0.5 + p.y * 0.004) * 10
        p.x += (p.vx + wind) * dt
        p.y += p.vy * dt
        if (rush > 0) {
          // stream outward from the focal point and grow, as if the camera moves through them
          const dx = p.x - cx
          const dy = p.y - cy
          const speed = rush * rush * 3.2
          p.x += dx * speed * dt
          p.y += dy * speed * dt
          p.z = Math.min(p.z * (1 + rush * 1.4 * dt), 4)
        }
        p.rot += p.spin * dt
        p.flip += p.flipSpeed * dt
        if (p.y > h + 40 || p.x > w + 60 || p.x < -60 || p.y < -h * 0.4) {
          list[i] = spawnPetal(false)
          continue
        }
        const size = 15 * p.z
        const sx = Math.cos(p.flip) // tumbling: the petal's apparent width
        ctx!.save()
        ctx!.translate(p.x, p.y)
        ctx!.rotate(p.rot)
        ctx!.scale(Math.max(0.15, Math.abs(sx)), 1)
        ctx!.globalAlpha = Math.min(1, 0.55 + p.z * 0.3)
        ctx!.drawImage(sprites[p.sprite], -size / 2, -size / 2, size, size)
        ctx!.restore()
      }
    }

    function loop(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      frame(dt)
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !raf && !document.hidden) {
        last = performance.now()
        raf = requestAnimationFrame(loop)
      }
    })
    io.observe(el)
    const onVis = () => {
      if (!document.hidden && visible && !raf) {
        last = performance.now()
        raf = requestAnimationFrame(loop)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      raf = 0
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      api.current = { sparkle: () => {}, setRush: () => {} }
    }
  }, [petals, motes, focus.x, focus.y])

  return <canvas ref={canvas} className={className} aria-hidden="true" />
})
