import { describe, expect, it } from 'vitest'
import { buildRsvpMessage, validateRsvp, whatsappLink } from './rsvp'

describe('RSVP validation', () => {
  it('requires a name and an attendance choice', () => {
    const e = validateRsvp({ name: '   ', attendance: null, guests: '', note: '' })
    expect(e.name).toBeTruthy()
    expect(e.attendance).toBeTruthy()
  })
  it('accepts an empty or sensible guest count, rejects others', () => {
    const base = { name: 'Asha', attendance: 'accept' as const, note: '' }
    expect(validateRsvp({ ...base, guests: '' })).toEqual({})
    expect(validateRsvp({ ...base, guests: '3' })).toEqual({})
    expect(validateRsvp({ ...base, guests: '0' }).guests).toBeTruthy()
    expect(validateRsvp({ ...base, guests: '21' }).guests).toBeTruthy()
  })
  it('ignores the guest count when declining', () => {
    expect(validateRsvp({ name: 'Asha', attendance: 'decline', guests: '0', note: '' })).toEqual({})
  })
})

describe('RSVP message', () => {
  it('identifies the guest, the wedding and the answer', () => {
    const m = buildRsvpMessage({ name: '  Asha   Rao ', attendance: 'accept', guests: '02', note: '  Congratulations! ' })
    expect(m).toBe('Hello! I am Asha Rao. Regarding the wedding of Darshan & Vathsala on 15–16 November 2026, my attendance is: Joyfully accepts.\nNumber of attendees: 2\nMessage for the couple: Congratulations!')
  })
  it('leaves out the count when declining', () => {
    const m = buildRsvpMessage({ name: 'Asha', attendance: 'decline', guests: '4', note: '' })
    expect(m).toContain('Regretfully declines')
    expect(m).not.toContain('attendees')
  })
  it('encodes the message for the confirmed WhatsApp number', () => {
    const url = whatsappLink('Hi & bye\nline two')
    expect(url).toBe('https://wa.me/919591420987?text=Hi%20%26%20bye%0Aline%20two')
  })
})
