/**
 * A choreographed fireworks show for the closing scene, drawn on two transparent
 * canvases: the sky (rockets, bursts, burst smoke — masked so falling sparks
 * sink behind the palace) and the ground (coloured smoke fountains rising in
 * front of it). Canvas 2D with pre-rendered glow and smoke sprites: no library,
 * no WebGL, and nothing runs once the show has finished.
 *
 * Physics per spark: gravity and air drag, a white-hot flash that cools through
 * the shell's colour to a dull ember, a short trail of past positions. Shell
 * types: peony, chrysanthemum (glittering trails), willow (long drooping gold),
 * ring, crossette (stars that split) and crackle (sparks that pop).
 */

type RGB = readonly [number, number, number]

export const COLOURS = {
  gold: [255, 196, 86],
  rose: [255, 92, 156],
  emerald: [64, 232, 152],
  violet: [178, 118, 255],
  white: [255, 244, 222],
  saffron: [255, 150, 44],
  azure: [96, 184, 255],
  ruby: [255, 64, 76],
} as const satisfies Record<string, RGB>
export type ColourName = keyof typeof COLOURS

type ShellType = 'peony' | 'chrysanthemum' | 'willow' | 'ring' | 'crossette' | 'crackle'
interface Shell {
  type: ShellType
  colour: ColourName
  /** Second colour (peony / chrysanthemum stars change colour half-way). */
  colour2?: ColourName
  size: number
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
  colour: ColourName
  colour2?: ColourName
  size: number
  drag: number
  gravity: number
  trail: number[]
  trailLen: number
  /** 1 sheds glittering embers, 2 splits (crossette), 3 pops (crackle) */
  kind: 0 | 1 | 2 | 3
  timer: number
  flicker: number
}

interface Rocket {
  x0: number
  y0: number
  x1: number
  y1: number
  t: number
  dur: number
  shell: Shell
  emit: number
  wobble: number
}

interface Puff {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  grow: number
  age: number
  life: number
  alpha: number
  sprite: HTMLCanvasElement
  phase: number
  ground: boolean
}

interface Fountain {
  x: number
  y: number
  colours: ColourName[]
  start: number
  end: number
  acc: number
  dir: number
}

export interface FireworksOptions {
  sky: HTMLCanvasElement
  ground: HTMLCanvasElement
  /** A burst lights the scene: position in CSS px, colour, strength 0..1. */
  onFlash?: (x: number, y: number, colour: RGB, strength: number) => void
  onDone?: () => void
}

// ------------------------------------------------------------------ sprites
const glowCache = new Map<string, HTMLCanvasElement>()
function glow(c: RGB, hot = false): HTMLCanvasElement {
  const key = `${c.join(',')}${hot ? 'h' : ''}`
  let s = glowCache.get(key)
  if (s) return s
  s = document.createElement('canvas')
  s.width = s.height = 64
  const g = s.getContext('2d')!
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, `rgba(255,255,255,1)`)
  grad.addColorStop(hot ? 0.3 : 0.12, `rgba(${c[0]},${c[1]},${c[2]},1)`)
  grad.addColorStop(0.35, `rgba(${c[0]},${c[1]},${c[2]},0.35)`)
  grad.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  glowCache.set(key, s)
  return s
}

const puffCache = new Map<string, HTMLCanvasElement[]>()
/**
 * Billowy smoke: dozens of soft blobs at several scales (big body, small curls),
 * then lit from above — a brighter crown and a shadowed underside. Four variants
 * per colour.
 */
