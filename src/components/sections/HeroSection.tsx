import { wedding } from '../../config/wedding'
import { scrollToSection } from '../../lib/browser'
import { weddingDateRangeOrdinal } from '../../lib/format'
import { ButtonLink } from '../ui/Button'
import { ArrowRight } from '../ui/icons'
import { Monogram } from '../ui/Monogram'

/** The royal wedding entrance — the page's only h1. */
export function HeroSection() {
  return (
    <section id="home" aria-labelledby="home-title" className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-[var(--header-h)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_50%_0%,#fde9c4_0%,#f7dcae_35%,#f3e5c8_70%,#fbf6ec_100%)]"
      />
      <div className="container-content grid items-center gap-10 py-12 md:grid-cols-2">
        <div className="text-center md:text-left">
          <Monogram size="md" className="mx-auto md:mx-0" />
          <p className="eyebrow mt-5">Two families · one beautiful journey</p>
          <h1 id="home-title" tabIndex={-1} className="mt-4 text-emerald-deep">
            <span className="script block text-[clamp(3.6rem,13vw,6.5rem)]">{wedding.couple.first}</span>
            <span className="script block text-[clamp(2rem,6vw,3rem)] text-gold-deep">&amp;</span>
            <span className="block font-display text-[clamp(3rem,11vw,5.5rem)] font-medium">{wedding.couple.second}</span>
          </h1>
          <p className="mt-5 font-display text-[1.35rem] text-ink">{weddingDateRangeOrdinal}</p>
          <p className="font-display text-[1.2rem] text-ink-soft">{wedding.venue.city}</p>
          <ButtonLink
            href="#invitation"
            className="mt-8"
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('invitation')
            }}
            trailingIcon={<ArrowRight />}
          >
            Enter the wedding
          </ButtonLink>
        </div>
        <div aria-hidden="true" className="mx-auto hidden aspect-[3/4] w-full max-w-md rounded-t-full border border-gold/50 bg-[linear-gradient(180deg,#f9e2bd,#e9cfa0)] md:block" />
      </div>
    </section>
  )
}
