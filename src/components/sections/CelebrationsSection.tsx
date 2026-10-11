import { useState } from 'react'
import { wedding } from '../../config/wedding'
import { formatLongDate, formatShortDate } from '../../lib/format'
import { SectionHeading } from '../ui/SectionHeading'

/**
 * The two celebration days. No ceremony programme or timings have been
 * confirmed, so each day says so plainly instead of implying a schedule.
 */
export function CelebrationsSection() {
  const [selected, setSelected] = useState(0)
  const day = wedding.days[selected]
  return (
    <section id="celebrations" aria-labelledby="celebrations-title" className="section">
      <div className="container-content">
        <SectionHeading id="celebrations" title="The Celebrations" lead="Two special days, filled with love, traditions and cherished moments." />
        <div role="tablist" aria-label="Celebration days" className="mx-auto mt-10 grid max-w-md grid-cols-2 gap-3">
          {wedding.days.map((d, i) => (
            <button
              key={d.id}
              id={`celebration-tab-${d.id}`}
              role="tab"
              type="button"
              aria-selected={i === selected}
              aria-controls="celebration-panel"
              tabIndex={i === selected ? 0 : -1}
              onClick={() => setSelected(i)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + wedding.days.length) % wedding.days.length
                  setSelected(next)
                  document.getElementById(`celebration-tab-${wedding.days[next].id}`)?.focus()
                }
              }}
              className={`rounded-xl border px-4 py-3 text-center transition-colors ${
                i === selected ? 'border-gold bg-maroon text-ivory' : 'border-gold/50 bg-ivory text-emerald-deep hover:bg-parchment/60'
              }`}
            >
              <span className="block font-display text-[1.25rem]">Day {i + 1}</span>
              <span className="block text-[0.85rem]">{formatShortDate(d.date)}</span>
            </button>
          ))}
        </div>
        <div
          id="celebration-panel"
          role="tabpanel"
          aria-labelledby={`celebration-tab-${day.id}`}
          className="mx-auto mt-6 max-w-md rounded-[var(--radius-card)] border border-gold/50 bg-ivory px-6 py-8 text-center shadow-[var(--shadow-card)]"
        >
          <h3 className="font-display text-[1.8rem] text-emerald-deep">Day {selected === 0 ? 'One' : 'Two'}</h3>
          <p className="mt-1 font-display text-[1.2rem] text-ink">{formatLongDate(day.date)}</p>
          <p className="mt-2 text-ink-soft">
            {wedding.venue.name}, {wedding.venue.city}
          </p>
          <p className="mt-5 text-[0.98rem] italic text-ink-soft">The programme and ceremony timings for this day have not been published here yet.</p>
        </div>
      </div>
    </section>
  )
}
