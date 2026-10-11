import { wedding } from '../../config/wedding'
import { weddingDateRangeOrdinal } from '../../lib/format'
import { SectionHeading } from '../ui/SectionHeading'

/** The invitation card — wording uses only confirmed details. */
export function InvitationSection() {
  return (
    <section id="invitation" aria-labelledby="invitation-title" className="section bg-ivory-warm">
      <div className="container-content">
        <SectionHeading id="invitation" title="The Invitation" lead="With the blessings of our families" />
        <article className="mx-auto mt-10 max-w-md rounded-[var(--radius-card)] border border-gold/50 bg-parchment px-8 py-12 text-center shadow-[var(--shadow-card)]">
          <p className="font-display text-[1.6rem] italic text-ink">You are</p>
          <p className="script text-[2.6rem] text-maroon">Cordially Invited</p>
          <p className="mt-2 text-[0.95rem] italic text-ink-soft">to celebrate the wedding of</p>
          <p className="script mt-4 text-[3rem] leading-none text-maroon">{wedding.couple.first}</p>
          <p className="script text-[1.8rem] text-gold-deep">&amp;</p>
          <p className="script text-[3rem] leading-none text-maroon">{wedding.couple.second}</p>
          <p className="mt-6 font-display text-[1.3rem] text-ink">{weddingDateRangeOrdinal}</p>
          <p className="mt-3 font-display text-[1.15rem] text-ink-soft">
            {wedding.venue.name}
            <br />
            {wedding.venue.city}
          </p>
        </article>
      </div>
    </section>
  )
}
