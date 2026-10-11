import { describe, expect, it } from 'vitest'
import { wedding } from '../config/wedding'
import {
  calendarDaysUntil,
  istDateKey,
  istMidnight,
  parseIsoDate,
  splitRemaining,
  untilCelebrations,
  untilDay,
  weddingPhase,
  weekdayOf,
} from './time'

const utc = (iso: string) => new Date(iso)

describe('confirmed wedding dates', () => {
  it('are Sunday 15 and Monday 16 November 2026', () => {
    expect(wedding.days.map((d) => d.date)).toEqual(['2026-11-15', '2026-11-16'])
    expect(weekdayOf('2026-11-15')).toBe(0)
    expect(weekdayOf('2026-11-16')).toBe(1)
  })
})

describe('parseIsoDate', () => {
  it('parses field by field', () => {
    expect(parseIsoDate('2026-11-15')).toEqual({ year: 2026, month: 11, day: 15 })
  })
  it('rejects malformed and impossible dates', () => {
    expect(() => parseIsoDate('2026-11-31')).toThrow()
    expect(() => parseIsoDate('15/11/2026')).toThrow()
  })
})

describe('IST calendar dates', () => {
  it('00:00 IST on 15 Nov is 18:30 UTC on 14 Nov', () => {
    expect(istMidnight('2026-11-15').toISOString()).toBe('2026-11-14T18:30:00.000Z')
  })
  it('an instant late on 14 Nov UTC is already 15 Nov in India', () => {
    expect(istDateKey(utc('2026-11-14T18:30:00Z'))).toBe('2026-11-15')
    expect(istDateKey(utc('2026-11-14T18:29:59Z'))).toBe('2026-11-14')
  })
  it('does not depend on the machine timezone (pure UTC arithmetic)', () => {
    // 23:59:59 IST on 16 Nov is still day two, one second later is "after"
    expect(istDateKey(utc('2026-11-16T18:29:59Z'))).toBe('2026-11-16')
    expect(istDateKey(utc('2026-11-16T18:30:00Z'))).toBe('2026-11-17')
  })
})

describe('wedding phase', () => {
  it('moves before → day-1 → day-2 → after on IST midnights', () => {
    expect(weddingPhase(utc('2026-11-14T18:29:59Z'))).toBe('before')
    expect(weddingPhase(utc('2026-11-14T18:30:00Z'))).toBe('day-1')
    expect(weddingPhase(utc('2026-11-15T18:30:00Z'))).toBe('day-2')
    expect(weddingPhase(utc('2026-11-16T18:30:00Z'))).toBe('after')
  })
})

describe('countdown', () => {
  it('is computed from the clock, not hard-coded', () => {
    const r = untilCelebrations(utc('2026-10-11T12:00:00Z'))
    // 14 Nov 18:30 UTC − 11 Oct 12:00 UTC = 34 days 6 h 30 min
    expect(r).toMatchObject({ days: 34, hours: 6, minutes: 30, seconds: 0 })
  })
  it('counts down the final seconds and clamps at zero', () => {
    expect(untilCelebrations(utc('2026-11-14T18:29:58Z')).seconds).toBe(2)
    expect(untilCelebrations(utc('2026-11-14T18:30:00Z')).totalMs).toBe(0)
    expect(untilCelebrations(utc('2027-01-01T00:00:00Z')).totalMs).toBe(0)
  })
  it('day two counts down to its own IST midnight', () => {
    expect(untilDay('2026-11-16', utc('2026-11-15T06:30:00Z'))).toMatchObject({ days: 0, hours: 12, minutes: 0 })
  })
  it('never yields negative or non-finite parts', () => {
    expect(splitRemaining(-5000)).toEqual({ totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0 })
    expect(splitRemaining(Number.NaN).totalMs).toBe(0)
  })
})

describe('calendar days until', () => {
  it('counts IST calendar days', () => {
    expect(calendarDaysUntil('2026-11-15', utc('2026-11-14T18:30:00Z'))).toBe(0)
    expect(calendarDaysUntil('2026-11-16', utc('2026-11-14T18:30:00Z'))).toBe(1)
    expect(calendarDaysUntil('2026-11-15', utc('2026-11-16T19:00:00Z'))).toBe(-2)
  })
})
