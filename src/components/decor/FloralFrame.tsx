import './floral-frame.css'

/**
 * Flowers at a section's upper corners (Reference B): roses, jasmine sprays and
 * bougainvillea, rendered from the palace world's own flower models
 * (src/three/objects/FloralCluster.tsx). Decorative only.
 */
export function FloralFrame({ corners = ['tl', 'tr'] as Array<'tl' | 'tr'>, className = '' }: { corners?: Array<'tl' | 'tr'>; className?: string }) {
  return (
    <div className={`floral-frame ${className}`} aria-hidden="true">
      {corners.includes('tl') && <img className="floral-frame__corner floral-frame__corner--tl" src="/site/florals-a.webp" alt="" loading="lazy" decoding="async" />}
      {corners.includes('tr') && <img className="floral-frame__corner floral-frame__corner--tr" src="/site/florals-b.webp" alt="" loading="lazy" decoding="async" />}
    </div>
  )
}
