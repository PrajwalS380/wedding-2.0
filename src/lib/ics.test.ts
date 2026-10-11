import { describe, expect, it } from 'vitest'
import { buildWeddingIcs, escapeText, fold, nextDay } from './ics'

const ics = buildWeddingIcs(new Date(Date.UTC(2026, 9, 12, 8, 30, 5)), 'https://example.test/')
const unfolded = ics.replace(/\r\n /g, '')

describe('wedding calendar file', () => {
  it('is an all-day event for 15 and 16 November with an exclusive end', () => {
    expect(ics).toContain('DTSTART;VALUE=DATE:20261115\r\n')
    expect(ics).toContain('DTEND;VALUE=DATE:20261117\r\n')
    expect(ics).not.toMatch(/DTSTART:\d|TZID/)
  })
  it('has the required structure and metadata', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true)
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
    expect(ics).toMatch(/\r\nUID:[^\r\n]+\r\n/)
    expect(ics).toContain('DTSTAMP:20261012T083005Z')
    expect(unfolded).toContain('SUMMARY:Wedding of Darshan & Vathsala')
  })
  it('places the event at the confirmed venue, escaped', () => {
    expect(unfolded).toContain('LOCATION:Bapuji Samudhaya Bhavan\\, Shamanur Road\\, Siddaveerappa Layout\\, Shamanur\\, Davangere\\, Karnataka 577004')
    expect(unfolded).toContain('google.com/maps/search/?api=1&query=Bapuji+Samudhaya+Bhavan')
  })
  it('uses CRLF everywhere and folds long lines at 75 octets', () => {
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
  })
})

describe('helpers', () => {
  it('rolls dates over month and year ends', () => {
    expect(nextDay('2026-11-16')).toBe('2026-11-17')
    expect(nextDay('2026-11-30')).toBe('2026-12-01')
    expect(nextDay('2026-12-31')).toBe('2027-01-01')
  })
  it('escapes text values', () => {
    expect(escapeText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne')
  })
  it('folds multi-byte text without splitting characters', () => {
    const line = 'DESCRIPTION:' + 'ಕನ್ನಡ'.repeat(20)
    const folded = fold(line)
    expect(folded.replace(/\r\n /g, '')).toBe(line)
  })
})
