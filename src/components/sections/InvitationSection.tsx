import { wedding } from '../../config/wedding'
import { useI18n } from '../../i18n/useI18n'
import { JasmineStrand } from '../decor/Garlands'
import { GoldRule, MandapEmblem } from '../decor/Ornaments'
import './invitation.css'
import { SceneBackdrop } from '../decor/SceneBackdrop'
import { FloralFrame } from '../decor/FloralFrame'


/**
 * The invitation (Reference B, screen 2): a parchment scroll on gold-capped
 * rollers, the mandap emblem, the invitation wording and the D&V wax seal with
 * its tassels. Only confirmed details appear in the wording.
 */
export function InvitationSection() {
  const { t } = useI18n()
  return (
    <section id="invitation" aria-labelledby="invitation-title" className="invitation scene scene--fade-top scene--fade-bottom">
      <SceneBackdrop className="invitation__bg" />
      <div className="invitation__veil" aria-hidden="true" />
      <FloralFrame />
      <img className="decor invitation__garland invitation__garland--left" src="/site/strand.webp" alt="" loading="lazy" />
      <img className="decor invitation__garland invitation__garland--right" src="/site/strand.webp" alt="" loading="lazy" />
      <img className="decor invitation__lamp invitation__lamp--l" src="/site/lamp.webp" alt="" loading="lazy" />
      <img className="decor invitation__lamp invitation__lamp--r" src="/site/lamp.webp" alt="" loading="lazy" />

      <header data-reveal="0" className="invitation__head">
        <svg viewBox="0 0 120 30" className="invitation__crest" aria-hidden="true" focusable="false">
          <path d="M10 18h38M72 18h38" stroke="#b98a2e" strokeWidth="1" />
          <path d="M60 4c-4 4-6 8-6 11 0 4 2.6 7 6 8.6 3.4-1.6 6-4.6 6-8.6 0-3-2-7-6-11Z" fill="#c99a44" fillOpacity="0.45" stroke="#a87c2c" strokeWidth="1.1" />
          <path d="M54 18c-5-3-10-3-14 0 4 3 9 3 14 0ZM66 18c5-3 10-3 14 0-4 3-9 3-14 0Z" fill="none" stroke="#a87c2c" strokeWidth="1" />
        </svg>
        <h2 id="invitation-title" className="title-caps">
          {t.invitation.title}
        </h2>
        <p className="title-lead">{t.invitation.lead}</p>
      </header>

      <div data-reveal="1" className="scroll">
        <div className="scroll__roll scroll__roll--top" aria-hidden="true">
          <span className="scroll__knob scroll__knob--l" />
          <span className="scroll__knob scroll__knob--r" />
          <span className="scroll__tassel scroll__tassel--l" />
          <span className="scroll__tassel scroll__tassel--r" />
        </div>

        <article className="scroll__paper">
          <MandapEmblem className="scroll__emblem" />
          <p className="scroll__you">{t.invitation.youAre}</p>
          <p className="scroll__invited">{t.invitation.cordially}</p>
          <p className="scroll__to">{t.invitation.toCelebrate}</p>
          <p className="scroll__names">
            <span>{wedding.couple.first}</span>
            <span className="scroll__amp">&amp;</span>
            <span>{wedding.couple.second}</span>
          </p>
          <GoldRule className="scroll__rule" />
          <p className="scroll__date">
            {t.date.invitation.d1}
            {t.date.invitation.s1 && <sup>{t.date.invitation.s1}</sup>} &amp; {t.date.invitation.d2}
            {t.date.invitation.s2 && <sup>{t.date.invitation.s2}</sup>}
            <br />
            {t.date.invitation.monthYear}
          </p>
          <p className="scroll__venue">
            {t.venue.name}
            <br />
            {t.city}
          </p>
        </article>

        <div className="scroll__roll scroll__roll--bottom" aria-hidden="true">
          <span className="scroll__knob scroll__knob--l" />
          <span className="scroll__knob scroll__knob--r" />
        </div>
        <div className="scroll__seal" aria-hidden="true">
          <img className="scroll__seal-art" src="/site/seal-tassels.webp" alt="" width={360} height={415} loading="lazy" />
        </div>
        <JasmineStrand className="decor scroll__sprig scroll__sprig--l" length={120} seed={41} />
        <JasmineStrand className="decor scroll__sprig scroll__sprig--r" length={110} seed={42} />
      </div>
    </section>
  )
}
