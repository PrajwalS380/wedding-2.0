/**
 * Shared SVG symbols for the garlands and floral borders: jasmine flower and bud,
 * bougainvillea / rose blossom, leaf, marigold, brass bell. Rendered once per page
 * (hidden) and referenced with <use href="#…">, so hundreds of flowers cost little.
 */
export function FloralDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="fl-jasmine-petal" cx="50%" cy="85%" r="90%">
          <stop offset="0" stopColor="#f3e6c6" />
          <stop offset="0.35" stopColor="#fffdf6" />
          <stop offset="1" stopColor="#ffffff" />
        </radialGradient>
        <radialGradient id="fl-jasmine-heart" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#f0c75a" />
          <stop offset="1" stopColor="#e7d29a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fl-bud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffefa" />
          <stop offset="0.7" stopColor="#f2ead6" />
          <stop offset="1" stopColor="#c9c7a0" />
        </linearGradient>
        <radialGradient id="fl-pink" cx="50%" cy="50%" r="60%">
          <stop offset="0" stopColor="#ffd7e2" />
          <stop offset="0.35" stopColor="#f2709a" />
          <stop offset="1" stopColor="#b8245a" />
        </radialGradient>
        <radialGradient id="fl-rose" cx="45%" cy="40%" r="65%">
          <stop offset="0" stopColor="#ff9fb8" />
          <stop offset="0.55" stopColor="#d63e6c" />
          <stop offset="1" stopColor="#8e1840" />
        </radialGradient>
        <linearGradient id="fl-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7fa35c" />
          <stop offset="0.55" stopColor="#3f6b34" />
          <stop offset="1" stopColor="#24451f" />
        </linearGradient>
        <linearGradient id="fl-leaf-light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a8c27a" />
          <stop offset="1" stopColor="#4d7a3a" />
        </linearGradient>
        <radialGradient id="fl-marigold" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#ffd56a" />
          <stop offset="0.6" stopColor="#f39a1c" />
          <stop offset="1" stopColor="#c8650c" />
        </radialGradient>
        <linearGradient id="fl-brass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7a5216" />
          <stop offset="0.3" stopColor="#e8c068" />
          <stop offset="0.5" stopColor="#fff0b8" />
          <stop offset="0.7" stopColor="#c9952f" />
          <stop offset="1" stopColor="#6b4612" />
        </linearGradient>

        {/* jasmine: five soft petals around a warm heart (unit size ~ 10) */}
        <g id="fl-jasmine">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-3.2" rx="2.15" ry="3.5" transform={`rotate(${a})`} fill="url(#fl-jasmine-petal)" stroke="#e3d6b6" strokeWidth="0.25" />
          ))}
          <circle r="1.5" fill="url(#fl-jasmine-heart)" />
        </g>
        <g id="fl-bud">
          <path d="M0 -4.2C1.6 -2.6 1.8 0.6 0 3.2-1.8 0.6-1.6-2.6 0-4.2Z" fill="url(#fl-bud)" stroke="#e1d7bb" strokeWidth="0.2" />
        </g>
        <g id="fl-pink-blossom">
          {[0, 72, 144, 216, 288].map((a) => (
            <path key={a} d="M0 0C-3.2 -2.6-3.2 -6.6 0 -7.6 3.2 -6.6 3.2 -2.6 0 0Z" transform={`rotate(${a})`} fill="url(#fl-pink)" />
          ))}
          <circle r="1.2" fill="#fff1b8" />
        </g>
        <g id="fl-rose">
          <circle r="6" fill="url(#fl-rose)" />
          <path d="M-3.5 -1c1.2-3 5.6-3 6.6 0-1.4-1.2-4.6-1.4-6.6 0ZM-2.4 1.6c1.6 1.8 4 1.8 5.2-.2M-1 -2.2c1.6-1 3-.6 3.6.6" fill="none" stroke="#7b1236" strokeWidth="0.55" strokeOpacity="0.55" />
        </g>
        <g id="fl-marigold">
          <circle r="5.4" fill="url(#fl-marigold)" />
          <circle r="5.4" fill="none" stroke="#c4640c" strokeWidth="0.6" strokeDasharray="1.2 1" strokeOpacity="0.6" />
        </g>
        <g id="fl-leaf">
          <path d="M0 0C3 -3.5 9 -4 13 0 9 4 3 3.5 0 0Z" fill="url(#fl-leaf)" />
          <path d="M0.6 0H12" stroke="#c8dca2" strokeWidth="0.35" strokeOpacity="0.55" />
        </g>
        <g id="fl-leaf-light">
          <path d="M0 0C3 -3.2 8 -3.6 11 0 8 3.6 3 3.2 0 0Z" fill="url(#fl-leaf-light)" />
        </g>
        {/* a small brass temple bell on a chain (unit ~ 10 wide) */}
        <g id="fl-bell">
          <path d="M0 -10V-4" stroke="#b9862f" strokeWidth="0.7" />
          <circle cy="-4.2" r="1.1" fill="url(#fl-brass)" />
          <path d="M-4.6 5.4C-4.4 0.8-2.8 -3.2 0 -3.2 2.8 -3.2 4.4 0.8 4.6 5.4Z" fill="url(#fl-brass)" stroke="#6b4612" strokeWidth="0.35" />
          <path d="M-5.6 5.6H5.6" stroke="url(#fl-brass)" strokeWidth="1.4" strokeLinecap="round" />
          <circle cy="7.2" r="1.15" fill="#8a5d18" />
        </g>
      </defs>
    </svg>
  )
}
