import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { SECTIONS, SECTION_IDS } from '../../config/sections'
import { useActiveSection } from '../../hooks/useActiveSection'
import { scrollToSection } from '../../lib/browser'
import { CloseIcon, MenuIcon } from '../ui/icons'
import { Monogram } from '../ui/Monogram'

/**
 * Fixed header: monogram + section links on desktop, a menu drawer on phones.
 * Links are real anchors (work without JavaScript); clicks are enhanced with
 * smooth scrolling and focus management.
 */
export function SiteHeader() {
  const active = useActiveSection(SECTION_IDS)
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        menuButton.current?.focus()
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
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-[var(--ease-silk)] ${
        scrolled ? 'bg-ivory/85 shadow-[0_10px_30px_-20px_rgb(58_42_27/0.5)] backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="container-content flex h-[var(--header-h)] items-center justify-between gap-4">
        <a href="#home" onClick={go('home')} className="shrink-0 rounded-full" aria-label="D&V — Darshan & Vathsala, back to the top">
          <Monogram size="sm" wreath={false} />
        </a>

        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="flex items-center gap-1 xl:gap-2">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={go(s.id)}
                  aria-current={active === s.id ? 'true' : undefined}
                  className={`caps inline-flex min-h-11 items-center rounded-full px-3 text-[0.72rem] font-semibold transition-colors duration-300 ${
                    active === s.id ? 'text-maroon' : 'text-emerald-deep hover:text-gold-deep'
                  }`}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          ref={menuButton}
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/60 bg-ivory/80 text-emerald-deep shadow-sm lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Sections" className="fixed inset-x-0 bottom-0 top-[var(--header-h)] overflow-y-auto bg-ivory px-6 pb-10 pt-6 lg:hidden">
          <ul className="mx-auto flex max-w-sm flex-col gap-1">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={go(s.id)}
                  aria-current={active === s.id ? 'true' : undefined}
                  className="caps flex min-h-12 items-center justify-center rounded-full text-[0.9rem] font-semibold text-emerald-deep hover:bg-parchment/60"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
