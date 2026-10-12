import type { ReactNode } from 'react'
import { wedding } from '../../config/wedding'
import { useI18n } from '../../i18n/useI18n'
import { scrollToSection } from '../../lib/browser'
import { SceneBackdrop } from '../decor/SceneBackdrop'
import { GoldRule, OrnateFrame } from '../decor/Ornaments'
import { LotusIcon, MapPin, PhoneIcon, SuitcaseIcon, WhatsAppIcon } from '../ui/icons'
import { FloralFrame } from '../decor/FloralFrame'
import '../../styles/site.css'
import './guest-services.css'

function ServiceCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li>
      <OrnateFrame as="article" className="service">
        <span className="service__icon" aria-hidden="true">
          {icon}
        </span>
        <h3 className="service__title">{title}</h3>
        <GoldRule className="service__rule" />
        <div className="service__body">{children}</div>
      </OrnateFrame>
    </li>
  )
}

/**
 * Guest services (Reference B, screen 7). Practical guidance only: nothing here
 * promises accommodation, transport or services the family has not arranged.
 * The help card uses the family's confirmed number.
 */
export function GuestServicesSection() {
  const { t } = useI18n()
  return (
    <section id="guest-services" aria-labelledby="guest-services-title" className="services scene scene--fade-top scene--fade-bottom">
      <SceneBackdrop className="services__bg" />
      <div className="services__veil" aria-hidden="true" />
      <FloralFrame />

      <header data-reveal="0" className="services__head">
        <p className="eyebrow-caps">{t.services.eyebrow}</p>
        <h2 id="guest-services-title" className="title-caps">
          {t.services.title}
        </h2>
        <p className="title-lead">{t.services.lead}</p>
      </header>

      <ul data-reveal="1" className="services__grid">
        <ServiceCard icon={<SuitcaseIcon />} title={t.services.travel}>
          <p>{t.services.travelBody}</p>
          <a
            className="service__link"
            href="#venue"
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('venue')
            }}
          >
            {t.services.seeVenue}
          </a>
        </ServiceCard>
        <ServiceCard icon={<MapPin />} title={t.services.local}>
          <p>{t.services.localBody}</p>
        </ServiceCard>
        <ServiceCard icon={<LotusIcon />} title={t.services.etiquette}>
          <p>{t.services.etiquetteBody}</p>
        </ServiceCard>
        <ServiceCard icon={<PhoneIcon />} title={t.services.help}>
          <p>{t.services.helpBody}</p>
          <p className="service__phone">{wedding.contact.displayPhone}</p>
          <div className="service__actions">
            <a className="service__btn" href={wedding.contact.telHref}>
              <PhoneIcon className="h-4 w-4" /> {t.services.call}
              <span className="sr-only"> {wedding.contact.displayPhone}</span>
            </a>
            <a className="service__btn service__btn--wa" href={wedding.contact.whatsappUrl} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="h-4 w-4" /> {t.services.whatsapp}
              <span className="sr-only"> {wedding.contact.displayPhone} {t.common.waNewTab}</span>
            </a>
          </div>
        </ServiceCard>
      </ul>

      <div data-reveal="2" className="services__window" aria-hidden="true">
        <img src="/site/lounge-wide.webp" alt="" width={1920} height={960} loading="lazy" decoding="async" />
      </div>
    </section>
  )
}
