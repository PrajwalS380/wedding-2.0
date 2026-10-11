import { describe, expect, it } from 'vitest'
import { coupleNames, venueFullAddress, wedding } from './wedding'

describe('confirmed wedding facts', () => {
  it('names the couple', () => {
    expect(coupleNames).toBe('Darshan & Vathsala')
  })

  it('uses the exact venue address', () => {
    expect(venueFullAddress).toBe(
      'Bapuji Samudhaya Bhavan, Shamanur Road, Siddaveerappa Layout, Shamanur, Davangere, Karnataka 577004',
    )
  })

  it('uses the exact Google Maps destination supplied by the family', () => {
    expect(wedding.venue.mapsUrl).toBe(
      'https://www.google.com/maps/search/?api=1&query=Bapuji+Samudhaya+Bhavan%2C+Shamanur+Road%2C+Siddaveerappa+Layout%2C+Shamanur%2C+Davangere%2C+Karnataka+577004',
    )
    // the encoded query decodes to the full address
    const q = new URL(wedding.venue.mapsUrl).searchParams.get('query')
    expect(q).toBe(venueFullAddress)
  })

  it('uses the confirmed RSVP / contact number everywhere', () => {
    expect(wedding.contact.whatsappNumber).toBe('919591420987')
    expect(wedding.contact.whatsappUrl).toBe('https://wa.me/919591420987')
    expect(wedding.contact.telHref).toBe('tel:+919591420987')
    expect(wedding.contact.displayPhone.replace(/\D/g, '')).toBe('919591420987')
  })

  it('keeps all dates in India Standard Time', () => {
    expect(wedding.timezone).toBe('Asia/Kolkata')
    expect(wedding.utcOffsetMinutes).toBe(330)
  })
})
