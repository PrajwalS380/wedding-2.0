/** Gold filigree for the intro, drawn after Reference A. All decorative (aria-hidden). */

const goldStops = (
  <>
    <stop offset="0" stopColor="#f6e2a6" />
    <stop offset="0.45" stopColor="#d4a548" />
    <stop offset="0.75" stopColor="#a8792a" />
    <stop offset="1" stopColor="#e9c977" />
  </>
)

/** Lotus crown above "A ROYAL INVITATION", with long tapering rules. */
export function TitleCrown() {
  return (
    <svg viewBox="0 0 300 52" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="tc-gold" gradientUnits="userSpaceOnUse" x1="0" y1="2" x2="0" y2="48">
          {goldStops}
        </linearGradient>
        <linearGradient id="tc-rule" gradientUnits="userSpaceOnUse" x1="8" y1="0" x2="292" y2="0">
          <stop offset="0" stopColor="#b88a36" stopOpacity="0" />
          <stop offset="0.5" stopColor="#b88a36" />
          <stop offset="1" stopColor="#b88a36" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M8 40h106M186 40h106" stroke="url(#tc-rule)" strokeWidth="1.1" />
      <circle cx="118" cy="40" r="1.6" fill="#b88a36" />
      <circle cx="182" cy="40" r="1.6" fill="#b88a36" />
      <g stroke="url(#tc-gold)" strokeWidth="1.3" strokeLinejoin="round" fill="url(#tc-gold)" fillOpacity="0.22">
        {/* centre petal */}
        <path d="M150 4c-6 7-8.5 13-8.5 19 0 6 3.6 10.5 8.5 13 4.9-2.5 8.5-7 8.5-13 0-6-2.5-12-8.5-19Z" />
        {/* inner side petals */}
        <path d="M147 34c-6-1.5-11-5.5-13.5-11.5 5.2-.6 9.8 1.4 13 5.8M153 34c6-1.5 11-5.5 13.5-11.5-5.2-.6-9.8 1.4-13 5.8" fillOpacity="0" />
        {/* outer petals */}
        <path d="M145.5 36.5c-8.5 1.2-16-1.5-21-7.6 6-2.3 12.5-1.2 17.3 3M154.5 36.5c8.5 1.2 16-1.5 21-7.6-6-2.3-12.5-1.2-17.3 3" fillOpacity="0" />
        {/* base */}
        <path d="M137 40.5c4.5 3.4 8.8 5 13 5s8.5-1.6 13-5" fillOpacity="0" />
      </g>
      <path d="M150 12v17" stroke="#8a6020" strokeWidth="0.9" strokeOpacity="0.7" />
    </svg>
  )
}

/** Scrolled ornament under the title. */
export function TitleScroll() {
  return (
    <svg viewBox="0 0 300 40" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ts-gold" gradientUnits="userSpaceOnUse" x1="0" y1="4" x2="0" y2="40">
          {goldStops}
        </linearGradient>
        <linearGradient id="ts-rule" gradientUnits="userSpaceOnUse" x1="8" y1="0" x2="292" y2="0">
          <stop offset="0" stopColor="#b88a36" stopOpacity="0" />
          <stop offset="0.5" stopColor="#b88a36" />
          <stop offset="1" stopColor="#b88a36" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M8 14h104M188 14h104" stroke="url(#ts-rule)" strokeWidth="1.1" />
      <g stroke="url(#ts-gold)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M150 6c-3 3.5-4 6.5-4 9.5 0 3 1.8 5 4 6.5 2.2-1.5 4-3.5 4-6.5 0-3-1-6-4-9.5Z" fill="url(#ts-gold)" fillOpacity="0.35" />
        <path d="M146 14c-6-4-13-4-18 .5 4 4 10 4.5 14.5 1.5M154 14c6-4 13-4 18 .5-4 4-10 4.5-14.5 1.5" />
        <path d="M128 14.5c-4-.5-7.5.5-10 3M172 14.5c4-.5 7.5.5 10 3" />
        <path d="M144 21c-5 3-7 7-6 11 4-1.5 6.5-4.5 7.5-8.5M156 21c5 3 7 7 6 11-4-1.5-6.5-4.5-7.5-8.5" />
        <path d="M150 22.5v12" />
        <circle cx="150" cy="36.5" r="1.8" fill="url(#ts-gold)" />
      </g>
    </svg>
  )
}

/** Small divider between the names and the date. */
export function NamesDivider() {
  return (
    <svg viewBox="0 0 240 22" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="nd-rule" gradientUnits="userSpaceOnUse" x1="6" y1="0" x2="234" y2="0">
          <stop offset="0" stopColor="#a87c2c" stopOpacity="0" />
          <stop offset="0.5" stopColor="#a87c2c" />
          <stop offset="1" stopColor="#a87c2c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M6 11h90M144 11h90" stroke="url(#nd-rule)" strokeWidth="1.1" />
      <g stroke="#a87c2c" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
        <path d="M120 3.5l4.5 7.5-4.5 7.5-4.5-7.5Z" fill="#c99a44" fillOpacity="0.45" />
        <path d="M115.5 11c-5-3.5-10-3.5-14 0 4 3.5 9 3.5 14 0M124.5 11c5-3.5 10-3.5 14 0-4 3.5-9 3.5-14 0" />
        <circle cx="97" cy="11" r="1.4" fill="#a87c2c" />
        <circle cx="143" cy="11" r="1.4" fill="#a87c2c" />
      </g>
    </svg>
  )
}

/**
 * The emerald cartouche behind "TAP TO OPEN": notched corners, bevelled gold
 * frame, scrolled side finials, a medallion with a tapping hand above and a
 * lotus pendant below.
 */
export function OpenCartouche() {
  // plate with concave (notched) corners
  const plate = (inset: number) => {
    const x0 = 34 + inset
    const x1 = 366 - inset
    const y0 = 42 + inset
    const y1 = 120 - inset
    const r = 11 - inset * 0.6
    return `M${x0 + r} ${y0} H${x1 - r} A${r} ${r} 0 0 0 ${x1} ${y0 + r} V${y1 - r} A${r} ${r} 0 0 0 ${x1 - r} ${y1} H${x0 + r} A${r} ${r} 0 0 0 ${x0} ${y1 - r} V${y0 + r} A${r} ${r} 0 0 0 ${x0 + r} ${y0} Z`
  }
  return (
    <svg viewBox="0 0 400 152" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="oc-gold" gradientUnits="userSpaceOnUse" x1="0" y1="8" x2="0" y2="150">
          <stop offset="0" stopColor="#fbe7ad" />
          <stop offset="0.35" stopColor="#d9ab4f" />
          <stop offset="0.6" stopColor="#9b6c22" />
          <stop offset="0.85" stopColor="#e3bd66" />
          <stop offset="1" stopColor="#8f6420" />
        </linearGradient>
        <linearGradient id="oc-gold-h" gradientUnits="userSpaceOnUse" x1="34" y1="0" x2="366" y2="0">
          <stop offset="0" stopColor="#9b6c22" />
          <stop offset="0.5" stopColor="#f6dc94" />
          <stop offset="1" stopColor="#9b6c22" />
        </linearGradient>
        <radialGradient id="oc-velvet" cx="50%" cy="38%" r="75%">
          <stop offset="0" stopColor="#1f5a43" />
          <stop offset="0.55" stopColor="#123f2f" />
          <stop offset="1" stopColor="#0a2a1f" />
        </radialGradient>
        <filter id="oc-shadow" x="-10%" y="-20%" width="120%" height="150%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#2a1505" floodOpacity="0.45" />
        </filter>
      </defs>

      <g filter="url(#oc-shadow)">
        {/* side finials */}
        {[1, -1].map((dir) => (
          <g key={dir} transform={dir === 1 ? undefined : 'translate(400 0) scale(-1 1)'} fill="url(#oc-gold)" stroke="#7a5418" strokeWidth="0.6">
            <path d="M36 81c-8-6-16-7-24-3 5 1 8 3 10 6-3 2-6 3-10 3 8 4 16 3 24-3Z" />
            <path d="M22 81c-4-7-4-13 0-19 1 5 4 8 8 10" fill="none" stroke="url(#oc-gold)" strokeWidth="2.2" />
            <path d="M22 81c-4 7-4 13 0 19 1-5 4-8 8-10" fill="none" stroke="url(#oc-gold)" strokeWidth="2.2" />
            <circle cx="8" cy="81" r="3" />
          </g>
        ))}

        {/* outer bevelled frame + emerald velvet plate */}
        <path d={plate(0)} fill="url(#oc-gold)" />
        <path d={plate(4)} fill="#6e4b15" />
        <path d={plate(5.2)} fill="url(#oc-velvet)" />
        <path d={plate(9)} fill="none" stroke="url(#oc-gold-h)" strokeWidth="0.9" strokeOpacity="0.85" />

        {/* medallion with the tapping hand */}
        <circle className="pulse" cx="200" cy="34" r="27" fill="none" stroke="#f3d690" strokeWidth="1.2" />
        <circle cx="200" cy="34" r="21" fill="url(#oc-velvet)" stroke="url(#oc-gold)" strokeWidth="3.4" />
        <g transform="translate(188 21) scale(1.05)" fill="none" stroke="#f6e1a5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.5 11V5.2a1.6 1.6 0 0 1 3.2 0V11l.6-.9a1.6 1.6 0 0 1 3 .9l.4-.4a1.6 1.6 0 0 1 2.8 1.1V15a6 6 0 0 1-6 6h-.8a5 5 0 0 1-4-2l-3-4a1.6 1.6 0 0 1 2.4-2.1l1.4 1.3" />
          <path d="M6.6 6.6a4.5 4.5 0 0 1 9 0" opacity="0.7" />
        </g>

        {/* lotus pendant */}
        <g fill="url(#oc-gold)" stroke="#7a5418" strokeWidth="0.6">
          <path d="M200 118c-6 5-8 10-8 14 0 5 4 9 8 11 4-2 8-6 8-11 0-4-2-9-8-14Z" />
          <path d="M192 124c-6 0-10 3-12 7 5 1 9 0 12-3M208 124c6 0 10 3 12 7-5 1-9 0-12-3" />
          <circle cx="200" cy="148" r="2.6" />
        </g>
      </g>
    </svg>
  )
}
