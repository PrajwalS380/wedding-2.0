import { wedding } from '../../config/wedding'
import { SectionHeading } from '../ui/SectionHeading'

/**
 * Practical guidance. Only confirmed facts are stated; nothing here promises
 * accommodation, transport or services the family has not arranged.
 */
export function GuestServicesSection() {
  return (
    <section id="guest-services" aria-labelledby="guest-services-title" className="section">
      <div className="container-content">
        <SectionHeading id="guest-services" title="Guest Services" lead="Everything you need for a comfortable and joyful experience." />
        <ul className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          <li className="rounded-2xl border border-gold/50 bg-ivory p-6 text-center shadow-[var(--shadow-card)]">
            <h3 className="font-display text-[1.4rem] text-emerald-deep">Travel &amp; Stay</h3>
            <p className="mt-2 text-ink-soft">The venue is in {wedding.venue.city}, Karnataka. Use the directions in the Venue section to plan your journey.</p>
          </li>
          <li className="rounded-2xl border border-gold/50 bg-ivory p-6 text-center shadow-[var(--shadow-card)]">
            <h3 className="font-display text-[1.4rem] text-emerald-deep">Local Guide</h3>
            <p className="mt-2 text-ink-soft">Explore {wedding.venue.city} while you are with us.</p>
          </li>
          <li className="rounded-2xl border border-gold/50 bg-ivory p-6 text-center shadow-[var(--shadow-card)]">
            <h3 className="font-display text-[1.4rem] text-emerald-deep">Etiquette</h3>
            <p className="mt-2 text-ink-soft">A few friendly notes: kindly send your RSVP so the family can welcome you.</p>
          </li>
          <li className="rounded-2xl border border-gold/50 bg-ivory p-6 text-center shadow-[var(--shadow-card)]">
            <h3 className="font-display text-[1.4rem] text-emerald-deep">Need Help?</h3>
            <p className="mt-2 text-ink-soft">
              We’re here for you:{' '}
              <a className="font-semibold text-emerald-deep underline decoration-gold underline-offset-4" href={wedding.contact.telHref}>
                {wedding.contact.displayPhone}
              </a>
            </p>
          </li>
        </ul>
      </div>
    </section>
  )
}
