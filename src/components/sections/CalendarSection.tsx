import { useState } from 'react'
import { wedding } from '../../config/wedding'
import { useNow } from '../../hooks/useNow'
import { formatLongDate, shortMonth, weekdayName } from '../../lib/format'
import { parseIsoDate, untilDay, weddingPhase } from '../../lib/time'
import { SectionHeading } from '../ui/SectionHeading'

type DayId = (typeof wedding.days)[number]['id']

/** Two selectable wedding days with a live, IST-based, date-only countdown. */
export function CalendarSection() {
  const now = useNow()
  const [selected, setSelected] = useState<DayId>('day-1')
  const day = wedding.days.find((d) => d.id === selected) ?? wedding.days[0]
  const remaining = untilDay(day.date, now)
  const phase = weddingPhase(now)
  const isToday = phase === day.id
  const isPast = remaining.totalMs === 0 && !isToday

  return (
    <section id="calendar" aria-labelledby="calendar-title" className="section">
      <div className="container-content">
        <SectionHeading
          id="calendar"
          eyebrow="A two-day celebration"
          title="The Living Wedding Calendar"
          scriptTitle
          lead="Our wedding celebrations unfold across two days. Choose a day to see it in detail."
        />

        <div role="group" aria-label="Wedding days" className="mx-auto mt-10 grid max-w-md grid-cols-2 gap-4">
          {wedding.days.map((d, i) => {
            const on = d.id === selected
            const { day: dom, year } = parseIsoDate(d.date)
            return (
              <button
                key={d.id}
                type="button"
                aria-pressed={on}
                onClick={() => setSelected(d.id)}
                className={`rounded-t-[4rem] rounded-b-2xl border px-4 pb-6 pt-8 text-center transition-colors duration-300 ${
                  on ? 'border-gold bg-emerald text-gold-pale' : 'border-gold/50 bg-ivory text-emerald-deep hover:bg-parchment/60'
                }`}
              >
                <span className="sr-only">{`Day ${i + 1}: ${formatLongDate(d.date)}`}</span>
                <span aria-hidden="true" className="block font-display text-[3rem] leading-none">
                  {dom}
                </span>
                <span aria-hidden="true" className="caps mt-2 block text-[0.85rem]">
                  {shortMonth(d.date)} {year}
                </span>
                <span aria-hidden="true" className="caps mt-1 block text-[0.85rem]">
                  {weekdayName(d.date)}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mx-auto mt-6 max-w-md rounded-[var(--radius-card)] border border-gold/50 bg-ivory px-6 py-7 text-center shadow-[var(--shadow-card)]">
          <p className="eyebrow">
            Day {day.id === 'day-1' ? 'one' : 'two'} · {weekdayName(day.date)}
          </p>
          <p className="mt-2 font-display text-[1.35rem] text-ink">{formatLongDate(day.date)}</p>
          {isToday ? (
            <p className="mt-4 font-display text-[1.25rem] text-emerald-deep">The celebrations are today.</p>
          ) : isPast ? (
            <p className="mt-4 font-display text-[1.25rem] text-emerald-deep">With gratitude — this day has been celebrated.</p>
          ) : (
            <>
              <dl className="mt-5 grid grid-cols-4 gap-2" aria-live="off">
                {(
                  [
                    ['Days', remaining.days],
                    ['Hrs', remaining.hours],
                    ['Min', remaining.minutes],
                    ['Sec', remaining.seconds],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="flex flex-col-reverse items-center">
                    <dt className="caps text-[0.72rem] text-ink-soft">{label}</dt>
                    <dd className="m-0 font-display text-[2.2rem] tabular-nums leading-none text-emerald-deep">{String(value).padStart(2, '0')}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-[0.9rem] italic text-ink-soft">Counting down to the start of this day (India Standard Time).</p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
