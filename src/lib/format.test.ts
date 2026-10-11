import { describe, expect, it } from 'vitest'
import { formatLongDate, formatShortDate, ordinalSuffix, weddingDateRange, weddingDateRangeOrdinal } from './format'

describe('date display', () => {
  it('formats the confirmed days exactly', () => {
    expect(formatLongDate('2026-11-15')).toBe('Sunday, 15 November 2026')
    expect(formatLongDate('2026-11-16')).toBe('Monday, 16 November 2026')
    expect(formatShortDate('2026-11-15')).toBe('15 Nov 2026')
  })
  it('builds the wedding date range', () => {
    expect(weddingDateRange).toBe('15 & 16 November 2026')
    expect(weddingDateRangeOrdinal).toBe('15th & 16th November 2026')
  })
  it('uses correct English ordinals', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101].map((n) => n + ordinalSuffix(n))).toEqual([
      '1st',
      '2nd',
      '3rd',
      '4th',
      '11th',
      '12th',
      '13th',
      '21st',
      '22nd',
      '23rd',
      '101st',
    ])
  })
})
