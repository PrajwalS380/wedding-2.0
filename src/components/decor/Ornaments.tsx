import type { CSSProperties, ReactNode } from 'react'
import { wedding } from '../../config/wedding'

/** Gold filigree, frames and emblems drawn after Reference B. All decorative. */

const svgProps = { 'aria-hidden': true, focusable: false } as const

/** One corner of an ornamental frame (top-left orientation; rotate for the others). */
export function FiligreeCorner({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 60 60" className={className} style={style} fill="none" stroke="currentColor" strokeLinecap="round" {...svgProps}>
      <path d="M4 56V18C4 10 10 4 18 4h38" strokeWidth="1.2" />
      <path d="M9 56V20c0-6 5-11 11-11h36" strokeWidth="0.7" opacity="0.7" />
      <path d="M14 30c0-9 7-16 16-16" strokeWidth="1" />
      <path d="M14 30c4 0 7 3 7 7s-3 7-7 7" strokeWidth="1" />
      <path d="M30 14c0 4 3 7 7 7s7-3 7-7" strokeWidth="1" />
      <path d="M21 21c3-3 7-3 10 0-3 3-7 3-10 0Z" fill="currentColor" fillOpacity="0.35" strokeWidth="0.8" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
      <circle cx="44" cy="21" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="21" cy="44" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * Ivory parchment card with a fine double gold border and filigree corners —
 * the surface of the countdown, venue, RSVP and service cards in Reference B.
 */
export function OrnateFrame({
  children,
  className = '',
  tone = 'ivory',
  corners = true,
  as: Tag = 'div',
  ...rest
}: {
  children: ReactNode
  className?: string
  tone?: 'ivory' | 'emerald'
  corners?: boolean
  as?: 'div' | 'article' | 'section' | 'address' | 'form'
} & Record<string, unknown>) {
  return (
    <Tag className={`ornate-frame ornate-frame--${tone} ${className}`} {...rest}>
      {corners &&
        (['tl', 'tr', 'bl', 'br'] as const).map((c) => <FiligreeCorner key={c} className={`ornate-frame__corner ornate-frame__corner--${c}`} />)}
      {children}
    </Tag>
  )
}

/** Short gold rule with a lotus bud, for inside cards. */
export function GoldRule({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 16" className={`h-4 w-40 text-gold ${className}`} fill="none" stroke="currentColor" {...svgProps}>
      <defs>
        <linearGradient id="gr-fade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="200" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="0.5" stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 8h86M114 8h86" stroke="url(#gr-fade)" strokeWidth="1" />
      <path d="M100 2l5 6-5 6-5-6Z" fill="currentColor" fillOpacity="0.4" strokeWidth="0.9" />
      <path d="M95 8c-3-2.4-6-2.4-8.5 0 2.5 2.4 5.5 2.4 8.5 0ZM105 8c3-2.4 6-2.4 8.5 0-2.5 2.4-5.5 2.4-8.5 0Z" strokeWidth="0.8" />
      <circle cx="84" cy="8" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="116" cy="8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * The D & V monogram in an arched gold cartouche between two laurel sprigs
 * (hero of Reference B). The letters are real text.
 */
export function LaurelMonogram({ className = '' }: { className?: string }) {
  const { first, second } = wedding.couple.monogram
  return (
    <div className={`laurel-monogram ${className}`} role="img" aria-label={`${wedding.couple.first} and ${wedding.couple.second}`}>
      <svg viewBox="0 0 200 150" className="laurel-monogram__art" {...svgProps}>
        <defs>
          <linearGradient id="lm-gold" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="140">
            <stop offset="0" stopColor="#e9cf86" />
            <stop offset="0.5" stopColor="#b98a2e" />
            <stop offset="1" stopColor="#d8b25e" />
          </linearGradient>
          <linearGradient id="lm-leaf" gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="140">
            <stop offset="0" stopColor="#8fa66c" />
            <stop offset="1" stopColor="#4d6b3a" />
          </linearGradient>
        </defs>
        {/* arched cartouche */}
        <path d="M58 132V52C58 28 77 12 100 12s42 16 42 40v80Z" fill="rgb(255 250 240 / 0.55)" stroke="url(#lm-gold)" strokeWidth="2" />
        <path d="M64 127V53c0-21 16.5-35 36-35s36 14 36 35v74Z" fill="none" stroke="url(#lm-gold)" strokeWidth="0.8" />
        <path d="M100 4c-3 3-4 5.5-4 8 0 2.6 1.8 4.4 4 5.6 2.2-1.2 4-3 4-5.6 0-2.5-1-5-4-8Z" fill="url(#lm-gold)" />
        <path d="M86 140c4 3 9 4.5 14 4.5s10-1.5 14-4.5c-4-1-9-1.5-14 1.5-5-3-10-2.5-14-1.5Z" fill="url(#lm-gold)" />
        {/* laurel sprigs */}
        {[1, -1].map((d) => (
          <g key={d} transform={d === -1 ? 'translate(200 0) scale(-1 1)' : undefined}>
            <path d="M52 128C34 116 26 96 30 70" fill="none" stroke="url(#lm-gold)" strokeWidth="1.2" />
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const t = i / 5
              const x = 52 - 22 * t + Math.sin(t * 3) * 2
              const y = 128 - 58 * t
              return (
                <g key={i}>
                  <ellipse cx={x - 6} cy={y - 2} rx="3" ry="7.5" transform={`rotate(${-50 + t * 25} ${x - 6} ${y - 2})`} fill="url(#lm-leaf)" />
                  <ellipse cx={x + 4} cy={y - 5} rx="2.6" ry="6.5" transform={`rotate(${35 + t * 10} ${x + 4} ${y - 5})`} fill="url(#lm-leaf)" opacity="0.9" />
                </g>
              )
            })}
          </g>
        ))}
      </svg>
      <span className="laurel-monogram__letters" aria-hidden="true">
        {first}
        <span>&amp;</span>
        {second}
      </span>
    </div>
  )
}

/** Line-art mandap (domed pavilion with pillars, steps and lamps) — the scroll's emblem. */
export function MandapEmblem({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 100" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...svgProps}>
      <path d="M80 4v6M77 7h6" strokeWidth="1" />
      <path d="M58 30c0-11 10-19 22-19s22 8 22 19Z" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
      <path d="M52 31h56M54 35h52" strokeWidth="1.1" />
      <path d="M62 30c2-6 6-10 10-12M98 30c-2-6-6-10-10-12M80 11v19" strokeWidth="0.7" opacity="0.7" />
      {[58, 70, 90, 102].map((x) => (
        <g key={x}>
          <path d={`M${x} 35v38`} strokeWidth="1.3" />
          <path d={`M${x - 2.5} 37h5M${x - 2.5} 71h5`} strokeWidth="0.8" />
        </g>
      ))}
      <path d="M64 44c4-5 12-5 16 0M80 44c4-5 12-5 16 0" strokeWidth="0.8" opacity="0.8" />
      <path d="M72 73V58c0-4 3.6-7 8-7s8 3 8 7v15" strokeWidth="0.9" />
      <path d="M46 73h68M42 78h76M38 83h84" strokeWidth="1.1" />
      {[30, 130].map((x) => (
        <g key={x}>
          <path d={`M${x - 6} 83h12M${x} 83V64`} strokeWidth="0.9" />
          <path d={`M${x - 5} 64h10l-2 3h-6Z`} strokeWidth="0.8" fill="currentColor" fillOpacity="0.2" />
          <path d={`M${x} 63c-1.6-2-1.6-4 0-6 1.6 2 1.6 4 0 6Z`} strokeWidth="0.7" fill="currentColor" fillOpacity="0.5" />
        </g>
      ))}
      <path d="M20 90c20-4 40-5 60-5s40 1 60 5" strokeWidth="0.7" opacity="0.6" />
    </svg>
  )
}
