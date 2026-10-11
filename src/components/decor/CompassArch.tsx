/**
 * The jharokha arch the compass is set in (Reference B, screen 4): a softly lit
 * ivory niche with a cusped, pointed head, a double gold outline, a kalash finial
 * and small capitals. Decorative.
 */
const W = 300
const H = 380
const SPRING = 150 // where the arch head begins

/** The niche outline: straight sides, then a pointed head scalloped into seven lobes. */
function nichePath(inset: number): string {
  const l = inset
  const r = W - inset
  const top = 18 + inset * 1.2
  const pts: Array<[number, number]> = []
  const steps = 140
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = l + (r - l) * t
    // pointed (ogee-like) head
    const k = 1 - Math.pow(Math.abs(2 * t - 1), 1.45)
    let y = SPRING - (SPRING - top) * k
    // seven scallops, zero at the cusps
    const lobe = Math.abs(Math.sin(t * 7 * Math.PI))
    y += 9 * lobe * (1 - Math.abs(2 * t - 1) * 0.35)
    pts.push([x, y])
  }
  const head = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  return `M${l},${H} L${l},${SPRING} ${head.replace(/^M/, 'L')} L${r},${H} Z`
}

export function CompassArch({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ca-niche" x1="0" y1="0" x2="0" y2={H} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fffaf0" stopOpacity="0.92" />
          <stop offset="0.55" stopColor="#f6ead2" stopOpacity="0.82" />
          <stop offset="1" stopColor="#ecdab5" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id="ca-glow" cx={W / 2} cy="215" r="150" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff3d4" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff3d4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ca-gold" x1="0" y1="0" x2="0" y2={H} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f3dc96" />
          <stop offset="0.5" stopColor="#b98a2e" />
          <stop offset="1" stopColor="#e1c072" />
        </linearGradient>
      </defs>
      <path d={nichePath(6)} fill="url(#ca-niche)" />
      <path d={nichePath(6)} fill="url(#ca-glow)" />
      <path d={nichePath(6)} fill="none" stroke="url(#ca-gold)" strokeWidth="2.4" />
      <path d={nichePath(15)} fill="none" stroke="url(#ca-gold)" strokeWidth="0.9" opacity="0.85" />
      {/* capitals where the arch springs */}
      {[6, W - 6].map((x) => (
        <g key={x} fill="url(#ca-gold)">
          <rect x={x - 9} y={SPRING - 4} width="18" height="5" rx="1.5" />
          <rect x={x - 6} y={SPRING + 2} width="12" height="3" rx="1" />
        </g>
      ))}
      {/* kalash finial */}
      <g fill="url(#ca-gold)">
        <path d={`M${W / 2 - 7},22 Q${W / 2},4 ${W / 2 + 7},22 Z`} />
        <circle cx={W / 2} cy="6" r="3" />
        <path d={`M${W / 2 - 1.2},0 L${W / 2 + 1.2},0 L${W / 2},-6 Z`} />
      </g>
    </svg>
  )
}