function puffs(c: RGB): HTMLCanvasElement[] {
  const key = c.join(',')
  let list = puffCache.get(key)
  if (list) return list
  list = []
  for (let v = 0; v < 4; v++) {
    const S = 192
    const s = document.createElement('canvas')
    s.width = s.height = S
    const g = s.getContext('2d')!
    let seed = (v + 1) * 9301 + c[0] * 7 + c[1] * 3 + c[2]
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const blob = (x: number, y: number, r: number, a: number) => {
      const grad = g.createRadialGradient(x, y, 0, x, y, r)
      grad.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a})`)
      grad.addColorStop(0.6, `rgba(${c[0]},${c[1]},${c[2]},${a * 0.45})`)
      grad.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`)
      g.fillStyle = grad
      g.beginPath()
      g.arc(x, y, r, 0, Math.PI * 2)
      g.fill()
    }
    for (let k = 0; k < 10; k++) {
      const a = rand() * Math.PI * 2
      const d = rand() * 36
      blob(96 + Math.cos(a) * d, 96 + Math.sin(a) * d, 34 + rand() * 26, 0.16)
    }
    for (let k = 0; k < 46; k++) {
      const a = rand() * Math.PI * 2
      const d = Math.sqrt(rand()) * 62
      blob(96 + Math.cos(a) * d, 96 + Math.sin(a) * d * 0.9, 8 + rand() * 16, 0.12 + rand() * 0.12)
    }
    // light from above: a brighter crown, a shadowed underside
    g.globalCompositeOperation = 'source-atop'
    const shade = g.createLinearGradient(0, 30, 0, 170)
    shade.addColorStop(0, 'rgba(255,248,236,0.28)')
    shade.addColorStop(0.5, 'rgba(255,255,255,0)')
    shade.addColorStop(1, 'rgba(20,10,30,0.35)')
    g.fillStyle = shade
    g.fillRect(0, 0, S, S)
    g.globalCompositeOperation = 'source-over'
    list.push(s)
  }
  puffCache.set(key, list)
  return list
}

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t].map(Math.round) as unknown as RGB
const EMBER: RGB = [255, 96, 36]
const SMOKE_GREY: RGB = [150, 140, 160]

// ------------------------------------------------------------------ the show
export class FireworksShow {
  private sparks: Spark[] = []
  private rockets: Rocket[] = []
  private puffs: Puff[] = []
  private fountains: Fountain[] = []
  private flashes: Array<{ x: number; y: number; c: RGB; age: number; size: number }> = []
  private cues: Array<{ t: number; run: () => void }> = []
  private time = 0
  private last = 0
  private raf = 0
  private w = 0
  private h = 0
  private unit = 1
  private dpr = 1
  private sky: CanvasRenderingContext2D
  private ground: CanvasRenderingContext2D
  private opts: FireworksOptions
  running = false

  constructor(opts: FireworksOptions) {
    this.opts = opts
    this.sky = opts.sky.getContext('2d')!
    this.ground = opts.ground.getContext('2d')!
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w
    this.h = h
    this.dpr = dpr
    this.unit = Math.min(w, h * 1.2) / 800
    for (const c of [this.opts.sky, this.opts.ground]) {
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
    }
  }

