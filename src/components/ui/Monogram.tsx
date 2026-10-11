import { wedding } from '../../config/wedding'

/**
 * "D & V" monogram. The letters are real text (crisp at any size); the laurel
 * wreath around them is decorative.
 */
export function Monogram({ size = 'md', wreath = true, className = '' }: { size?: 'sm' | 'md' | 'lg'; wreath?: boolean; className?: string }) {
  const { first, second } = wedding.couple.monogram
  const dims = { sm: 'h-10 w-10 text-[1.05rem]', md: 'h-24 w-24 text-[2.1rem]', lg: 'h-36 w-36 text-[3.2rem]' }[size]
  return (
    <span className={`relative inline-grid place-items-center ${dims} ${className}`} role="img" aria-label={`${wedding.couple.first} and ${wedding.couple.second}`}>
      {wreath && (
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full text-gold" fill="none" stroke="currentColor" aria-hidden="true" focusable="false">
          <g strokeWidth="1.2" strokeLinecap="round">
            <path d="M50 92C26 90 10 72 10 50c0-14 6-26 16-34" opacity="0.8" />
            <path d="M50 92c24-2 40-20 40-42 0-14-6-26-16-34" opacity="0.8" />
          </g>
          <g fill="currentColor" fillOpacity="0.35" strokeWidth="0.8">
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const t = 0.18 + i * 0.12
              const a = Math.PI * (0.62 + t * 0.85)
              const x = 50 + Math.cos(a) * 40
              const y = 50 + Math.sin(a) * 40
              const deg = (a * 180) / Math.PI + 90
              return (
                <g key={i}>
                  <ellipse cx={x} cy={y} rx="2.6" ry="5.6" transform={`rotate(${deg - 35} ${x} ${y})`} />
                  <ellipse cx={100 - x} cy={y} rx="2.6" ry="5.6" transform={`rotate(${-(deg - 35)} ${100 - x} ${y})`} />
                </g>
              )
            })}
          </g>
        </svg>
      )}
      <span aria-hidden="true" className="relative font-display font-medium leading-none tracking-tight text-emerald-deep">
        {first}
        <span className="script mx-[0.06em] text-[0.7em] text-gold-deep">&amp;</span>
        {second}
      </span>
    </span>
  )
}
