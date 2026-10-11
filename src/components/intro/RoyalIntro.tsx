import { useEffect, useRef, useState } from 'react'
import { coupleNames, wedding } from '../../config/wedding'
import { weddingDateRange } from '../../lib/format'
import { TapIcon } from '../ui/icons'

interface Props {
  /** Called once, when the intro has finished (opened or skipped). */
  onComplete: () => void
}

/**
 * Royal invitation intro — Phase 1 shell.
 * A full-screen dialog over the real page; "Tap to open" and "Skip intro" both
 * reveal the main website. The cinematic doors / envelope sequence arrives in
 * Phase 2 and replaces the visuals, not this contract.
 */
export function RoyalIntro({ onComplete }: Props) {
  const [leaving, setLeaving] = useState(false)
  const openButton = useRef<HTMLButtonElement>(null)
  const done = useRef(false)

  useEffect(() => {
    openButton.current?.focus({ preventScroll: true })
  }, [])

  const finish = () => {
    if (done.current) return
    done.current = true
    setLeaving(true)
    window.setTimeout(onComplete, 450)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[radial-gradient(90%_70%_at_50%_35%,#2c5a43_0%,#0f3427_55%,#081d15_100%)] px-6 text-center text-gold-pale transition-opacity duration-500 ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <p className="caps text-[0.95rem] tracking-[0.3em] text-gold-pale">A Royal Invitation</p>
      <h2 id="intro-title" className="script mt-10 text-[clamp(2.8rem,11vw,4.5rem)] text-ivory">
        {wedding.couple.first} <span className="text-gold-light">&amp;</span> {wedding.couple.second}
      </h2>
      <p className="mt-4 font-display text-[1.25rem] text-gold-pale">
        {weddingDateRange} · {wedding.venue.city}
      </p>
      <button
        ref={openButton}
        type="button"
        onClick={finish}
        className="caps mt-10 inline-flex min-h-12 items-center gap-3 rounded-xl border border-gold-light bg-emerald px-8 text-[0.95rem] tracking-[0.24em] text-gold-pale [--focus-ring:var(--color-gold-light)]"
      >
        <TapIcon className="h-5 w-5" />
        Tap to open
        <span className="sr-only"> the invitation from {coupleNames}</span>
      </button>
      <button
        type="button"
        onClick={finish}
        className="caps absolute right-4 top-4 min-h-11 rounded-full px-4 text-[0.75rem] tracking-[0.2em] text-gold-pale/90 underline-offset-4 hover:underline [--focus-ring:var(--color-gold-light)]"
      >
        Skip intro
      </button>
    </div>
  )
}