  play(layout: { horizon: number }) {
    this.stop()
    this.sparks = []
    this.rockets = []
    this.puffs = []
    this.fountains = []
    this.flashes = []
    this.time = 0
    this.cues = choreography(this, layout.horizon)
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  /** Development: freeze the loop and advance the show by fixed 1/60 s steps to `seconds`. */
  seekTo(seconds: number) {
    cancelAnimationFrame(this.raf)
    while (this.time < seconds) {
      this.time += 1 / 60
      while (this.cues.length && this.cues[0].t <= this.time) this.cues.shift()!.run()
      this.update(1 / 60)
    }
    this.draw()
  }

  stop() {
    cancelAnimationFrame(this.raf)
    this.running = false
    this.sky.setTransform(1, 0, 0, 1, 0, 0)
    this.sky.clearRect(0, 0, this.opts.sky.width, this.opts.sky.height)
    this.ground.setTransform(1, 0, 0, 1, 0, 0)
    this.ground.clearRect(0, 0, this.opts.ground.width, this.opts.ground.height)
  }

  // ---- launching
  launch(fx: number, fy: number, shell: Shell, fromX = fx + (Math.random() - 0.5) * 0.08, horizon = 0.62) {
    this.rockets.push({ x0: fromX * this.w, y0: horizon * this.h, x1: fx * this.w, y1: fy * this.h, t: 0, dur: 0.95 + Math.random() * 0.35, shell, emit: 0, wobble: Math.random() * 6 })
  }

  fountain(fx: number, fy: number, colours: ColourName[], start: number, dur: number, dir: number) {
    this.fountains.push({ x: fx * this.w, y: fy * this.h, colours, start, end: start + dur, acc: 0, dir })
  }

  private burst(x: number, y: number, shell: Shell) {
    const u = this.unit
    const n = Math.round((shell.type === 'willow' ? 110 : shell.type === 'crossette' ? 18 : shell.type === 'ring' ? 90 : 190) * shell.size)
    const speed = (shell.type === 'willow' ? 3.4 : shell.type === 'crossette' ? 3.6 : 4.9) * shell.size * u
    for (let i = 0; i < n; i++) {
      let dx: number
      let dy: number
      if (shell.type === 'ring') {
        const a = (i / n) * Math.PI * 2
        dx = Math.cos(a)
        dy = Math.sin(a) * 0.42
      } else {
        // a sphere of stars seen from the ground: denser toward the centre
        const z = Math.random() * 2 - 1
        const a = Math.random() * Math.PI * 2
        const r = Math.sqrt(1 - z * z)
        dx = Math.cos(a) * r
        dy = Math.sin(a) * r
      }
      const v = speed * (0.9 + Math.random() * 0.2)
      const willow = shell.type === 'willow'
      this.sparks.push({
        x,
        y,
        vx: dx * v,
        vy: dy * v - 0.4 * u,
        age: 0,
        life: willow ? 3.2 + Math.random() * 0.9 : 1.5 + Math.random() * 0.7,
        colour: shell.colour,
        colour2: shell.colour2,
        size: (willow ? 3.4 : 4.4) * u * (0.85 + Math.random() * 0.3),
        drag: willow ? 0.955 : 0.972,
        gravity: (willow ? 0.024 : 0.034) * u,
        trail: [],
        trailLen: willow ? 12 : shell.type === 'crossette' ? 5 : 4,
        kind: shell.type === 'chrysanthemum' ? 1 : shell.type === 'crossette' ? 2 : shell.type === 'crackle' ? 3 : 0,
        timer: shell.type === 'crackle' ? 0.5 + Math.random() * 0.9 : shell.type === 'crossette' ? 0.55 + Math.random() * 0.1 : 0,
        flicker: Math.random() * 10,
      })
    }
    // the burst's own smoke, tinted by its light
    const tint = mix(COLOURS[shell.colour], SMOKE_GREY, 0.62)
    const sprites = puffs(tint)
    for (let k = 0; k < 16; k++) {
      const a = Math.random() * Math.PI * 2
      const d = Math.random() * 110 * u * shell.size
      this.puffs.push({
        x: x + Math.cos(a) * d,
        y: y + Math.sin(a) * d,
        vx: (0.12 + Math.random() * 0.1) * u,
        vy: -0.03 * u,
        r: 46 * u,
        grow: 0.5 * u,
        age: 0,
        life: 5 + Math.random() * 3,
        alpha: 0.3,
        sprite: sprites[k % 4],
        phase: Math.random() * 6,
        ground: false,
      })
    }
    this.flashes.push({ x, y, c: COLOURS[shell.colour], age: 0, size: 90 * u * shell.size })
    this.opts.onFlash?.(x, y, COLOURS[shell.colour], Math.min(1, 0.5 + shell.size * 0.4))
  }

  // ---- the frame loop
  private frame = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.time += dt
    while (this.cues.length && this.cues[0].t <= this.time) this.cues.shift()!.run()
    this.update(dt)
    this.draw()
    const busy = this.cues.length || this.flashes.length || this.sparks.length || this.rockets.length || this.fountains.some((f) => this.time < f.end) || this.puffs.length
    if (busy) this.raf = requestAnimationFrame(this.frame)
    else {
      this.running = false
      this.opts.onDone?.()
    }
  }

