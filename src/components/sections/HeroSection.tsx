import { wedding } from '../../config/wedding'
import { useI18n } from '../../i18n/useI18n'
import { scrollToSection } from '../../lib/browser'
import { LaurelMonogram } from '../decor/Ornaments'
import { PetalField } from '../effects/PetalField'
import { ButtonLink } from '../ui/Button'
import { ArrowRight } from '../ui/icons'
import '../../styles/site.css'
import './hero.css'

/**
 * The royal wedding entrance (Reference B, screen 1). The scene is a still of the
 * same palace garden the intro walks into, rendered from src/three in landscape and
 * portrait framings, with the couple (public/site/couple.svg) standing on the aisle,
 * backlit by the setting sun. Jasmine hangs at the edges. The only h1.
 */
export function HeroSection() {
  const { t } = useI18n()
  return (
    <section id="home" aria-labelledby="home-title" className="hero">
      <picture className="hero__scene">
        <source media="(min-aspect-ratio: 1/1)" srcSet="/site/hero-wide.webp" />
        <source media="(min-aspect-ratio: 3/5)" srcSet="/site/hero-tablet.webp" />
        <img
          src="/site/hero-tall.webp"
          alt={t.hero.sceneAlt}
          decoding="async"
          fetchPriority="high"
        />
      </picture>
      <div className="hero__light" aria-hidden="true" />
      <PetalField className="hero__petals" petals={14} motes={30} />

      <img className="decor hero__garland hero__garland--l" src="/site/garland.webp" alt="" />
      <img className="decor hero__garland hero__garland--r" src="/site/garland.webp" alt="" />
      <img className="decor hero__lotus" src="/site/lotus.webp" alt="" width={600} height={392} fetchPriority="high" />

      <div className="hero__content">
        <LaurelMonogram className="hero__monogram" />
        <p className="eyebrow-caps hero__eyebrow">
          {t.hero.tag1}
          <br />
          {t.hero.tag2}
        </p>
        <h1 id="home-title" tabIndex={-1} className="hero__names">
          <span className="hero__first">{wedding.couple.first}</span>
          <span className="hero__amp" aria-hidden="true">
            &amp;
          </span>
          <span className="sr-only"> {t.couple.and} </span>
          <span className="hero__second">{wedding.couple.second}</span>
        </h1>
        <p className="hero__date">{t.date.rangeOrdinal}</p>
        <p className="hero__place">{t.city}</p>
      </div>

      <div className="hero__actions">
        <ButtonLink
          href="#invitation"
          className="hero__cta"
          onClick={(e) => {
            e.preventDefault()
            scrollToSection('invitation')
          }}
          trailingIcon={<ArrowRight />}
        >
          {t.hero.enter}
        </ButtonLink>
        <span className="hero__scroll" aria-hidden="true">
          <span className="hero__mouse" />
          {t.hero.scroll}
        </span>
      </div>
    </section>
  )
}
