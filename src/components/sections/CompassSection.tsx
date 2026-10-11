import { useState, type MouseEvent } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { scrollToSection } from '../../lib/browser'
import { CompassDial } from '../decor/CompassDial'
import { CompassArch } from '../decor/CompassArch'
import { CalendarIcon, GuestsIcon, MapPin, ScrollIcon } from '../ui/icons'
import './compass.css'
import { SceneBackdrop } from '../decor/SceneBackdrop'
import { FloralFrame } from '../decor/FloralFrame'

const DESTINATIONS = [
  { dir: 'north', heading: 0, target: 'invitation', label: 'invitation', Icon: ScrollIcon },
  { dir: 'east', heading: 90, target: 'celebrations', label: 'schedule', Icon: CalendarIcon },
  { dir: 'west', heading: 270, target: 'guest-services', label: 'services', Icon: GuestsIcon },
  { dir: 'south', heading: 180, target: 'venue', label: 'venue', Icon: MapPin },
] as const

/** The Wedding Compass (Reference B, screen 4): a gold compass and four destinations on this page. */
export function CompassSection() {
  const { t } = useI18n()
  const [heading, setHeading] = useState(0)
  const go = (id: string) => (e: MouseEvent) => {
    e.preventDefault()
    scrollToSection(id)
  }
  return (
    <section id="compass" aria-labelledby="compass-title" className="compass scene scene--fade-top scene--fade-bottom">
      <SceneBackdrop className="compass__bg" />
      <div className="compass__veil" aria-hidden="true" />
      <FloralFrame corners={['tl', 'tr', 'bl', 'br']} />
      <img className="decor compass__garland compass__garland--l" src="/site/strand.webp" alt="" loading="lazy" />
      <img className="decor compass__garland compass__garland--r" src="/site/strand.webp" alt="" loading="lazy" />

      <header data-reveal="0" className="compass__head">
        <h2 id="compass-title" className="compass__title">
          <span className="title-caps">{t.compass.title1}</span>
          <span className="compass__script">{t.compass.title2}</span>
        </h2>
        <p className="compass__lead">{t.compass.lead}</p>
      </header>

      <div className="compass__layout">
        <div data-reveal="1" className="compass__dial-wrap">
          <CompassArch className="compass__arch" />
          <CompassDial className="compass__dial" heading={heading} />
        </div>
        <nav aria-label={t.compass.nav} data-reveal="2" className="compass__nav">
          <ul className="compass__tiles">
            {DESTINATIONS.map(({ dir, heading: h, target, label, Icon }) => (
              <li key={dir}>
                <a
                  href={`#${target}`}
                  className={`compass-tile ${heading === h ? 'is-active' : ''}`}
                  onClick={go(target)}
                  onPointerEnter={() => setHeading(h)}
                  onFocus={() => setHeading(h)}
                >
                  <Icon className="compass-tile__icon" />
                  <span className="compass-tile__dir">{t.compass.dirs[dir]}</span>
                  <span className="compass-tile__label">{t.compass.dest[label]}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  )
}
