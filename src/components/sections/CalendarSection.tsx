import { useId } from 'react'
import { wedding } from '../../config/wedding'
import { useNow } from '../../hooks/useNow'
import { scrollToSection } from '../../lib/browser'
import { useI18n } from '../../i18n/useI18n'
import { parseIsoDate, untilDay, weddingPhase } from '../../lib/time'
import { useSelectedDay, type DayId } from '../../state/selectedDay'
import { GoldRule, OrnateFrame } from '../decor/Ornaments'
import { ButtonLink } from '../ui/Button'
import { ArrowRight } from '../ui/icons'
import './calendar.css'
import { SceneBackdrop } from '../decor/SceneBackdrop'
import { FloralFrame } from '../decor/FloralFrame'

/** The jharokha-lantern outline of the date cards (Reference B, screen 3). */
const CARD_PATH =
  'M8 66C8 47 20 39 34 39C40 27 56 19 70 17Q77 8 80 2Q83 8 90 17C104 19 120 27 126 39C140 39 152 47 152 66L152 178C152 190 140 196 126 198Q101 202 87 213L80 220L73 213Q59 202 34 198C20 196 8 190 8 178Z'

function DateCard({ id, selected, onSelect, index }: { id: DayId; selected: boolean; onSelect: () => void; index: number }) {
  const day = wedding.days.find((d) => d.id === id)!
  const { day: dom } = parseIsoDate(day.date)
  const { t } = useI18n()
  const gid = useId().replace(/:/g, '')
  return (
    <button type="button" className={`date-card ${selected ? 'is-selected' : ''}`} aria-pressed={selected} onClick={onSelect}>
      <svg className="date-card__shape" viewBox="0 0 160 222" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
            {selected ? (
              <>
                <stop offset="0" stopColor="#1d5a44" />
                <stop offset="0.55" stopColor="#123f30" />
                <stop offset="1" stopColor="#0b2c21" />
              </>
            ) : (
              <>
                <stop offset="0" stopColor="#fffaf0" />
                <stop offset="0.6" stopColor="#f6ead2" />
                <stop offset="1" stopColor="#ecdab5" />
              </>
            )}
          </linearGradient>
          <linearGradient id={`${gid}-gold`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="222">
            <stop offset="0" stopColor="#f3dc96" />
            <stop offset="0.5" stopColor="#b98a2e" />
            <stop offset="1" stopColor="#e1c072" />
          </linearGradient>
        </defs>
        <path d={CARD_PATH} fill={`url(#${gid}-fill)`} stroke={`url(#${gid}-gold)`} strokeWidth="2.4" />
        <path d={CARD_PATH} transform="translate(80 111) scale(0.9) translate(-80 -111)" fill="none" stroke={`url(#${gid}-gold)`} strokeWidth="0.9" opacity="0.85" />
        {/* filigree in the shoulders and at the foot */}
        <g fill="none" stroke={`url(#${gid}-gold)`} strokeWidth="0.9" strokeLinecap="round" opacity="0.9">
          <path d="M22 70c0-9 6-15 15-15M22 70c3 0 6 3 6 6M37 55c0 3 3 6 6 6" />
          <path d="M138 70c0-9-6-15-15-15M138 70c-3 0-6 3-6 6M123 55c0 3-3 6-6 6" />
          <path d="M80 206c-4-4-10-6-16-6M80 206c4-4 10-6 16-6" />
          <circle cx="80" cy="30" r="2" fill={`url(#${gid}-gold)`} stroke="none" />
        </g>
      </svg>
      <span className="date-card__body">
        <span className="sr-only">{t.calendar.dayCard(index + 1, t.date.long(day.date))}</span>
        <span className="date-card__day" aria-hidden="true">
          {dom}
        </span>
        <span className="date-card__month" aria-hidden="true">
          {t.date.monthYear(day.date)}
        </span>
        <span className="date-card__line" aria-hidden="true" />
        <span className="date-card__weekday" aria-hidden="true">
          {t.date.weekday(day.date)}
        </span>
      </span>
    </button>
  )
}

/** The Living Wedding Calendar: two selectable days and a live IST countdown. */
export function CalendarSection() {
  const now = useNow()
  const { t } = useI18n()
  const { day: selected, setDay } = useSelectedDay()
  const day = wedding.days.find((d) => d.id === selected) ?? wedding.days[0]
  const index = wedding.days.indexOf(day)
  const remaining = untilDay(day.date, now)
  const phase = weddingPhase(now)
  const isToday = phase === day.id
  const isPast = remaining.totalMs === 0 && !isToday

  return (
    <section id="calendar" aria-labelledby="calendar-title" className="calendar scene scene--fade-top scene--fade-bottom">
      <SceneBackdrop className="calendar__bg" scene="venue" soft={false} />
      <div className="calendar__veil" aria-hidden="true" />
      <FloralFrame />
      <img className="decor calendar__lotus calendar__lotus--l" src="/site/lotus.webp" alt="" loading="lazy" />
      <img className="decor calendar__lotus calendar__lotus--r" src="/site/lotus.webp" alt="" loading="lazy" />
      <img className="decor calendar__lamp" src="/site/lamp.webp" alt="" loading="lazy" />

      <header data-reveal="0" className="calendar__head">
        <p className="eyebrow-caps">{t.calendar.eyebrow}</p>
        <h2 id="calendar-title" className="title-script calendar__title">
          {t.calendar.title1} <br />
          {t.calendar.title2}
        </h2>
        <p className="calendar__lead">{t.calendar.lead}</p>
      </header>

      <div className="calendar__layout">
        <div role="group" aria-label={t.calendar.days} data-reveal="1" className="calendar__cards">
          {wedding.days.map((d, i) => (
            <DateCard key={d.id} id={d.id} index={i} selected={d.id === selected} onSelect={() => setDay(d.id)} />
          ))}
        </div>

        <OrnateFrame data-reveal="2" className="countdown" aria-live="off">
          <p className="eyebrow-caps countdown__eyebrow">
            {t.calendar.dayEyebrow(index + 1, t.date.weekday(day.date))}
          </p>
          <p className="countdown__date">{t.date.long(day.date)}</p>
          <GoldRule className="countdown__rule" />
          {isToday ? (
            <p className="countdown__message">{t.calendar.today}</p>
          ) : isPast ? (
            <p className="countdown__message">{t.calendar.past}</p>
          ) : (
            <dl className="countdown__grid">
              {(
                [
                  [t.calendar.units.days, remaining.days],
                  [t.calendar.units.hrs, remaining.hours],
                  [t.calendar.units.min, remaining.minutes],
                  [t.calendar.units.sec, remaining.seconds],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="countdown__cell">
                  <dt>{label}</dt>
                  <dd key={value}>{String(value).padStart(2, '0')}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="countdown__note">{t.calendar.note}</p>
          <ButtonLink
            href="#celebrations"
            className="countdown__cta"
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('celebrations')
            }}
            trailingIcon={<ArrowRight />}
          >
            {t.calendar.details}
          </ButtonLink>
        </OrnateFrame>
      </div>
    </section>
  )
}
