import type { MouseEvent } from 'react'
import { coupleNames, wedding } from '../../config/wedding'
import { scrollToSection } from '../../lib/browser'
import { weddingDateRangeOrdinal } from '../../lib/format'
import { ButtonLink } from '../ui/Button'
import { ArrowUp, MapPin } from '../ui/icons'
import { Monogram } from '../ui/Monogram'

/** Closing blessing + footer. */
export function ClosingSection() {
  const toTop = (e: MouseEvent) => {
    e.preventDefault()
    scrollToSection('home')
  }
  return (
    <footer id="closing" className="relative overflow-hidden bg-[linear-gradient(180deg,#f8eedb,#f0dcb5)] pt-[var(--section-pad-y)]">
      <div className="container-content text-center">
        <p className="script text-[2.2rem] text-gold-deep">With love &amp; blessings</p>
        <p className="mt-2 font-display text-[clamp(2.4rem,8vw,4rem)] text-emerald-deep">{coupleNames}</p>
        <p className="mt-2 font-display text-[1.25rem] text-ink">
          {weddingDateRangeOrdinal} · {wedding.venue.city}
        </p>
        <p className="mx-auto mt-5 max-w-[34rem] text-ink-soft">
          We would be delighted to celebrate these special moments with you. Your blessings, love, and presence will make our celebration complete.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href={wedding.venue.mapsUrl} target="_blank" rel="noopener noreferrer" variant="ivory" icon={<MapPin />}>
            Venue directions
            <span className="sr-only"> (opens Google Maps in a new tab)</span>
          </ButtonLink>
        </div>
      </div>
      <div className="mt-16 bg-emerald-deep py-10 text-center text-gold-pale">
        <Monogram size="sm" wreath={false} className="[&_span]:!text-gold-pale" />
        <p className="mt-2 font-display text-[1.15rem]">{coupleNames}</p>
        <p className="mt-1 text-[0.9rem] text-gold-pale/85">Made with love for {coupleNames}</p>
        <a href="#home" onClick={toTop} className="caps mt-6 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[0.75rem] text-gold-pale hover:text-ivory">
          <ArrowUp /> Back to top
        </a>
      </div>
    </footer>
  )
}
