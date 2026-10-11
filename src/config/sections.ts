/**
 * The page's sections, in reading order. Navigation, the Wedding Compass and
 * any "jump to" action reference sections by these ids only.
 */
export const SECTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'invitation', label: 'Invitation' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'compass', label: 'Compass' },
  { id: 'celebrations', label: 'Celebrations' },
  { id: 'venue', label: 'Venue' },
  { id: 'guest-services', label: 'Guest Services' },
  { id: 'rsvp', label: 'RSVP' },
] as const

export type SectionId = (typeof SECTIONS)[number]['id'] | 'closing'

export const SECTION_IDS = SECTIONS.map((s) => s.id)
