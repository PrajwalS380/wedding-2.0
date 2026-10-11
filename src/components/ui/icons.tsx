/** Hand-drawn line icons (decorative; buttons carry their own text or aria-label). */
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const Svg = ({ children, className = 'h-4 w-4', ...rest }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={className}
    {...rest}
  >
    {children}
  </svg>
)

export const ArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12h15M14 6.5 19.5 12 14 17.5" />
  </Svg>
)

export const ArrowUp = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20V5M6.5 10.5 12 5l5.5 5.5" />
  </Svg>
)

export const MapPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </Svg>
)

export const MapFold = (p: IconProps) => (
  <Svg {...p}>
    <path d="m3.5 6 5-2 7 2.5 5-2v13.5l-5 2-7-2.5-5 2Z" />
    <path d="M8.5 4v13.5M15.5 6.5V20" />
  </Svg>
)

export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4M8 13.5h2M14 13.5h2M8 17h2" />
  </Svg>
)

export const ShareIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="18" cy="5.5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="18.5" r="2.5" />
    <path d="m8.3 10.8 7.4-4.1M8.3 13.2l7.4 4.1" />
  </Svg>
)

export const PhoneIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 3.5h3.2l1.6 4.2-2.1 1.4a11 11 0 0 0 5.2 5.2l1.4-2.1 4.2 1.6V17a2.5 2.5 0 0 1-2.7 2.5C9.6 19 5 14.4 4.5 6.2A2.5 2.5 0 0 1 5 3.5Z" />
  </Svg>
)

export const WhatsAppIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20l1.2-4.2A8 8 0 1 1 8.4 19L4 20Z" />
    <path d="M9 8.6c.2-.5.5-.6.8-.6h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.6l-.5.6c-.1.1-.1.3 0 .5a6 6 0 0 0 2.6 2.4c.2.1.4.1.5-.1l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.2.1.3.2.3.4 0 .5-.2 1.2-.8 1.5-.6.4-1.5.5-3-.1a8.6 8.6 0 0 1-4-3.6c-.6-1-.7-1.9-.4-2.7Z" fill="currentColor" stroke="none" />
  </Svg>
)

export const MenuIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
)

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
)

export const ChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
)

export const TapIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.5 11V5.2a1.6 1.6 0 0 1 3.2 0V11l.6-.9a1.6 1.6 0 0 1 3 .9l.4-.4a1.6 1.6 0 0 1 2.8 1.1V15a6 6 0 0 1-6 6h-.8a5 5 0 0 1-4-2l-3-4a1.6 1.6 0 0 1 2.4-2.1l1.4 1.3" />
    <path d="M6.6 6.6a4.5 4.5 0 0 1 9 0" opacity="0.6" />
  </Svg>
)

export const ScrollIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 4h11a2 2 0 0 1 2 2v1h-3" />
    <path d="M17 7v11a2.5 2.5 0 0 1-2.5 2.5H6.5A2.5 2.5 0 0 1 4 18v-1h10v1a2.5 2.5 0 0 0 2.5 2.5" />
    <path d="M7 4a2 2 0 0 0-2 2v11M9 9h5M9 12h5" />
  </Svg>
)

export const GuestsIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="2.6" />
    <circle cx="6" cy="9.5" r="2" />
    <circle cx="18" cy="9.5" r="2" />
    <path d="M7.5 19c0-3 2-5 4.5-5s4.5 2 4.5 5M2.5 18c0-2.2 1.5-3.8 3.5-3.8 1 0 1.8.3 2.4.8M21.5 18c0-2.2-1.5-3.8-3.5-3.8-1 0-1.8.3-2.4.8" />
  </Svg>
)

export const SuitcaseIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
    <path d="M9 7.5V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2M3.5 12.5h17M10.5 12.5v1.5h3v-1.5" />
  </Svg>
)

export const CompassIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m14.8 9.2-1.7 4.6-4.6 1.7 1.7-4.6Z" />
    <path d="M12 3.5v1.5M12 19v1.5M3.5 12H5M19 12h1.5" />
  </Svg>
)

export const LotusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5c-2 2.2-3 4.6-3 7s1 4.6 3 6c2-1.4 3-3.6 3-6s-1-4.8-3-7Z" />
    <path d="M9.2 12.8C7.6 10.6 5.4 9.6 3 9.8c.3 3.6 2.4 6.6 5.7 7.8M14.8 12.8c1.6-2.2 3.8-3.2 6.2-3C20.7 13.4 18.6 16.4 15.3 17.6" />
    <path d="M5 19.5h14" />
  </Svg>
)

export const ClockIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
)

export const HeartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 19.5s-7-4.3-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.1c0 5.1-7 9.4-7 9.4Z" fill="currentColor" stroke="none" />
  </Svg>
)
