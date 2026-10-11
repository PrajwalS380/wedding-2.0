/**
 * The single source of truth for every confirmed wedding fact.
 *
 * Only details confirmed by the family live here. Ceremony times, family names
 * and an event-by-event programme have NOT been confirmed, so the website never
 * shows them — when they are confirmed, add them here and the sections pick
 * them up. Nothing in the UI should hard-code a date, address or number.
 */

export interface CelebrationDay {
  id: 'day-1' | 'day-2'
  /** Calendar date in the wedding's timezone (IST), YYYY-MM-DD. */
  date: string
}

export const wedding = {
  couple: {
    first: 'Darshan',
    second: 'Vathsala',
    monogram: { first: 'D', second: 'V' },
  },

  /** Every date is an all-day date reckoned in India Standard Time. */
  timezone: 'Asia/Kolkata',
  /** IST is a fixed UTC+05:30 offset (no daylight saving in India). */
  utcOffsetMinutes: 330,

  days: [
    { id: 'day-1', date: '2026-11-15' },
    { id: 'day-2', date: '2026-11-16' },
  ] as const satisfies readonly CelebrationDay[],

  venue: {
    name: 'Bapuji Samudhaya Bhavan',
    street: 'Shamanur Road',
    locality: 'Siddaveerappa Layout, Shamanur',
    city: 'Davangere',
    region: 'Karnataka',
    postalCode: '577004',
    /** The exact Google Maps destination supplied by the family. */
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=Bapuji+Samudhaya+Bhavan%2C+Shamanur+Road%2C+Siddaveerappa+Layout%2C+Shamanur%2C+Davangere%2C+Karnataka+577004',
  },

  contact: {
    /** RSVP + "Need help?" number, in international format without "+". */
    whatsappNumber: '919591420987',
    /** Human-readable form of the same number. */
    displayPhone: '+91 95914 20987',
    telHref: 'tel:+919591420987',
    whatsappUrl: 'https://wa.me/919591420987',
  },
} as const

/** "Bapuji Samudhaya Bhavan, Shamanur Road, …, Karnataka 577004" */
export const venueFullAddress = [
  wedding.venue.name,
  wedding.venue.street,
  wedding.venue.locality,
  wedding.venue.city,
  `${wedding.venue.region} ${wedding.venue.postalCode}`,
].join(', ')

/** The address without the venue name, for the address card. */
export const venueAddressLines = [
  `${wedding.venue.street}, ${wedding.venue.locality},`,
  `${wedding.venue.city}, ${wedding.venue.region} ${wedding.venue.postalCode}`,
] as const

export const coupleNames = `${wedding.couple.first} & ${wedding.couple.second}`
