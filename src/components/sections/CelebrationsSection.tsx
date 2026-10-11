import { wedding } from '../../config/wedding'
import { useI18n } from '../../i18n/useI18n'
import { useSelectedDay } from '../../state/selectedDay'
import { GoldRule, OrnateFrame } from '../decor/Ornaments'
import { ClockIcon, LotusIcon, MapPin } from '../ui/icons'
import './celebrations.css'
import { SceneBackdrop } from '../decor/SceneBackdrop'
import { FloralFrame } from '../decor/FloralFrame'

/**
 * The two celebration days (Reference B, screen 5). The family has not
 * confirmed a ceremony programme or timings, so each day shows only what is
 * confirmed — the date and the venue — and says plainly that the programme
 * has not been published yet, instead of inventing one.
 */
export function CelebrationsSection() {
  const { t } = useI18n()
  const { day: selected, setDay } = useSelectedDay()
  const index = Math.max(0, wedding.days.findIndex((d) => d.id === selected))
  const day = wedding.days[index]
  const focusTab = (i: number) => document.getElementById(`celebration-tab-${wedding.days[i].id}`)?.focus()

  return (
    <section id="celebrations" aria-labelledby="celebrations-title" className="celebrations scene scene--fade-top scene--fade-bottom">
      <SceneBackdrop className="celebrations__bg" />
      <div className="celebrations__veil" aria-hidden="true" />
      <FloralFrame />

      <header data-reveal="0" className="celebrations__head">
        <h2 id="celebrations-title" className="title-caps">
          {t.celebrations.title}
        </h2>
        <p className="title-lead">{t.celebrations.lead}</p>
      </header>

      <div role="tablist" aria-label={t.celebrations.tabs} data-reveal="1" className="celebrations__tabs">
        {wedding.days.map((d, i) => (
          <button
            key={d.id}
            id={`celebration-tab-${d.id}`}
            role="tab"
            type="button"
            aria-selected={i === index}
            aria-controls="celebration-panel"
            tabIndex={i === index ? 0 : -1}
            className="day-tab"
            onClick={() => setDay(d.id)}
            onKeyDown={(e) => {
              const n = wedding.days.length
              const next = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
              if (next < 0) return
              e.preventDefault()
              setDay(wedding.days[next].id)
              focusTab(next)
            }}
          >
            <span className="day-tab__name">{t.celebrations.tab(i + 1)}</span>
            <span className="day-tab__date">{t.date.short(d.date)}</span>
          </button>
        ))}
      </div>

      <OrnateFrame as="div" id="celebration-panel" role="tabpanel" aria-labelledby={`celebration-tab-${day.id}`} data-reveal="2" className="day-panel">
        <h3 className="day-panel__title">{t.celebrations.dayTitle(index + 1)}</h3>
        <p className="day-panel__date">{t.date.long(day.date)}</p>
        <GoldRule className="day-panel__rule" />
        <ul className="day-panel__rows">
          <li>
            <span className="day-panel__icon" aria-hidden="true">
              <MapPin />
            </span>
            <span>
              <strong>{t.venue.name}</strong>
              <br />
              {t.city}, {t.region}
            </span>
          </li>
          <li>
            <span className="day-panel__icon" aria-hidden="true">
              <ClockIcon />
            </span>
            <span>
              <strong>{t.celebrations.timings}</strong>
              <br />
              {t.celebrations.timingsValue}
            </span>
          </li>
          <li>
            <span className="day-panel__icon" aria-hidden="true">
              <LotusIcon />
            </span>
            <span>
              <strong>{t.celebrations.programme}</strong>
              <br />
              {t.celebrations.programmeValue}
            </span>
          </li>
        </ul>
        <div className="day-panel__window" aria-hidden="true">
          <img src="/site/mandap-wide.webp" alt="" loading="lazy" decoding="async" />
        </div>
      </OrnateFrame>
    </section>
  )
}