  private update(dt: number) {
    const f = dt * 60
    const u = this.unit
    // rockets: an eased climb with a little wobble, shedding sparks and a smoke wisp
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i]
      r.t += dt
      const k = Math.min(1, r.t / r.dur)
      const e = 1 - (1 - k) * (1 - k)
      const x = r.x0 + (r.x1 - r.x0) * e + Math.sin(r.t * 18 + r.wobble) * 1.2 * u
      const y = r.y0 + (r.y1 - r.y0) * e
      r.emit += dt
      while (r.emit > 0.016) {
        r.emit -= 0.016
        this.sparks.push({ x, y, vx: (Math.random() - 0.5) * 0.6 * u, vy: (0.4 + Math.random() * 0.6) * u, age: 0, life: 0.35 + Math.random() * 0.25, colour: 'gold', size: 1.6 * u, drag: 0.94, gravity: 0.03 * u, trail: [], trailLen: 0, kind: 0, timer: 0, flicker: Math.random() * 10 })
      }
      if (Math.random() < f * 0.35) {
        this.puffs.push({ x, y, vx: 0.05 * u, vy: 0.05 * u, r: 6 * u, grow: 0.22 * u, age: 0, life: 2.2, alpha: 0.14, sprite: puffs(SMOKE_GREY)[Math.floor(Math.random() * 4)], phase: Math.random() * 6, ground: false })
      }
      if (k >= 1) {
        this.rockets.splice(i, 1)
        this.burst(x, y, r.shell)
      }
    }
    // sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i]
      s.age += dt
      if (s.age >= s.life) {
        this.sparks.splice(i, 1)
        continue
      }
      if (s.trailLen) {
        s.trail.push(s.x, s.y)
        if (s.trail.length > s.trailLen * 2) s.trail.splice(0, 2)
      }
      const drag = Math.pow(s.drag, f)
      s.vx *= drag
      s.vy = s.vy * drag + s.gravity * f
      s.x += s.vx * f
      s.y += s.vy * f
      if (s.kind === 1 && Math.random() < f * 0.25) {
        this.sparks.push({ x: s.x, y: s.y, vx: 0, vy: 0.2 * u, age: 0, life: 0.45, colour: 'gold', size: 1.3 * u, drag: 0.9, gravity: 0.02 * u, trail: [], trailLen: 0, kind: 0, timer: 0, flicker: Math.random() * 10 })
      }
      if ((s.kind === 2 || s.kind === 3) && s.age >= s.timer) {
        this.sparks.splice(i, 1)
        const pieces = s.kind === 2 ? 4 : 3
        const rot = Math.random() * Math.PI
        for (let k = 0; k < pieces; k++) {
          const a = rot + (k / pieces) * Math.PI * 2
          const v = (s.kind === 2 ? 2.4 : 1.2) * u
          this.sparks.push({ x: s.x, y: s.y, vx: Math.cos(a) * v + s.vx * 0.3, vy: Math.sin(a) * v + s.vy * 0.3, age: 0, life: s.kind === 2 ? 0.9 : 0.25, colour: s.kind === 2 ? s.colour : 'white', size: (s.kind === 2 ? 3.2 : 3.4) * u, drag: 0.95, gravity: 0.03 * u, trail: [], trailLen: s.kind === 2 ? 4 : 0, kind: 0, timer: 0, flicker: Math.random() * 10 })
        }
      }
    }
    // coloured smoke fountains
    for (const fo of this.fountains) {
      if (this.time < fo.start || this.time > fo.end) continue
      fo.acc += dt
      while (fo.acc > 0.05) {
        fo.acc -= 0.05
        const c = COLOURS[fo.colours[Math.floor(Math.random() * fo.colours.length)]]
        this.puffs.push({
          x: fo.x + (Math.random() - 0.5) * 24 * u,
          y: fo.y,
          vx: (fo.dir * (0.5 + Math.random() * 1.2) + (Math.random() - 0.5) * 0.8) * u,
          vy: -(0.9 + Math.random() * 1.3) * u,
          r: 18 * u,
          grow: (0.9 + Math.random() * 0.6) * u,
          age: 0,
          life: 3.6 + Math.random() * 2.4,
          alpha: 0.48,
          sprite: puffs(c)[Math.floor(Math.random() * 4)],
          phase: Math.random() * 6,
          ground: true,
        })
      }
    }
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      this.flashes[i].age += dt
      if (this.flashes[i].age > 0.22) this.flashes.splice(i, 1)
    }
    // smoke drifts, billows and thins
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i]
      p.age += dt
      if (p.age >= p.life) {
        this.puffs.splice(i, 1)
        continue
      }
      p.vx += Math.sin(p.age * 1.3 + p.phase) * 0.006 * u * f
      p.vy *= Math.pow(0.985, f)
      p.x += p.vx * f
      p.y += p.vy * f
      p.r += p.grow * f * (1 - p.age / p.life)
    }
  }

  private draw() {
    const { sky, ground, dpr } = this
    for (const g of [sky, ground]) {
      g.setTransform(1, 0, 0, 1, 0, 0)
      g.clearRect(0, 0, g.canvas.width, g.canvas.height)
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.globalCompositeOperation = 'source-over'
    }
    // smoke first, so the sparks burn through it
    for (const p of this.puffs) {
      const g = p.ground ? ground : sky
      const t = p.age / p.life
      const a = p.alpha * Math.min(1, p.age / 0.35) * (1 - t) * (1 - t * 0.3)
      if (a <= 0.003) continue
      g.globalAlpha = a
      g.drawImage(p.sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2)
    }
    sky.globalCompositeOperation = 'lighter'
    for (const fl of this.flashes) {
      const k = fl.age / 0.22
      sky.globalAlpha = (1 - k) * 0.9
      const s = fl.size * (0.6 + k * 0.6)
      sky.drawImage(glow(fl.c, true), fl.x - s, fl.y - s, s * 2, s * 2)
    }
    for (const r of this.rockets) {
      const k = Math.min(1, r.t / r.dur)
      const e = 1 - (1 - k) * (1 - k)
      const x = r.x0 + (r.x1 - r.x0) * e
      const y = r.y0 + (r.y1 - r.y0) * e
      sky.globalAlpha = 1
      const s = 9 * this.unit
      sky.drawImage(glow(COLOURS.gold, true), x - s, y - s, s * 2, s * 2)
    }
    for (const s of this.sparks) {
      const t = s.age / s.life
      // white-hot, then the shell's colour (changing half-way for two-colour stars), cooling to an ember
      const base = s.colour2 && t > 0.45 ? COLOURS[s.colour2] : COLOURS[s.colour]
      const sprite = t < 0.07 ? glow(COLOURS.white, true) : t > 0.72 ? glow(mix(base, EMBER, 0.6)) : glow(base)
      const twinkle = t > 0.5 ? 0.65 + 0.35 * Math.sin(s.age * 40 + s.flicker) : 1
      const alpha = (t < 0.07 ? 1 : (1 - t) * (1 - t * 0.4)) * twinkle
      const size = s.size * (t < 0.07 ? 1.8 : 1.2 - t * 0.5)
      for (let k = 0; k < s.trail.length; k += 2) {
        const w = (k / s.trail.length) * 0.6
        sky.globalAlpha = alpha * w
        const ts = size * (0.4 + w)
        sky.drawImage(sprite, s.trail[k] - ts, s.trail[k + 1] - ts, ts * 2, ts * 2)
      }
      sky.globalAlpha = alpha
      sky.drawImage(sprite, s.x - size, s.y - size, size * 2, size * 2)
    }
    sky.globalAlpha = 1
    ground.globalAlpha = 1
  }
}

