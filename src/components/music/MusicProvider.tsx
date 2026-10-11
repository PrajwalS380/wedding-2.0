import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { readStorage, writeStorage } from '../../lib/browser'
import { useToast } from '../ui/toastContext'
import { MusicContext } from './musicContext'

const SRC = '/audio/shubh-aagman.mp3'
const KEY = 'w2:music'
const VOLUME = 0.5

/**
 * "Shubh Aagman", the site's original instrumental (tools/music/compose.py).
 * Music is on by default for this invitation: browsers allow sound only after a
 * visitor's gesture, so it begins with the first tap or key press (usually
 * "Tap to open"), fading in. Pausing is remembered; one audio element only;
 * playback rests while the tab is hidden.
 */
export function MusicProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const notify = useToast()
  const audio = useRef<HTMLAudioElement | null>(null)
  const fade = useRef(0)
  const wanted = useRef(readStorage('local', KEY) !== 'off')
  const [playing, setPlaying] = useState(false)

  const element = useCallback(() => {
    if (!audio.current) {
      const a = new Audio(SRC)
      a.loop = true
      a.preload = 'auto'
      a.volume = 0
      a.addEventListener('pause', () => setPlaying(false))
      a.addEventListener('play', () => setPlaying(true))
      audio.current = a
    }
    return audio.current
  }, [])

  const rampTo = useCallback((target: number, ms: number, then?: () => void) => {
    const a = audio.current
    if (!a) return
    cancelAnimationFrame(fade.current)
    const from = a.volume
    const t0 = performance.now()
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms)
      a.volume = Math.min(1, Math.max(0, from + (target - from) * k))
      if (k < 1) fade.current = requestAnimationFrame(step)
      else then?.()
    }
    fade.current = requestAnimationFrame(step)
  }, [])

  const start = useCallback(
    (explicit: boolean) => {
      const a = element()
      return a.play().then(
        () => {
          rampTo(VOLUME, 2200)
          return true
        },
        () => {
          if (explicit) notify(t.music.failed)
          return false
        },
      )
    },
    [element, rampTo, notify, t],
  )

  const toggle = useCallback(() => {
    const a = audio.current
    if (a && !a.paused) {
      wanted.current = false
      writeStorage('local', KEY, 'off')
      rampTo(0, 500, () => a.pause())
    } else {
      wanted.current = true
      writeStorage('local', KEY, 'on')
      void start(true)
    }
  }, [rampTo, start])

  // on by default: begin with the visitor's first gesture
  useEffect(() => {
    if (!wanted.current) return
    const go = () => {
      if (!wanted.current || (audio.current && !audio.current.paused)) return cleanup()
      void start(false).then((ok) => ok && cleanup())
    }
    const cleanup = () => {
      window.removeEventListener('pointerdown', go, true)
      window.removeEventListener('keydown', go, true)
    }
    window.addEventListener('pointerdown', go, true)
    window.addEventListener('keydown', go, true)
    return cleanup
  }, [start])

  // rest while the tab is hidden; resume if the visitor had it playing
  useEffect(() => {
    let resume = false
    const onVis = () => {
      const a = audio.current
      if (!a) return
      if (document.hidden) {
        resume = !a.paused
        if (resume) a.pause()
      } else if (resume && wanted.current) {
        a.volume = 0
        void a.play().then(() => rampTo(VOLUME, 1200), () => {})
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [rampTo])

  useEffect(
    () => () => {
      cancelAnimationFrame(fade.current)
      audio.current?.pause()
      audio.current = null
    },
    [],
  )

  const value = useMemo(() => ({ playing, toggle }), [playing, toggle])
  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
}
