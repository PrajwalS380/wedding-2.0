import type { MouseEvent } from 'react'
import { wedding } from '../../config/wedding'
import { useI18n } from '../../i18n/useI18n'
import { CalendarButton, ShareButton } from '../ui/Actions'
import { scrollToSection } from '../../lib/browser'
import { SceneBackdrop } from '../decor/SceneBackdrop'
import { useFireworks } from '../magic/useFireworks'
import { FloralFrame } from '../decor/FloralFrame'
import { GoldRule } from '../decor/Ornaments'
import { ArrowUp, HeartIcon, MapPin } from '../ui/icons'
import { Monogram } from '../ui/Monogram'
import '../../styles/site.css'
import './closing.css'

/**
 * The closing blessing (Reference B, screen 9): the palace at dusk, lit and
 * mirrored in the long pool, a carved stone elephant dressed for the wedding in the
 * foreground (src/three/objects/Elephant.tsx), and the footer.
 */
export function ClosingSection() {
  const { t } = useI18n()
  const fireworks = useFireworks()
  const go = (id: string) => (e: MouseEvent) => {
    e.preventDefault()
    scrollToSection(id)
  }
  return (
    <footer id="closing" className="closing">
      <div className="closing__scene scene scene--fade-top">
        <SceneBackdrop className="closing__bg" scene="closing" soft={false} />
        <div className="closing__veil" aria-hidden="true" />
        {fireworks.layer}
        <img className="decor closing__elephant" src="/site/elephant.webp" alt="" width={900} height={760} loading="lazy" decoding="async" />
        <FloralFrame corners={['bl', 'br']} className="floral-frame--dusk" />
        <div data-reveal="0" className="closing__content">
          <p className="closing__blessing">{t.closing.blessing}</p>
          <p className="closing__names">
            {wedding.couple.first} <span>&amp;</span> {wedding.couple.second}
          </p>
          <p className="closing__date">
            {t.date.rangeOrdinal} · {t.city}
          </p>
          <GoldRule className="closing__rule" />
          <p className="closing__message">
            {t.closing.message}
          </p>
          <div className="closing__actions">
            <a className="closing__btn closing__btn--primary" href="#rsvp" onClick={go('rsvp')}>
              <HeartIcon className="h-4 w-4" /> {t.closing.rsvp}
            </a>
            <a className="closing__btn" href={wedding.venue.mapsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="h-4 w-4" /> {t.closing.directions}
              <span className="sr-only"> {t.common.mapsNewTab}</span>
            </a>
            <ShareButton className="closing__btn" />
            <CalendarButton className="closing__btn" />
          </div>
          {fireworks.button}
        </div>
      </div>

      <div className="closing__footer">
        <span className="closing__crest">
          <Monogram size="sm" wreath={false} className="closing__mono" />
        </span>
        <p className="closing__footer-names">{t.couple.pair}</p>
        <p className="closing__made">
          {t.closing.made(t.couple.pair)} <HeartIcon className="closing__heart" aria-hidden="true" />
        </p>
        <a href="#home" onClick={go('home')} className="closing__top">
          <ArrowUp /> {t.closing.top}
        </a>
      </div>
    </footer>
  )
}
