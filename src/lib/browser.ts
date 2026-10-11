/** Small, failure-tolerant wrappers around browser APIs. */

/** sessionStorage / localStorage access that never throws (private mode, blocked storage…). */
export function readStorage(kind: 'session' | 'local', key: string): string | null {
  try {
    return (kind === 'session' ? window.sessionStorage : window.localStorage).getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(kind: 'session' | 'local', key: string, value: string): boolean {
  try {
    ;(kind === 'session' ? window.sessionStorage : window.localStorage).setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/**
 * Smoothly scrolls to a section (instantly with reduced motion) and moves focus
 * to its heading for keyboard and screen-reader users, without a second jump.
 */
export function scrollToSection(id: string): void {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  const heading = el.querySelector<HTMLElement>('h1, h2')
  if (heading) {
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
    heading.focus({ preventScroll: true })
  }
  if (history.replaceState) history.replaceState(null, '', `#${id}`)
}
