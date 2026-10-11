import { useEffect, useRef, useState, type CSSProperties } from 'react'

interface Props {
  /** Pillar width as a fraction of the frame width. */
  pillar?: number
  /** Springline (where the arch begins) as a fraction of the height from the top. */
  spring?: number
  /** Apex of the opening as a fraction of the height from the top. */
  apex?: number
  /** Number of scalloped lobes along the arch. */
  lobes?: number
  className?: string
  style?: CSSProperties
}

/**
 * An ivory-stone, gold-trimmed Mughal multifoil (cusped) arch framing its parent
 * — the frame of the Reference B hero. The opening is computed for the element's
 * real size, so the scallops never stretch on wide or narrow screens.
 */
export function CuspedArch({ pillar = 0.07, spring = 0.3, apex = 0.035, lobes = 9, className = '', style }: Props) {
  const ref = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 400, h: 800 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      if (width && height) setSize({ w: Math.round(width), h: Math.round(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { w, h } = size
  const pw = Math.max(18, w * pillar)
  const sy = h * spring
  const top = Math.max(10, h * apex)
  const span = w - 2 * pw
  // lobes scale with the opening, but never so many that they look like lace
  const n = Math.max(5, Math.min(lobes, Math.round(span / 46)))
  const amp = Math.min(18, (span / n) * 0.32)

  const base = (t: number) => {
    const x = pw + span * t
    const y = sy - (sy - top) * (1 - Math.pow(Math.abs(2 * t - 1), 1.55))
    return [x, y] as const
  }
  // offset each point outward (into the stone) by a scallop profile: zero at the cusps
  const pts: Array<readonly [number, number]> = []
  const steps = n * 18
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const [x, y] = base(t)
    const [x2, y2] = base(Math.min(1, t + 0.001))
    const [x1, y1] = base(Math.max(0, t - 0.001))
    let nx = y2 - y1
    let ny = -(x2 - x1)
    const len = Math.hypot(nx, ny) || 1
    nx /= len
    ny /= len
    // outward normal points up (away from the opening)
    if (ny > 0) {
      nx = -nx
      ny = -ny
    }
    const lobe = Math.sin(Math.PI * ((t * n) % 1))
    const o = amp * Math.pow(lobe, 0.7)
    pts.push([x + nx * o, y + ny * o])
  }
  const archPath = (inset: number) => {
    const p = pts.map(([x, y]) => `${(x + (x < w / 2 ? inset : -inset)).toFixed(1)} ${(y + inset).toFixed(1)}`)
    return `M${(pw + inset).toFixed(1)} ${h} L${pw + inset} ${sy.toFixed(1)} L${p.join(' L')} L${(w - pw - inset).toFixed(1)} ${h}`
  }
  const opening = archPath(0)
  const frame = `M0 0H${w}V${h}H0Z ${opening} Z`

  return (
    <svg ref={ref} className={className} style={style} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ca-stone" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={w} y2="0">
          <stop offset="0" stopColor="#efe2c6" />
          <stop offset="0.12" stopColor="#fbf4e3" />
          <stop offset="0.5" stopColor="#fdf8ec" />
          <stop offset="0.88" stopColor="#fbf4e3" />
          <stop offset="1" stopColor="#e9d9b8" />
        </linearGradient>
        <linearGradient id="ca-gold" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={h}>
          <stop offset="0" stopColor="#e4c272" />
          <stop offset="0.5" stopColor="#b98a2e" />
          <stop offset="1" stopColor="#d9b25c" />
        </linearGradient>
      </defs>
      <path d={frame} fill="url(#ca-stone)" fillRule="evenodd" />
      {/* soft shadow just inside the opening edge gives the stone its depth */}
      {[10, 6, 3].map((sw, i) => (
        <path key={sw} d={opening} fill="none" stroke="#7a5a2c" strokeOpacity={0.05 + i * 0.03} strokeWidth={sw} />
      ))}
      <path d={opening} fill="none" stroke="url(#ca-gold)" strokeWidth="2.2" />
      <path d={archPath(-7)} fill="none" stroke="url(#ca-gold)" strokeWidth="0.9" strokeOpacity="0.8" />
      {/* carved pillar panels */}
      {[pw * 0.18, w - pw * 0.82].map((x, i) => (
        <g key={i} fill="none" stroke="url(#ca-gold)" strokeOpacity="0.55">
          <rect x={x} y={sy + 24} width={pw * 0.64} height={h - sy - 48} rx="3" strokeWidth="0.9" />
          <rect x={x + 4} y={sy + 30} width={pw * 0.64 - 8} height={h - sy - 60} rx="2" strokeWidth="0.5" />
          {Array.from({ length: Math.max(2, Math.floor((h - sy) / 120)) }, (_, k) => {
            const cy = sy + 70 + k * 120
            const cx = x + pw * 0.32
            return <path key={k} d={`M${cx} ${cy - 9}c4 4 4 14 0 18-4-4-4-14 0-18ZM${cx - 9} ${cy}c4-4 14-4 18 0-4 4-14 4-18 0Z`} strokeWidth="0.8" />
          })}
        </g>
      ))}
    </svg>
  )
}
