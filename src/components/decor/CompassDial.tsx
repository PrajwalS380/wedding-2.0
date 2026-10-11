import { useId } from 'react'

/**
 * The Wedding Compass dial (Reference B, screen 4): a carved gold bezel with
 * cardinal finials, an emerald velvet face with fine gold rings and ticks, an
 * eight-pointed gold star and a D&V medallion. `heading` (degrees) turns the
 * star toward the chosen destination. Decorative: the destinations themselves
 * are real links beside it.
 */
export function CompassDial({ heading = 0, className = '' }: { heading?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  const g = (n: string) => `url(#${id}-${n})`
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5)
  const cardinal = [
    ['N', 0],
    ['E', 90],
    ['S', 180],
    ['W', 270],
  ] as const
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-velvet`} cx="45%" cy="38%" r="70%">
          <stop offset="0" stopColor="#1f5a44" />
          <stop offset="0.6" stopColor="#123f30" />
          <stop offset="1" stopColor="#081f17" />
        </radialGradient>
        <linearGradient id={`${id}-gold`} gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="380">
          <stop offset="0" stopColor="#fbe7ad" />
          <stop offset="0.3" stopColor="#d9ab4f" />
          <stop offset="0.55" stopColor="#9b6c22" />
          <stop offset="0.8" stopColor="#e3bd66" />
          <stop offset="1" stopColor="#8f6420" />
        </linearGradient>
        <linearGradient id={`${id}-gold-h`} gradientUnits="userSpaceOnUse" x1="20" y1="0" x2="380" y2="0">
          <stop offset="0" stopColor="#9b6c22" />
          <stop offset="0.5" stopColor="#f6dc94" />
          <stop offset="1" stopColor="#9b6c22" />
        </linearGradient>
        <linearGradient id={`${id}-star-l`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="16" y2="0">
          <stop offset="0" stopColor="#fff1be" />
          <stop offset="1" stopColor="#d9ab4f" />
        </linearGradient>
        <linearGradient id={`${id}-star-d`} gradientUnits="userSpaceOnUse" x1="-16" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#7a5216" />
          <stop offset="1" stopColor="#b98a2e" />
        </linearGradient>
        <radialGradient id={`${id}-medal`} cx="45%" cy="40%" r="65%">
          <stop offset="0" stopColor="#21614a" />
          <stop offset="1" stopColor="#0b2c21" />
        </radialGradient>
      </defs>

      {/* bezel: thick bevelled gold ring with a soft shadow */}
      <circle cx="200" cy="203" r="182" fill="#3a2408" opacity="0.25" />
      <circle cx="200" cy="200" r="180" fill={g('gold')} />
      <circle cx="200" cy="200" r="168" fill="#6e4b15" />
      <circle cx="200" cy="200" r="165" fill={g('gold-h')} />
      <circle cx="200" cy="200" r="158" fill={g('velvet')} />

      {/* cardinal finials on the bezel */}
      {cardinal.map(([, a]) => (
        <g key={a} transform={`rotate(${a} 200 200)`}>
          <path d="M200 8l11 14-11 14-11-14Z" fill={g('gold')} stroke="#6e4b15" strokeWidth="0.8" />
          <circle cx="200" cy="22" r="3" fill="#fff0b8" />
        </g>
      ))}

      {/* fine rings and ticks */}
      <circle cx="200" cy="200" r="148" fill="none" stroke="#d9b25c" strokeOpacity="0.7" strokeWidth="1" />
      <circle cx="200" cy="200" r="120" fill="none" stroke="#d9b25c" strokeOpacity="0.35" strokeWidth="0.8" />
      <circle cx="200" cy="200" r="70" fill="none" stroke="#d9b25c" strokeOpacity="0.45" strokeWidth="0.8" />
      {ticks.map((a) => (
        <path
          key={a}
          d={`M200 ${a % 45 === 0 ? 54 : a % 15 === 0 ? 56 : 58}V62`}
          transform={`rotate(${a} 200 200)`}
          stroke="#e8cf86"
          strokeOpacity={a % 45 === 0 ? 0.9 : 0.55}
          strokeWidth={a % 45 === 0 ? 1.6 : 0.8}
        />
      ))}

      {/* cardinal letters */}
      {cardinal.map(([letter, a]) => {
        const rad = ((a - 90) * Math.PI) / 180
        const x = 200 + Math.cos(rad) * 134
        const y = 200 + Math.sin(rad) * 134
        return (
          <text key={letter} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontFamily="Cinzel, Georgia, serif" fontSize="19" fontWeight="600" fill="#f3dc96">
            {letter}
          </text>
        )
      })}

      {/* eight-pointed star: long cardinal points, short diagonals; turns toward the heading */}
      <g transform={`rotate(${heading} 200 200)`} style={{ transition: 'transform 900ms cubic-bezier(0.22,0.61,0.36,1)' }}>
        {[45, 135, 225, 315].map((a) => (
          <g key={a} transform={`rotate(${a} 200 200) translate(200 200)`}>
            <path d="M0 -78L0 0L-11 -14Z" fill={g('star-d')} />
            <path d="M0 -78L0 0L11 -14Z" fill={g('star-l')} />
          </g>
        ))}
        {[0, 90, 180, 270].map((a) => (
          <g key={a} transform={`rotate(${a} 200 200) translate(200 200)`}>
            <path d="M0 -118L0 0L-16 -20Z" fill={g('star-d')} />
            <path d="M0 -118L0 0L16 -20Z" fill={g('star-l')} />
          </g>
        ))}
      </g>

      {/* D&V medallion */}
      <circle cx="200" cy="200" r="40" fill={g('gold')} />
      <circle cx="200" cy="200" r="35" fill={g('medal')} />
      <circle cx="200" cy="200" r="31" fill="none" stroke="#d9b25c" strokeOpacity="0.6" strokeWidth="0.8" />
      <text x="200" y="202" textAnchor="middle" dominantBaseline="central" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="27" fontWeight="500" fill="#f3dc96">
        D<tspan fontStyle="italic" fontSize="18">&amp;</tspan>V
      </text>
    </svg>
  )
}
