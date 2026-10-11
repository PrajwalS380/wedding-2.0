import './floral-frame.css'

type Corner = 'tl' | 'tr' | 'bl' | 'br'
const SRC: Record<Corner, string> = {
  tl: '/site/florals-a.webp',
  tr: '/site/florals-b.webp',
  bl: '/site/florals-bottom.webp',
  br: '/site/florals-bottom.webp',
}

/**
 * Flowers at a section's corners (Reference B): roses, jasmine sprays, lotus and
 * bougainvillea, rendered from the palace world's own flower models
 * (src/three/objects/FloralCluster.tsx). Decorative only.
 */
export function FloralFrame({ corners = ['tl', 'tr'], className = '' }: { corners?: Corner[]; className?: string }) {
  return (
    <div className={`floral-frame ${className}`} aria-hidden="true">
      {corners.map((c) => (
        <img key={c} className={`floral-frame__corner floral-frame__corner--${c}`} src={SRC[c]} alt="" width={640} height={640} loading="lazy" decoding="async" />
      ))}
    </div>
  )
}
