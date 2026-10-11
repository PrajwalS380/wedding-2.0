import { useState, type FormEvent } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { buildRsvpMessage, MAX_GUESTS, MAX_NOTE, validateRsvp, whatsappLink, type Attendance, type RsvpErrors } from '../../lib/rsvp'
import { SceneBackdrop } from '../decor/SceneBackdrop'
import { GoldRule, OrnateFrame } from '../decor/Ornaments'
import { WhatsAppIcon } from '../ui/icons'
import { FloralFrame } from '../decor/FloralFrame'
import '../../styles/site.css'
import './rsvp.css'

/**
 * RSVP (Reference B, screen 8). Nothing is stored or sent by the website: the
 * reply is composed as a WhatsApp message to the family's number, in the
 * visitor's language, and the guest reviews and sends it themselves.
 */
export function RsvpSection() {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [attendance, setAttendance] = useState<Attendance | null>(null)
  const [guests, setGuests] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<RsvpErrors>({})
  const [readyUrl, setReadyUrl] = useState<string | null>(null)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const input = { name, attendance, guests, note }
    const next = validateRsvp(input, { name: t.rsvp.errors.name, attendance: t.rsvp.errors.attendance, guests: t.rsvp.errors.guests(MAX_GUESTS) })
    setErrors(next)
    if (next.name || next.attendance || next.guests) {
      setReadyUrl(null)
      document.getElementById(next.name ? 'rsvp-name' : next.attendance ? 'rsvp-accept' : 'rsvp-guests')?.focus()
      return
    }
    const url = whatsappLink(buildRsvpMessage(input, t.rsvp.message, t.date.rangeDash, t.couple.pair))
    setReadyUrl(url)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const choices: ReadonlyArray<readonly [Attendance, string, string]> = [
    ['accept', t.rsvp.accept, t.rsvp.acceptHint],
    ['decline', t.rsvp.decline, t.rsvp.declineHint],
  ]

  return (
    <section id="rsvp" aria-labelledby="rsvp-title" className="rsvp scene scene--fade-top scene--fade-bottom">
      <SceneBackdrop className="rsvp__bg" />
      <div className="rsvp__veil" aria-hidden="true" />
      <FloralFrame />
      <img className="decor rsvp__lotus" src="/site/lotus.webp" alt="" loading="lazy" />

      <OrnateFrame as="form" data-reveal="0" className="rsvp__card" noValidate onSubmit={onSubmit} aria-labelledby="rsvp-title">
        <p className="rsvp__eyebrow" aria-hidden="true">
          {t.rsvp.eyebrow}
        </p>
        <h2 id="rsvp-title" className="rsvp__title">
          {t.rsvp.title}
        </h2>
        <GoldRule className="rsvp__rule" />

        <div className="rsvp__field">
          <label htmlFor="rsvp-name" className="rsvp__label">
            {t.rsvp.name} <span aria-hidden="true">*</span>
          </label>
          <input
            id="rsvp-name"
            name="name"
            autoComplete="name"
            placeholder={t.rsvp.namePh}
            required
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'rsvp-name-error' : undefined}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rsvp__input"
          />
          {errors.name && (
            <p id="rsvp-name-error" className="rsvp__error">
              {errors.name}
            </p>
          )}
        </div>

        <fieldset className="rsvp__field" aria-describedby={errors.attendance ? 'rsvp-attendance-error' : undefined}>
          <legend className="rsvp__label">
            {t.rsvp.join} <span aria-hidden="true">*</span>
          </legend>
          <div className="rsvp__choices">
            {choices.map(([value, label, hint]) => (
              <label key={value} className={`rsvp__choice ${attendance === value ? 'is-checked' : ''}`}>
                <input id={`rsvp-${value}`} type="radio" name="attendance" value={value} checked={attendance === value} onChange={() => setAttendance(value)} />
                <span className="rsvp__mark" aria-hidden="true" />
                <span className="rsvp__choice-text">
                  <span className="rsvp__choice-label">{label}</span>
                  <span className="rsvp__choice-hint">{hint}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.attendance && (
            <p id="rsvp-attendance-error" className="rsvp__error">
              {errors.attendance}
            </p>
          )}
        </fieldset>

        {attendance !== 'decline' && (
          <div className="rsvp__field">
            <label htmlFor="rsvp-guests" className="rsvp__label">
              {t.rsvp.guests} <span className="rsvp__optional">{t.rsvp.optional}</span>
            </label>
            <input
              id="rsvp-guests"
              name="guests"
              inputMode="numeric"
              placeholder={t.rsvp.guestsPh}
              aria-invalid={!!errors.guests}
              aria-describedby={errors.guests ? 'rsvp-guests-error' : undefined}
              value={guests}
              onChange={(e) => setGuests(e.target.value.trim())}
              className="rsvp__input"
            />
            {errors.guests && (
              <p id="rsvp-guests-error" className="rsvp__error">
                {errors.guests}
              </p>
            )}
          </div>
        )}

        <div className="rsvp__field">
          <label htmlFor="rsvp-note" className="rsvp__label">
            {t.rsvp.note} <span className="rsvp__optional">{t.rsvp.optional}</span>
          </label>
          <textarea id="rsvp-note" name="note" rows={3} maxLength={MAX_NOTE} placeholder={t.rsvp.notePh} value={note} onChange={(e) => setNote(e.target.value)} className="rsvp__input rsvp__textarea" />
        </div>

        <button type="submit" className="rsvp__send">
          <WhatsAppIcon className="h-5 w-5" /> {t.rsvp.send}
        </button>
        <p className="rsvp__note">{t.rsvp.helper}</p>

        <div className="rsvp__ready" role="status" aria-live="polite">
          {readyUrl && (
            <>
              <p className="rsvp__ready-title">{t.rsvp.ready}</p>
              <p className="rsvp__ready-note">{t.rsvp.readyNote}</p>
              <a className="rsvp__ready-link" href={readyUrl} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="h-4 w-4" /> {t.rsvp.openWa}
                <span className="sr-only"> {t.common.waNewTab}</span>
              </a>
            </>
          )}
        </div>
        <p className="rsvp__privacy">{t.rsvp.privacy}</p>
      </OrnateFrame>
    </section>
  )
}
