import { useEffect } from 'react'

/**
 * Marks each main section `is-revealed` the first time it comes into view, so
 * its `[data-reveal]` children rise softly into place. Sections already in view
 * (or reached by a deep link) are revealed at once. Content is hidden only
 * after this script has run, so without it nothing is ever left invisible.
 */
export function useReveal() {
  useEffect(() => {
    const root = document.documentElement
    if (typeof IntersectionObserver === 'undefined') return
    root.classList.add('js-reveal')
    const sections = [...document.querySelectorAll<HTMLElement>('main section, #closing')]
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-revealed')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    )
    for (const s of sections) {
      const r = s.getBoundingClientRect()
      if (r.top < innerHeight && r.bottom > 0) s.classList.add('is-revealed')
      else io.observe(s)
    }
    return () => io.disconnect()
  }, [])
}
