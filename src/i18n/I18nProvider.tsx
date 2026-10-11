import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { readStorage, writeStorage } from '../lib/browser'
import { I18nContext, type Lang } from './context'
import { en, type Messages } from './en'
import { hi } from './hi'
import { kn } from './kn'

const DICTS: Record<Lang, Messages> = { en, kn, hi }
const KEY = 'w2:lang'

function initialLang(): Lang {
  const saved = readStorage('local', KEY)
  return saved === 'kn' || saved === 'hi' || saved === 'en' ? saved : 'en'
}

/** The active language for the whole page: English first, then the visitor's saved choice. */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  // keep the visitor's place: the element at the centre of the view stays put while text reflows
  const anchor = useRef<{ el: Element; top: number } | null>(null)
  const setLang = useCallback((l: Lang) => {
    const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
    anchor.current = el ? { el, top: el.getBoundingClientRect().top } : null
    setLangState(l)
    writeStorage('local', KEY, l)
  }, [])
  useLayoutEffect(() => {
    const a = anchor.current
    anchor.current = null
    if (!a) return
    const settle = () => {
      if (a.el.isConnected) window.scrollBy({ top: a.el.getBoundingClientRect().top - a.top, behavior: 'instant' })
    }
    settle()
    // the script's font arrives a moment later and reflows the text: settle once more
    let live = true
    void document.fonts?.ready.then(() => live && requestAnimationFrame(settle))
    const stop = () => (live = false)
    window.addEventListener('wheel', stop, { once: true, passive: true })
    window.addEventListener('touchstart', stop, { once: true, passive: true })
    return () => {
      live = false
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchstart', stop)
    }
  }, [lang])
  const t = DICTS[lang]
  useEffect(() => {
    document.documentElement.lang = lang
    document.title = t.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description)
  }, [lang, t])
  const value = useMemo(() => ({ lang, t, setLang }), [lang, t, setLang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
