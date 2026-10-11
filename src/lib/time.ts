/**
 * Wedding clock — pure functions, no React, no Intl time-zone lookups.
 *
 * Rules (identical for every visitor, wherever they are):
 *  • Everything is reckoned in India Standard Time (UTC+05:30, no DST), the
 *    wedding's timezone — a guest abroad sees the same day and countdown as a
 *    guest in Davangere.
 *  • Ceremony times are not confirmed, so the countdown is date-based: it runs
 *    to 00:00 IST on 15 November 2026, the first wedding day.
 *  • Dates are parsed field by field (never `new Date('YYYY-MM-DD')`, which
 *    browsers read as UTC midnight).
 *  • Remaining time is clamped at zero — a negative countdown is impossible.
 */
import { wedding } from '../config/wedding'

const OFFSET_MS = wedding.utcOffsetMinutes * 60_000
const DAY_MS = 86_400_000

export interface DateParts {
  year: number
  month: number
  day: number
}

export type WeddingPhase = 'before' | 'day-1' | 'day-2' | 'after'

export interface Remaining {
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function parseIsoDate(iso: string): DateParts {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) throw new Error(`Invalid ISO date: ${iso}`)
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const check = new Date(Date.UTC(year, month - 1, day))
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new Error(`Impossible calendar date: ${iso}`)
  }
  return { year, month, day }
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** 'YYYY-MM-DD' of an instant, as a calendar date in IST. */
export function istDateKey(instant: Date): string {
  const local = new Date(instant.getTime() + OFFSET_MS)
  return `${local.getUTCFullYear()}-${pad2(local.getUTCMonth() + 1)}-${pad2(local.getUTCDate())}`
}

/** The UTC instant of 00:00 IST on an ISO calendar date. */
export function istMidnight(iso: string): Date {
  const { year, month, day } = parseIsoDate(iso)
  return new Date(Date.UTC(year, month - 1, day) - OFFSET_MS)
}

/** Day of the week (0 = Sunday) of an ISO calendar date — independent of any timezone. */
export function weekdayOf(iso: string): number {
  const { year, month, day } = parseIsoDate(iso)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

export function splitRemaining(ms: number): Remaining {
  const totalMs = Math.max(0, Number.isFinite(ms) ? ms : 0)
  const total = Math.floor(totalMs / 1000)
  return {
    totalMs,
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  }
}

export function weddingPhase(now: Date): WeddingPhase {
  const today = istDateKey(now)
  const [first, second] = wedding.days
  if (today < first.date) return 'before'
  if (today === first.date) return 'day-1'
  if (today === second.date) return 'day-2'
  return 'after'
}

/** Time left until the celebrations begin (00:00 IST on the first day); zero once they have. */
export function untilCelebrations(now: Date): Remaining {
  return splitRemaining(istMidnight(wedding.days[0].date).getTime() - now.getTime())
}

/** Time left until a given wedding day begins (00:00 IST); zero on and after that day. */
export function untilDay(iso: string, now: Date): Remaining {
  return splitRemaining(istMidnight(iso).getTime() - now.getTime())
}

/** Whole IST calendar days from today to a date (0 = today, negative = past). */
export function calendarDaysUntil(iso: string, now: Date): number {
  const today = istMidnight(istDateKey(now)).getTime()
  return Math.round((istMidnight(iso).getTime() - today) / DAY_MS)
}
