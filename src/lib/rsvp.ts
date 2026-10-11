import { coupleNames, wedding } from '../config/wedding'

export type Attendance = 'accept' | 'decline'

export interface RsvpInput {
  name: string
  attendance: Attendance | null
  /** As typed (digits only); empty when not given. */
  guests: string
  note: string
}

export interface RsvpErrors {
  name?: string
  attendance?: string
  guests?: string
}

export const MAX_GUESTS = 20
export const MAX_NOTE = 400

/** Client-side checks only: what is required to compose a sensible message. */
export function validateRsvp(input: RsvpInput, t: { name: string; attendance: string; guests: string } = DEFAULT_ERRORS): RsvpErrors {
  const errors: RsvpErrors = {}
  if (!input.name.trim()) errors.name = t.name
  if (!input.attendance) errors.attendance = t.attendance
  if (input.attendance === 'accept' && input.guests !== '') {
    const n = Number(input.guests)
    if (!/^\d+$/.test(input.guests) || n < 1 || n > MAX_GUESTS) errors.guests = t.guests
  }
  return errors
}

export const DEFAULT_ERRORS = {
  name: 'Please enter your name.',
  attendance: 'Please choose whether you can join us.',
  guests: `Please enter a number of attendees from 1 to ${MAX_GUESTS}, or leave it empty.`,
}

/** The default (English) message text; the page passes translated strings. */
export interface RsvpWords {
  hello: (name: string) => string
  regarding: (couple: string, dates: string) => string
  accept: string
  decline: string
  guests: (n: string) => string
  note: (text: string) => string
}

export const EN_WORDS: RsvpWords = {
  hello: (name) => `Hello! I am ${name}.`,
  regarding: (couple, dates) => `Regarding the wedding of ${couple} on ${dates}, my attendance is:`,
  accept: 'Joyfully accepts',
  decline: 'Regretfully declines',
  guests: (n) => `Number of attendees: ${n}`,
  note: (text) => `Message for the couple: ${text}`,
}

/** A short, polite message for the family's WhatsApp, with collapsed whitespace. */
export function buildRsvpMessage(input: RsvpInput, words: RsvpWords = EN_WORDS, dates = '15–16 November 2026', couple: string = coupleNames): string {
  const name = input.name.trim().replace(/\s+/g, ' ')
  const note = input.note.trim().replace(/[ \t]+/g, ' ').slice(0, MAX_NOTE)
  const lines = [`${words.hello(name)} ${words.regarding(couple, dates)} ${input.attendance === 'accept' ? words.accept : words.decline}.`]
  if (input.attendance === 'accept' && input.guests) lines.push(words.guests(String(Number(input.guests))))
  if (note) lines.push(words.note(note))
  return lines.join('\n')
}

export function whatsappLink(message: string): string {
  return `${wedding.contact.whatsappUrl}?text=${encodeURIComponent(message)}`
}
