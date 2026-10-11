import { wedding } from '../../config/wedding'
import { useI18n } from '../../i18n/useI18n'
import { CalendarButton } from '../ui/Actions'
import { buttonClass } from '../ui/buttonStyles'
import { GoldRule, OrnateFrame } from '../decor/Ornaments'
import { ButtonLink } from '../ui/Button'
import { MapFold, MapPin } from '../ui/icons'
import './venue.css'
import { SceneBackdrop } from '../decor/SceneBackdrop'
import { FloralFrame } from '../decor/FloralFrame'

/**
 * The venue (Reference B, screen 6): an arched window onto the painted palace
 * garden (decorative — an illustration, not a picture of the venue), the exact
 * confirmed address, and directions to the family's Google Maps destination.
 */
export function VenueSection() {
  const { t } = useI18n()
  return (
    <section id="venue" aria-labelledby="venue-title" className="venue scene scene--fade-top scene--fade-bottom">
      <SceneBackdrop className="venue__bg" />
      <div className="venue__veil" aria-hidden="true" />
      <FloralFrame corners={['tl', 'tr', 'bl', 'br']} />
      <img className="decor venue__lamp" src="/site/lamp.webp" alt="" loading="lazy" />

      <header data-reveal="0" className="venue__head">
        <h2 id="venue-title" className="title-caps">
          {t.venueSection.title}
        </h2>
        <p className="title-lead">{t.venueSection.lead}</p>
      </header>

      <div className="venue__layout">
        <div data-reveal="1" className="venue__window" aria-hidden="true">
          <img src="/site/venue-wide.webp" alt="" loading="lazy" decoding="async" />
        </div>

        <OrnateFrame as="div" data-reveal="2" className="venue__card">
          <address className="venue__address">
            <span className="venue__name">{t.venue.name}</span>
            <GoldRule className="venue__rule" />
            <span className="venue__lines">
              {t.venue.line1}
              <br />
              {t.venue.line2}
            </span>
          </address>
          <ButtonLink href={wedding.venue.mapsUrl} target="_blank" rel="noopener noreferrer" variant="maroon" className="venue__directions" icon={<MapPin />}>
            {t.venueSection.directions}
            <span className="sr-only"> {t.common.mapsNewTab}</span>
          </ButtonLink>
          <div className="venue__secondary">
            <ButtonLink href={wedding.venue.mapsUrl} target="_blank" rel="noopener noreferrer" variant="ivory" icon={<MapFold />}>
              {t.venueSection.viewMap}
              <span className="sr-only"> {t.common.mapsNewTab}</span>
            </ButtonLink>
            <CalendarButton className={buttonClass('ivory')} />
          </div>
        </OrnateFrame>
      </div>
    </section>
  )
}