/**
 * About twelve seconds: three opening shells, coloured smoke rising from both
 * sides, a ring and a crossette, a willow, a measured salvo (bursts at least
 * 0.45 s apart, so the light never strobes), and a golden finale. `horizon` is
 * where rockets rise from (the palace roofline), as a fraction of the height.
 */
function choreography(show: FireworksShow, horizon: number) {
  const H = horizon
  const cue = (t: number, run: () => void) => ({ t, run })
  const shot = (fx: number, fy: number, shell: Shell) => () => show.launch(fx, fy, shell, undefined, H)
  const cues = [
    cue(0.0, shot(0.2, 0.22, { type: 'peony', colour: 'gold', colour2: 'saffron', size: 1.15 })),
    cue(0.9, shot(0.8, 0.2, { type: 'peony', colour: 'rose', colour2: 'violet', size: 1.05 })),
    cue(1.7, shot(0.5, 0.07, { type: 'chrysanthemum', colour: 'emerald', size: 0.9 })),
    cue(1.9, () => {
      show.fountain(0.04, 1.0, ['rose', 'saffron', 'gold'], 1.9, 5.2, 1)
      show.fountain(0.96, 1.0, ['emerald', 'violet', 'azure'], 2.1, 5.0, -1)
    }),
    cue(2.6, shot(0.14, 0.4, { type: 'ring', colour: 'white', size: 0.95 })),
    cue(3.3, shot(0.86, 0.38, { type: 'crossette', colour: 'rose', size: 1.0 })),
    cue(4.0, shot(0.26, 0.12, { type: 'willow', colour: 'gold', size: 1.05 })),
    cue(4.7, shot(0.74, 0.12, { type: 'peony', colour: 'azure', colour2: 'white', size: 1.0 })),
    cue(5.3, shot(0.12, 0.3, { type: 'peony', colour: 'ruby', colour2: 'gold', size: 0.95 })),
    cue(5.8, shot(0.88, 0.28, { type: 'chrysanthemum', colour: 'gold', size: 0.95 })),
    cue(6.3, shot(0.36, 0.06, { type: 'crossette', colour: 'emerald', size: 0.95 })),
    cue(6.8, shot(0.64, 0.06, { type: 'peony', colour: 'violet', colour2: 'rose', size: 1.0 })),
    cue(7.3, shot(0.2, 0.44, { type: 'crackle', colour: 'gold', size: 1.0 })),
    cue(7.8, shot(0.8, 0.44, { type: 'crackle', colour: 'gold', size: 1.0 })),
    // finale: golden willows to either side, a great peony over the dome
    cue(8.4, shot(0.18, 0.14, { type: 'willow', colour: 'gold', size: 1.2 })),
    cue(8.9, shot(0.82, 0.14, { type: 'willow', colour: 'gold', size: 1.2 })),
    cue(9.5, shot(0.5, 0.06, { type: 'peony', colour: 'gold', colour2: 'white', size: 1.3 })),
    cue(10.1, shot(0.3, 0.3, { type: 'crackle', colour: 'gold', size: 1.1 })),
    cue(10.5, shot(0.7, 0.3, { type: 'crackle', colour: 'gold', size: 1.1 })),
  ]
  return cues
}
