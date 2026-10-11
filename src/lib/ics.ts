import { venueFullAddress, wedding, coupleNames } from '../config/wedding'

/**
 * An all-day iCalendar (RFC 5545) event covering both wedding days.
 * All-day events use DATE values (no time, no timezone), so they never shift
 * when a calendar app converts timezones; DTEND is exclusive, so 15–16 November
 * ends on 17 November.
 */

const pad = (n: number) => String(n).padStart(2, '0')

/** 'YYYY-MM-DD' → 'YYYYMMDD' */
const icsDate = (iso: string) => iso.replace(/-/g, '')

/** The day after an ISO calendar date, computed on the calendar (no timezone involved). */
export function nextDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + 1))
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}

/** Escape TEXT values: backslash, semicolon, comma and newlines (RFC 5545 §3.3.11). */
export function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Fold lines longer than 75 octets (UTF-8), continuing with CRLF + space (RFC 5545 §3.1). */
export function fold(line: string): string {
  const enc = new TextEncoder()
  if (enc.encode(line).length <= 75) return line
  const out: string[] = []
  let cur = ''
  let size = 0
  for (const ch of line) {
    const n = enc.encode(ch).length
    const limit = out.length === 0 ? 75 : 74
    if (size + n > limit) {
      out.push(cur)
      cur = ''
      size = 0
    }
    cur += ch
    size += n
  }
  out.push(cur)
  return out.join('\r\n ')
}

const stamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`

export function buildWeddingIcs(now: Date = new Date(), pageUrl?: string): string {
  const first = wedding.days[0].date
  const last = wedding.days[wedding.days.length - 1].date
  const description = [`The wedding celebrations of ${coupleNames}.`, `Directions: ${wedding.venue.mapsUrl}`, ...(pageUrl ? [`Invitation: ${pageUrl}`] : [])].join('\n')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Darshan & Vathsala//Wedding Invitation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:wedding-${icsDate(first)}-darshan-vathsala@wedding-2.0`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART;VALUE=DATE:${icsDate(first)}`,
    `DTEND;VALUE=DATE:${icsDate(nextDay(last))}`,
    `SUMMARY:${escapeText(`Wedding of ${coupleNames}`)}`,
    `LOCATION:${escapeText(venueFullAddress)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `URL:${wedding.venue.mapsUrl}`,
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

export const ICS_FILENAME = 'darshan-vathsala-wedding.ics'

/** Offer the .ics file as a download (object URL created and revoked). */
export function downloadWeddingIcs(): boolean {
  try {
    const blob = new Blob([buildWeddingIcs(new Date(), window.location.origin + window.location.pathname)], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = ICS_FILENAME
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 4000)
    return true
  } catch {
    return false
  }
}
