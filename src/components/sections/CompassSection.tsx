import type { MouseEvent } from 'react'
import { scrollToSection } from '../../lib/browser'
import { SectionHeading } from '../ui/SectionHeading'

const DESTINATIONS = [
  { dir: 'North', target: 'invitation', label: 'The Invitation' },
  { dir: 'East', target: 'celebrations', label: 'The Schedule' },
  { dir: 'West', target: 'guest-services', label: 'Guest Services' },
  { dir: 'South', target: 'venue', label: 'The Venue' },
] as const

/** The Wedding Compass — four directions, four destinations on this page. */
export function CompassSection() {
  const go = (id: string) => (e: MouseEvent) => {
    e.preventDefault()
    scrollToSection(id)
  }
  return (
    <section id="compass" aria-labelledby="compass-title" className="section bg-ivory-warm">
      <div className="container-content">
        <SectionHeading id="compass" eyebrow="The wedding" title="Compass" scriptTitle lead="Choose a direction to explore our wedding details." />
        <div aria-hidden="true" className="mx-auto mt-10 grid h-56 w-56 place-items-center rounded-full border-4 border-gold bg-emerald text-gold-pale shadow-[var(--shadow-float)]">
          <span className="caps text-[0.9rem]">N · E · S · W</span>
        </div>
        <nav aria-label="Wedding compass" className="mx-auto mt-10 max-w-md">
          <ul className="grid grid-cols-2 gap-4">
            {DESTINATIONS.map((d) => (
              <li key={d.dir}>
                <a
                  href={`#${d.target}`}
                  onClick={go(d.target)}
                  className="flex min-h-28 flex-col items-center justify-center rounded-2xl border border-gold/50 bg-ivory p-4 text-center shadow-[var(--shadow-card)] transition-colors hover:bg-parchment/60"
                >
                  <span className="caps text-[0.75rem] text-gold-deep">{d.dir}</span>
                  <span className="mt-1 font-display text-[1.2rem] text-emerald-deep">{d.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  )
}
