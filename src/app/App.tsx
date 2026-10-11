import { useCallback, useEffect, useRef, useState } from 'react'
import { RoyalIntro } from '../components/intro/RoyalIntro'
import { SiteHeader } from '../components/layout/SiteHeader'
import { CalendarSection } from '../components/sections/CalendarSection'
import { CelebrationsSection } from '../components/sections/CelebrationsSection'
import { ClosingSection } from '../components/sections/ClosingSection'
import { CompassSection } from '../components/sections/CompassSection'
import { GuestServicesSection } from '../components/sections/GuestServicesSection'
import { HeroSection } from '../components/sections/HeroSection'
import { InvitationSection } from '../components/sections/InvitationSection'
import { RsvpSection } from '../components/sections/RsvpSection'
import { VenueSection } from '../components/sections/VenueSection'
import { readStorage, writeStorage } from '../lib/browser'

const INTRO_KEY = 'w2:intro'

/**
 * Intro persistence: shown on the first visit of a browsing session; once
 * opened or skipped it is not forced again on refresh in the same session.
 * `?intro` forces it, `?nointro` (or a deep link like #venue) skips it.
 * If storage cannot be read the intro simply shows — never a blank screen.
 */
function shouldShowIntro(): boolean {
  const params = new URLSearchParams(window.location.search)
  if (params.has('intro')) return true
  if (params.has('nointro')) return false
  if (window.location.hash && window.location.hash !== '#home') return false
  return readStorage('session', INTRO_KEY) !== 'seen'
}

export function App() {
  const [introOpen, setIntroOpen] = useState(shouldShowIntro)
  const focusHero = useRef(false)

  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', introOpen)
    // after the intro closes (and the page is no longer inert) hand focus to the hero heading
    if (!introOpen && focusHero.current) {
      focusHero.current = false
      document.getElementById('home-title')?.focus({ preventScroll: true })
    }
  }, [introOpen])

  const completeIntro = useCallback(() => {
    writeStorage('session', INTRO_KEY, 'seen')
    focusHero.current = true
    window.scrollTo({ top: 0 })
    setIntroOpen(false)
  }, [])

  return (
    <>
      <a href="#main" className="sr-only-focusable fixed left-3 top-3 z-[60] rounded-full bg-emerald px-4 py-2 text-gold-pale">
        Skip to content
      </a>
      <div inert={introOpen || undefined}>
        <SiteHeader />
        <main id="main">
          <HeroSection />
          <InvitationSection />
          <CalendarSection />
          <CompassSection />
          <CelebrationsSection />
          <VenueSection />
          <GuestServicesSection />
          <RsvpSection />
        </main>
        <ClosingSection />
      </div>
      {introOpen && <RoyalIntro onComplete={completeIntro} />}
    </>
  )
}
