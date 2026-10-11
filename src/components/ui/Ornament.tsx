/** Gold filigree divider — a lotus bud between two tapering flourishes. Decorative only. */
export function OrnamentDivider({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 24"
      className={`h-5 w-48 text-gold ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 12h70c10 0 14-5 22-5" opacity="0.7" />
      <path d="M236 12h-70c-10 0-14-5-22-5" opacity="0.7" />
      <path d="M78 12c8 0 12 5 20 5M162 12c-8 0-12 5-20 5" opacity="0.55" />
      <path d="M120 4c-5 4-7 8-7 10a7 7 0 0 0 14 0c0-2-2-6-7-10Z" fill="currentColor" fillOpacity="0.18" />
      <path d="M120 9v9M113 14c-4-1-7 0-9 2M127 14c4-1 7 0 9 2" />
      <circle cx="102" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="138" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  )
}
