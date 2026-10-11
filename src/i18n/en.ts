import { wedding } from '../config/wedding'
import { ordinalSuffix } from '../lib/format'
import { parseIsoDate, weekdayOf } from '../lib/time'

/**
 * English — the source dictionary. Kannada and Hindi must provide exactly the
 * same keys (the Messages type enforces it). Dates are formatted from the
 * confirmed IST calendar dates with explicit name tables, never with the
 * visitor's timezone, so no language can shift a date.
 */
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const [D1, D2] = wedding.days.map((d) => parseIsoDate(d.date))
const MONTH = MONTHS[D1.month - 1]

export const en = {
  meta: {
    title: 'Darshan & Vathsala — A Royal Wedding Invitation',
    description: 'Darshan & Vathsala warmly invite you to their wedding on 15 & 16 November 2026 at Bapuji Samudhaya Bhavan, Davangere.',
  },
  lang: { label: 'Language', choose: 'Choose a language' },
  common: {
    mapsNewTab: '(opens Google Maps in a new tab)',
    waNewTab: '(opens WhatsApp in a new tab)',
  },
  couple: { first: 'Darshan', second: 'Vathsala', pair: 'Darshan & Vathsala', and: 'and' },
  city: 'Davangere',
  region: 'Karnataka',
  venue: {
    name: 'Bapuji Samudhaya Bhavan',
    line1: 'Shamanur Road, Siddaveerappa Layout, Shamanur,',
    line2: 'Davangere, Karnataka 577004',
  },
  date: {
    weekday: (iso: string) => WEEKDAYS[weekdayOf(iso)],
    long: (iso: string) => {
      const d = parseIsoDate(iso)
      return `${WEEKDAYS[weekdayOf(iso)]}, ${d.day} ${MONTHS[d.month - 1]} ${d.year}`
    },
    short: (iso: string) => {
      const d = parseIsoDate(iso)
      return `${d.day} ${MONTHS[d.month - 1].slice(0, 3)} ${d.year}`
    },
    monthYear: (iso: string) => {
      const d = parseIsoDate(iso)
      return `${MONTHS[d.month - 1].slice(0, 3)} ${d.year}`
    },
    /** "15 & 16 November 2026" */
    range: `${D1.day} & ${D2.day} ${MONTH} ${D1.year}`,
    /** "15th & 16th November 2026" */
    rangeOrdinal: `${D1.day}${ordinalSuffix(D1.day)} & ${D2.day}${ordinalSuffix(D2.day)} ${MONTH} ${D1.year}`,
    /** "15–16 November 2026" (inside messages) */
    rangeDash: `${D1.day}–${D2.day} ${MONTH} ${D1.year}`,
    /** The invitation's two-line date, with superscript ordinals. */
    invitation: { d1: String(D1.day), s1: ordinalSuffix(D1.day), d2: String(D2.day), s2: ordinalSuffix(D2.day), monthYear: `${MONTH} ${D1.year}` },
  },
  skipToContent: 'Skip to content',
  nav: {
    home: 'Home',
    invitation: 'Invitation',
    calendar: 'Calendar',
    compass: 'Compass',
    celebrations: 'Celebrations',
    venue: 'Venue',
    'guest-services': 'Guest Services',
    rsvp: 'RSVP',
    main: 'Main sections',
    all: 'All sections',
    open: 'Open menu',
    close: 'Close menu',
    menu: 'Menu',
    brand: 'D&V — Darshan & Vathsala, back to the top',
  },
  intro: {
    title: 'A Royal Invitation',
    open: 'Tap to open',
    openLabel: 'Tap to open the invitation',
    skip: 'Skip intro',
    preparing: 'Preparing your invitation…',
  },
  hero: {
    tag1: 'Two families',
    tag2: 'one beautiful journey',
    enter: 'Enter the wedding',
    scroll: 'Scroll to explore',
    sceneAlt: 'An illustration of Darshan and Vathsala in wedding attire, garlanded and hand in hand, beneath a flowered archway in a palace garden at sunset',
  },
  invitation: {
    title: 'The Invitation',
    lead: 'With the blessings of our families',
    youAre: 'You Are',
    cordially: 'Cordially Invited',
    toCelebrate: 'to celebrate the wedding of',
  },
  calendar: {
    eyebrow: 'A two-day celebration',
    title1: 'The Living',
    title2: 'Wedding Calendar',
    lead: 'Our wedding celebrations unfold across two days. Choose a day to see it in detail.',
    days: 'Wedding days',
    dayCard: (n: number, date: string) => `Day ${n}: ${date}`,
    dayEyebrow: (n: number, weekday: string) => `Day ${n === 1 ? 'one' : 'two'} · ${weekday}`,
    units: { days: 'Days', hrs: 'Hrs', min: 'Min', sec: 'Sec' },
    today: 'The celebrations are today. We are so happy you are with us.',
    past: 'With love and gratitude — this day has been celebrated.',
    note: 'Counting down to the start of this day, India Standard Time.',
    details: 'View day details',
  },
  compass: {
    title1: 'The Wedding',
    title2: 'Compass',
    lead: 'Choose a direction to explore our wedding details.',
    nav: 'Wedding compass',
    dirs: { north: 'North', east: 'East', south: 'South', west: 'West' },
    dest: { invitation: 'The Invitation', schedule: 'The Schedule', services: 'Guest Services', venue: 'The Venue' },
  },
  celebrations: {
    title: 'The Celebrations',
    lead: 'Two special days, filled with love, traditions and cherished moments.',
    tabs: 'Celebration days',
    tab: (n: number) => `Day ${n}`,
    dayTitle: (n: number): string => (n === 1 ? 'Day One' : 'Day Two'),
    timings: 'Ceremony timings',
    timingsValue: 'Not yet announced',
    programme: 'Programme of the day',
    programmeValue: 'Not yet published on this invitation',
  },
  venueSection: {
    title: 'The Venue',
    lead: 'Join us at a beautiful venue in the heart of Davangere.',
    directions: 'Get directions',
    viewMap: 'View on map',
  },
  services: {
    eyebrow: 'For our guests',
    title: 'Guest Services',
    lead: 'Everything you need for a comfortable and joyful experience.',
    travel: 'Travel & Stay',
    travelBody: 'The celebrations are at Bapuji Samudhaya Bhavan, Davangere, Karnataka. Plan your journey with the venue’s directions.',
    seeVenue: 'See the venue',
    local: 'Local Guide',
    localBody: 'Davangere welcomes you to the heart of Karnataka. If you would like suggestions for your visit, just ask us.',
    etiquette: 'Etiquette',
    etiquetteBody: 'A few friendly notes: kindly send your RSVP so the family can welcome you, and keep both days free if you can join us.',
    help: 'Need Help?',
    helpBody: 'We’re here for you, before and during the celebrations.',
    call: 'Call',
    whatsapp: 'WhatsApp',
  },
  rsvp: {
    eyebrow: 'R · S · V · P',
    title: 'Kindly let us know',
    name: 'Your Name',
    namePh: 'Full name',
    join: 'Will you join us?',
    accept: 'Joyfully accepts',
    acceptHint: 'Yes, I’ll be there!',
    decline: 'Regretfully declines',
    declineHint: 'Sorry, I won’t be able to attend.',
    guests: 'Number of attendees',
    optional: '(optional)',
    guestsPh: 'e.g. 2',
    note: 'A message for the couple',
    notePh: 'Your wishes (optional)',
    send: 'Send RSVP via WhatsApp',
    helper: 'Your WhatsApp message will be prefilled. Please tap Send in WhatsApp to share your reply.',
    ready: 'Your WhatsApp message is ready.',
    readyNote: 'Your reply reaches the family only when you tap Send in WhatsApp.',
    openWa: 'WhatsApp didn’t open? Open it here',
    privacy: 'Your details go only into the WhatsApp message you send. This website does not store them.',
    errors: {
      name: 'Please enter your name.',
      attendance: 'Please choose whether you can join us.',
      guests: (max: number) => `Please enter a number of attendees from 1 to ${max}, or leave it empty.`,
    },
    message: {
      hello: (name: string) => `Hello! I am ${name}.`,
      regarding: (couple: string, dates: string) => `Regarding the wedding of ${couple} on ${dates}, my attendance is:`,
      accept: 'Joyfully accepts',
      decline: 'Regretfully declines',
      guests: (n: string) => `Number of attendees: ${n}`,
      note: (text: string) => `Message for the couple: ${text}`,
    },
  },
  closing: {
    blessing: 'With love & blessings',
    message: 'We would be delighted to celebrate these special moments with you. Your blessings, love, and presence will make our celebration complete.',
    rsvp: 'RSVP',
    directions: 'Venue directions',
    made: (pair: string) => `Made with love for ${pair}`,
    top: 'Back to top',
  },
  actions: {
    share: 'Share invitation',
    addToCalendar: 'Add to calendar',
  },
  share: {
    title: 'Darshan & Vathsala — Wedding Invitation',
    text: 'You are warmly invited to the wedding of Darshan & Vathsala, 15 & 16 November 2026, Bapuji Samudhaya Bhavan, Davangere.',
    shared: 'Thank you for sharing the invitation.',
    copied: 'The invitation link has been copied.',
    failed: 'Sharing isn’t available here — please copy the link from the address bar.',
  },
  ics: {
    done: 'A calendar file for both days has been downloaded — open it to add them.',
    failed: 'The calendar file could not be created on this device.',
  },
  music: {
    title: 'Wedding music',
    play: 'Play music',
    pause: 'Pause music',
    failed: 'The music could not start. Tap play to try again.',
  },
  fireworks: {
    replay: 'Light up the sky',
    playing: 'Lighting the sky…',
  },
}

export type Messages = typeof en
