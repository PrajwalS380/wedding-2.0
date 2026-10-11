/**
 * Date display for the confirmed wedding dates. Explicit name tables (no Intl
 * time-zone formatting), so a date can never shift with the visitor's timezone.
 */
import { wedding } from '../config/wedding'
import { parseIsoDate, weekdayOf } from './time'

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export function ordinalSuffix(n: number): string {
  const v = n % 100
  if (v >= 11 && v <= 13) return 'th'
  return ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'
}

export const weekdayName = (iso: string) => WEEKDAYS[weekdayOf(iso)]
export const monthName = (iso: string) => MONTHS[parseIsoDate(iso).month - 1]
export const shortMonth = (iso: string) => monthName(iso).slice(0, 3)

/** "Sunday, 15 November 2026" */
export function formatLongDate(iso: string): string {
  const { day, year } = parseIsoDate(iso)
  return `${weekdayName(iso)}, ${day} ${monthName(iso)} ${year}`
}

/** "15 Nov 2026" */
export function formatShortDate(iso: string): string {
  const { day, year } = parseIsoDate(iso)
  return `${day} ${shortMonth(iso)} ${year}`
}

const [first, second] = wedding.days
const d1 = parseIsoDate(first.date)
const d2 = parseIsoDate(second.date)

/** "15 & 16 November 2026" — both days share a month and year. */
export const weddingDateRange = `${d1.day} & ${d2.day} ${monthName(first.date)} ${d1.year}`

/** "15th & 16th November 2026" */
export const weddingDateRangeOrdinal = `${d1.day}${ordinalSuffix(d1.day)} & ${d2.day}${ordinalSuffix(d2.day)} ${monthName(first.date)} ${d1.year}`
