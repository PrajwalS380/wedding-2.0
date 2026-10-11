import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { SECTIONS, SECTION_IDS } from '../../config/sections'
import { useActiveSection } from '../../hooks/useActiveSection'
import { scrollToSection } from '../../lib/browser'
import { LANGUAGES } from '../../i18n/context'
import { useI18n } from '../../i18n/useI18n'
import { GoldRule } from '../decor/Ornaments'
import { CloseIcon, MenuIcon } from '../ui/icons'
import { Monogram } from '../ui/Monogram'
import { MusicButton } from '../music/MusicButton'
import './header.css'

/** Sections shown in the bar itself on wide screens; every section is in the menu. */
const PRIMARY = new Set(['invitation', 'calendar', 'celebrations', 'venue', 'guest-services'])
const WIDE = new Set(['compass'])

/**
 * Fixed header: the monogram, the main sections and an RSVP pill on wide screens,
 * and a menu at every size — a full-screen sheet on phones, an ivory side panel on
 * larger screens. Links are real anchors (they work without JavaScript); clicks are
 * enhanced with smooth scrolling and focus management.
 */
/** EN · ಕನ್ನಡ · हिन्दी — switches the whole page in place (scroll, form input and music are untouched). */
export function LanguageSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n()
  return (
    <div role="group" aria-label={t.lang.choose} className={`lang-switch ${className}`}>
      {LANGUAGES.map((l) => (
        <button key={l.code} type="button" lang={l.code} aria-pressed={lang === l.code} onClick={() => setLang(l.code)}>
          {l.label}
        </button>
      ))}
    </div>
  )
}

export function SiteHeader() {
  const { t } = useI18n()
  const active = useActiveSection(SECTION_IDS)
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    root.classList.add('is-locked')
    panel.current?.querySelector<HTMLElement>('a, button')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        menuButton.current?.focus()
      }
      // keep Tab inside the open menu
      if (e.key === 'Tab' && panel.current) {
        const items = [...panel.current.querySelectorAll<HTMLElement>('a, button')]
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      root.classList.remove('is-locked')
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (id: string) => (e: MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    scrollToSection(id)
  }

  return (
    <header className={`site-header ${scrolled ? 'site-header--scrolled' : ''}`}>
      <div className="container-content site-header__bar">
        <a href="#home" onClick={go('home')} className="site-header__brand" aria-label={t.nav.brand}>
          <Monogram size="sm" wreath={false} />
        </a>

        <nav aria-label={t.nav.main} className="site-header__nav">
          <ul>
            {SECTIONS.filter((s) => PRIMARY.has(s.id) || WIDE.has(s.id)).map((s) => (
              <li key={s.id} className={WIDE.has(s.id) ? 'site-header__wide' : undefined}>
                <a href={`#${s.id}`} onClick={go(s.id)} aria-current={active === s.id ? 'true' : undefined}>
                  {t.nav[s.id]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__end">
          <LanguageSwitch className="site-header__lang" />
          <MusicButton />
          <a href="#rsvp" onClick={go('rsvp')} className="site-header__rsvp" aria-current={active === 'rsvp' ? 'true' : undefined}>
            {t.nav.rsvp}
          </a>
          <button
            ref={menuButton}
            type="button"
            className="site-header__menu-btn"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            <span className="sr-only">{open ? t.nav.close : t.nav.open}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="site-menu" id="site-menu">
          <button type="button" className="site-menu__scrim" tabIndex={-1} aria-hidden="true" onClick={() => setOpen(false)} />
          <div ref={panel} className="site-menu__panel" role="dialog" aria-modal="true" aria-label={t.nav.menu}>
            <div className="site-menu__head">
              <Monogram size="md" />
              <p className="site-menu__names">
                Darshan <span>&amp;</span> Vathsala
              </p>
              <GoldRule className="site-menu__rule" />
              <p className="site-menu__date">
                {t.date.range} · {t.city}
              </p>
            </div>
            <LanguageSwitch className="site-menu__lang" />
            <nav aria-label={t.nav.all}>
              <ul className="site-menu__list">
                {SECTIONS.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} onClick={go(s.id)} aria-current={active === s.id ? 'true' : undefined}>
                      <span className="site-menu__num" aria-hidden="true">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {t.nav[s.id]}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <button
              type="button"
              className="site-menu__close"
              onClick={() => {
                setOpen(false)
                menuButton.current?.focus()
              }}
            >
              {t.nav.close}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
