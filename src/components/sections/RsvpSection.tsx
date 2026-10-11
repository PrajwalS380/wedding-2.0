import { useState, type FormEvent } from 'react'
import { coupleNames, wedding } from '../../config/wedding'
import { weddingDateRange } from '../../lib/format'
import { Button } from '../ui/Button'
import { WhatsAppIcon } from '../ui/icons'
import { SectionHeading } from '../ui/SectionHeading'

type Attendance = 'accept' | 'decline'

/**
 * RSVP card. Nothing is stored or sent by the website: the reply is prepared
 * as a WhatsApp message to the family and the guest sends it themselves.
 */
export function RsvpSection() {
  const [name, setName] = useState('')
  const [attendance, setAttendance] = useState<Attendance | null>(null)
  const [guests, setGuests] = useState('')
  const [errors, setErrors] = useState<{ name?: string; attendance?: string }>({})

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    const next: typeof errors = {}
    if (!trimmed) next.name = 'Please enter your name.'
    if (!attendance) next.attendance = 'Please choose whether you can join us.'
    setErrors(next)
    if (next.name || next.attendance) return
    const lines = [
      `Wedding RSVP — ${coupleNames}`,
      `Name: ${trimmed}`,
      `Attendance: ${attendance === 'accept' ? 'Joyfully accepts' : 'Regretfully declines'}`,
      ...(attendance === 'accept' && guests ? [`Number of attendees: ${guests}`] : []),
      `Dates: ${weddingDateRange}`,
    ]
    window.open(`${wedding.contact.whatsappUrl}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <section id="rsvp" aria-labelledby="rsvp-title" className="section bg-ivory-warm">
      <div className="container-content">
        <SectionHeading id="rsvp" eyebrow="R · S · V · P" title="Kindly let us know" />
        <form noValidate onSubmit={onSubmit} className="mx-auto mt-10 max-w-md rounded-[var(--radius-card)] border border-gold/50 bg-ivory px-6 py-8 shadow-[var(--shadow-card)]">
          <label htmlFor="rsvp-name" className="block font-display text-[1.1rem] text-ink">
            Your Name <span aria-hidden="true">*</span>
          </label>
          <input
            id="rsvp-name"
            name="name"
            autoComplete="name"
            required
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'rsvp-name-error' : undefined}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block min-h-11 w-full rounded-lg border border-gold/60 bg-white/70 px-3 text-ink"
          />
          {errors.name && (
            <p id="rsvp-name-error" className="mt-1 text-[0.92rem] text-maroon">
              {errors.name}
            </p>
          )}

          <fieldset className="mt-6" aria-describedby={errors.attendance ? 'rsvp-attendance-error' : undefined}>
            <legend className="font-display text-[1.1rem] text-ink">
              Will you join us? <span aria-hidden="true">*</span>
            </legend>
            {(
              [
                ['accept', 'Joyfully accepts'],
                ['decline', 'Regretfully declines'],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="mt-2 flex min-h-11 items-center gap-3 rounded-lg border border-gold/40 bg-white/60 px-3">
                <input type="radio" name="attendance" value={value} checked={attendance === value} onChange={() => setAttendance(value)} />
                <span>{label}</span>
              </label>
            ))}
            {errors.attendance && (
              <p id="rsvp-attendance-error" className="mt-1 text-[0.92rem] text-maroon">
                {errors.attendance}
              </p>
            )}
          </fieldset>

          {attendance !== 'decline' && (
            <>
              <label htmlFor="rsvp-guests" className="mt-6 block font-display text-[1.1rem] text-ink">
                Number of attendees (optional)
              </label>
              <input
                id="rsvp-guests"
                name="guests"
                inputMode="numeric"
                value={guests}
                onChange={(e) => setGuests(e.target.value.replace(/\D/g, '').slice(0, 2))}
                className="mt-1 block min-h-11 w-full rounded-lg border border-gold/60 bg-white/70 px-3 text-ink"
              />
            </>
          )}

          <Button type="submit" variant="maroon" className="mt-8 w-full" icon={<WhatsAppIcon className="h-5 w-5" />}>
            Send RSVP via WhatsApp
          </Button>
          <p className="mt-3 text-center text-[0.9rem] italic text-ink-soft">Your WhatsApp message will be prefilled. Please tap Send in WhatsApp to share your reply.</p>
        </form>
      </div>
    </section>
  )
}
