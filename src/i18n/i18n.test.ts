import { describe, expect, it } from 'vitest'
import { en } from './en'
import { hi } from './hi'
import { kn } from './kn'

/** Every leaf path of a dictionary, with its value. */
function leaves(obj: unknown, prefix = ''): Array<[string, unknown]> {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k))
  }
  return [[prefix, obj]]
}

const sample = (v: unknown, key = ''): string => {
  if (typeof v === 'string') return v
  if (typeof v === 'function') {
    // call with representative arguments: a wedding date for date formatters, a number and placeholders otherwise
    const args = key.startsWith('date.') ? ['2026-11-15'] : Array.from({ length: v.length }, (_, i) => (i === 0 ? 1 : 'X'))
    const out = (v as (...a: unknown[]) => unknown)(...args)
    return typeof out === 'string' ? out : String(out)
  }
  return String(v)
}

describe('translation dictionaries', () => {
  const enKeys = leaves(en).map(([k]) => k).sort()
  for (const [name, dict] of [
    ['kn', kn],
    ['hi', hi],
  ] as const) {
    it(`${name} has exactly the English keys`, () => {
      expect(leaves(dict).map(([k]) => k).sort()).toEqual(enKeys)
    })
    it(`${name} has no empty values and no raw keys`, () => {
      // ordinal suffixes ("th") have no equivalent in Kannada or Hindi dates: intentionally empty
      for (const [k, v] of leaves(dict).filter(([k]) => !/^date\.invitation\.s[12]$/.test(k))) {
        const s = sample(v, k)
        expect(s.trim(), k).not.toBe('')
        expect(s, k).not.toMatch(/^[a-z]+(\.[a-z-]+)+$/)
      }
    })
    it(`${name} does not leave English sentences behind`, () => {
      // Latin text allowed: names in design lettering, D&V, IST, (Send), digits, URLs
      const allowed = /^(?:[\s\d.,·:&–—()+\-/%]|D&V|IST|Send|WhatsApp|EN)*$/
      const english = leaves(dict)
        .filter(([k]) => !k.startsWith('date.invitation') && k !== 'meta.title')
        .map(([k, v]) => [k, sample(v, k).replace(/X/g, '')] as const)
        .filter(([, s]) => /[A-Za-z]{4,}/.test(s.replace(/D&V|IST|Send|WhatsApp/g, '')) && !allowed.test(s))
      expect(english).toEqual([])
    })
  }
  it('dates are the confirmed wedding days in every language', () => {
    expect(en.date.long('2026-11-15')).toBe('Sunday, 15 November 2026')
    expect(kn.date.long('2026-11-15')).toBe('ಭಾನುವಾರ, 2026ರ ನವೆಂಬರ್ 15')
    expect(hi.date.long('2026-11-16')).toBe('सोमवार, 16 नवंबर 2026')
    for (const d of [en, kn, hi]) expect(d.date.range).toMatch(/15.*16/)
  })
})
