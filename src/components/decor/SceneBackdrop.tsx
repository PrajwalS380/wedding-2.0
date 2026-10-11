/**
 * A section's backdrop: a still of the palace garden rendered from the intro's 3D
 * world (see tools/render/stills.mjs), landscape or portrait to suit the screen.
 * `soft` uses the pre-blurred variant that sits behind ivory cards.
 */
export function SceneBackdrop({ scene = 'garden', soft = true, className = '' }: { scene?: 'garden' | 'dusk' | 'venue' | 'venue-dusk' | 'closing'; soft?: boolean; className?: string }) {
  const suffix = soft ? '-soft' : ''
  return (
    <picture className={`scene__bg ${className}`} aria-hidden="true">
      <source media="(min-aspect-ratio: 1/1)" srcSet={`/site/${scene}-wide${suffix}.webp`} />
      <img src={`/site/${scene}-tall${suffix}.webp`} alt="" loading="lazy" decoding="async" />
    </picture>
  )
}
