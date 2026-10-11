import { venueAddressLines, wedding } from '../../config/wedding'
import { ButtonLink } from '../ui/Button'
import { MapPin } from '../ui/icons'
import { SectionHeading } from '../ui/SectionHeading'

/** The venue — exact address and the family's Google Maps destination. */
export function VenueSection() {
  return (
    <section id="venue" aria-labelledby="venue-title" className="section bg-ivory-warm">
      <div className="container-content">
        <SectionHeading id="venue" title="The Venue" lead="Join us at a beautiful venue in the heart of Davangere." />
        <address className="mx-auto mt-10 max-w-md rounded-[var(--radius-card)] border border-gold/50 bg-ivory px-6 py-8 text-center not-italic shadow-[var(--shadow-card)]">
          <p className="font-display text-[1.6rem] text-emerald-deep">{wedding.venue.name}</p>
          <p className="mt-2 text-ink-soft">
            {venueAddressLines[0]}
            <br />
            {venueAddressLines[1]}
          </p>
          <ButtonLink href={wedding.venue.mapsUrl} target="_blank" rel="noopener noreferrer" variant="maroon" className="mt-6" icon={<MapPin />}>
            Get directions
            <span className="sr-only"> (opens Google Maps in a new tab)</span>
          </ButtonLink>
        </address>
      </div>
    </section>
  )
}
