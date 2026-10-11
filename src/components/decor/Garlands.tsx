import { memo, type CSSProperties } from 'react'
import { range, seeded } from './rand'

/**
 * Decorative florals drawn in SVG from the shared symbols in FloralDefs.
 * All decorative: aria-hidden, no pointer events.
 */

interface StrandProps {
  /** Length of the strand in SVG units (it is 24 units wide). */
  length?: number
  seed?: number
  /** Add a pink rose / marigold every so often, as in temple garlands. */
  accents?: boolean
  /** End the strand with a brass bell. */
  bell?: boolean
  className?: string
  style?: CSSProperties
}

/** A hanging rope of jasmine (mallige): dense flowers and buds around a thread. */
export const JasmineStrand = memo(function JasmineStrand({ length = 220, seed = 1, accents = true, bell = false, className = '', style }: StrandProps) {
  const r = seeded(seed)
  const items: Array<{ id: string; x: number; y: number; s: number; rot: number }> = []
  const sway = range(r, -3, 3)
  const xAt = (y: number) => 12 + Math.sin((y / length) * Math.PI) * sway
  for (let y = 4; y < length - (bell ? 14 : 4); y += 3.1) {
    const n = 2 + Math.floor(r() * 2)
    for (let k = 0; k < n; k++) {
      const bud = r() < 0.32
      items.push({ id: bud ? 'fl-bud' : 'fl-jasmine', x: xAt(y) + range(r, -5.6, 5.6), y: y + range(r, -1.4, 1.4), s: range(r, 0.62, 0.95), rot: range(r, 0, 360) })
    }
    if (r() < 0.12) items.push({ id: r() < 0.5 ? 'fl-leaf' : 'fl-leaf-light', x: xAt(y) + (r() < 0.5 ? -6 : 6), y, s: range(r, 0.45, 0.7), rot: r() < 0.5 ? range(r, 150, 210) : range(r, -30, 30) })
    if (accents && y > 30 && r() < 0.035) items.push({ id: r() < 0.6 ? 'fl-rose' : 'fl-marigold', x: xAt(y), y, s: range(r, 0.75, 0.95), rot: range(r, 0, 360) })
  }
  return (
    <svg className={className} style={style} viewBox={`0 0 24 ${length}`} preserveAspectRatio="xMidYMin meet" aria-hidden="true" focusable="false">
      <path d={`M12 0 Q${12 + sway * 2} ${length / 2} ${xAt(length)} ${length}`} stroke="#9b8a5a" strokeWidth="0.5" fill="none" opacity="0.6" />
      {items.map((it, i) => (
        <use key={i} href={`#${it.id}`} transform={`translate(${it.x.toFixed(2)} ${it.y.toFixed(2)}) rotate(${it.rot.toFixed(1)}) scale(${it.s.toFixed(2)})`} />
      ))}
      {bell && <use href="#fl-bell" transform={`translate(${xAt(length - 9).toFixed(2)} ${length - 8}) scale(1.05)`} />}
    </svg>
  )
})

interface ClusterProps {
  /** Overall width / height in SVG units. */
  w?: number
  h?: number
  seed?: number
  /** pink bougainvillea (default) or deep roses */
  tone?: 'pink' | 'rose' | 'mixed'
  /** Fraction of jasmine flowers mixed in. */
  jasmine?: number
  className?: string
  style?: CSSProperties
}

/** A loose bank of leaves and blossoms — the flowering vines framing every screen of Reference B. */
export const BlossomCluster = memo(function BlossomCluster({ w = 120, h = 160, seed = 3, tone = 'pink', jasmine = 0.15, className = '', style }: ClusterProps) {
  const r = seeded(seed)
  const leaves: Array<{ id: string; x: number; y: number; s: number; rot: number }> = []
  const flowers: Array<{ id: string; x: number; y: number; s: number; rot: number }> = []
  const count = Math.round((w * h) / 130)
  for (let i = 0; i < count; i++) {
    // denser toward the outer edge (x = 0) — the cluster hugs the side of the frame
    const x = Math.pow(r(), 1.6) * w
    const y = r() * h
    leaves.push({ id: r() < 0.6 ? 'fl-leaf' : 'fl-leaf-light', x, y, s: range(r, 0.8, 1.6), rot: range(r, 0, 360) })
  }
  const fcount = Math.round(count * 0.55)
  for (let i = 0; i < fcount; i++) {
    const x = Math.pow(r(), 1.4) * w * 0.95
    const y = r() * h
    const pick = r()
    const id =
      pick < jasmine ? 'fl-jasmine' : tone === 'rose' ? 'fl-rose' : tone === 'mixed' ? (r() < 0.5 ? 'fl-rose' : 'fl-pink-blossom') : 'fl-pink-blossom'
    flowers.push({ id, x, y, s: range(r, 0.7, id === 'fl-jasmine' ? 1.1 : 1.35), rot: range(r, 0, 360) })
  }
  return (
    <svg className={className} style={style} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMinYMid slice" aria-hidden="true" focusable="false">
      {leaves.map((it, i) => (
        <use key={`l${i}`} href={`#${it.id}`} transform={`translate(${it.x.toFixed(1)} ${it.y.toFixed(1)}) rotate(${it.rot.toFixed(0)}) scale(${it.s.toFixed(2)})`} />
      ))}
      {flowers.map((it, i) => (
        <use key={`f${i}`} href={`#${it.id}`} transform={`translate(${it.x.toFixed(1)} ${it.y.toFixed(1)}) rotate(${it.rot.toFixed(0)}) scale(${it.s.toFixed(2)})`} />
      ))}
    </svg>
  )
})

/** A row of small brass bells hanging at staggered lengths (under an arch or lintel). */
export const BellRow = memo(function BellRow({
  count = 7,
  w = 300,
  seed = 5,
  curve = 0,
  className = '',
  style,
}: {
  count?: number
  w?: number
  seed?: number
  /** Follow an arch: outer bells hang from lower points (SVG units). */
  curve?: number
  className?: string
  style?: CSSProperties
}) {
  const r = seeded(seed)
  const step = w / (count + 1)
  return (
    <svg className={className} style={style} viewBox={`0 0 ${w} ${60 + curve}`} preserveAspectRatio="xMidYMin meet" aria-hidden="true" focusable="false">
      {Array.from({ length: count }, (_, i) => {
        const x = step * (i + 1)
        const u = count > 1 ? i / (count - 1) : 0.5
        const anchor = curve * Math.pow(Math.abs(2 * u - 1), 1.55)
        const drop = anchor + 26 + range(r, 0, 8) + (i % 2) * 6
        return (
          <g key={i}>
            <path d={`M${x} ${anchor}V${drop - 10}`} stroke="#b9862f" strokeWidth="0.6" strokeDasharray="1.4 0.8" />
            <use href="#fl-bell" transform={`translate(${x} ${drop}) scale(${range(r, 0.85, 1.05).toFixed(2)})`} />
          </g>
        )
      })}
    </svg>
  )
})
