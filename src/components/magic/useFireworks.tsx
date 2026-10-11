import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useI18n } from '../../i18n/useI18n'
import { FireworksShow } from './fireworks'
import './fireworks.css'

/**
 * The closing scene's magic moment: fireworks over the palace at dusk, with
 * coloured smoke rising from both sides. Plays once when the scene comes into
 * view (not for visitors who prefer reduced motion), and again on request.
 * Returns the full-scene layer (decorative, hidden from assistive technology)
 * and the replay button separately, so each can sit where it belongs.
 */
export function useFireworks({ horizon = 0.56 }: { horizon?: number } = {}) {
  const root = useRef<HTMLDivElement>(null)
  const sky = useRef<HTMLCanvasElement>(null)
  const ground = useRef<HTMLCanvasElement>(null)
  const flash = useRef<HTMLDivElement>(null)
  const show = useRef<FireworksShow | null>(null)
  const played = useRef(false)
  const reduced = useReducedMotion()
  const { t } = useI18n()
  const [playing, setPlaying] = useState(false)

  const play = useCallback(() => {
    const s = show.current
    const el = root.current
    if (!s || !el) return
    s.resize(el.clientWidth, el.clientHeight, Math.min(window.devicePixelRatio || 1, 1.5))
    el.classList.add('is-night')
    s.play({ horizon })
    setPlaying(true)
  }, [horizon])
  const playRef = useRef(play)
  useEffect(() => {
    playRef.current = play
  }, [play])

  useEffect(() => {
    if (!sky.current || !ground.current) return
    const s = new FireworksShow({
      sky: sky.current,
      ground: ground.current,
      onDone: () => {
        setPlaying(false)
        root.current?.classList.remove('is-night')
      },
      onFlash: (x, y, c, strength) => {
        const f = flash.current
        if (!f) return
        f.style.setProperty('--fx', `${x}px`)
        f.style.setProperty('--fy', `${y}px`)
        f.style.setProperty('--fc', `${c[0]} ${c[1]} ${c[2]}`)
        f.animate([{ opacity: 0 }, { opacity: 0.55 * strength, offset: 0.12 }, { opacity: 0 }], { duration: 900, easing: 'ease-out' })
      },
    })
    show.current = s
    if (import.meta.env.DEV) (window as unknown as { __fireworks?: { play: () => void; seekTo: (t: number) => void } }).__fireworks = { play: () => playRef.current(), seekTo: (t) => s.seekTo(t) }
    return () => {
      s.stop()
      show.current = null
    }
  }, [])

  // the first time the scene is mostly in view
  useEffect(() => {
    const el = root.current
    if (!el || reduced) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !played.current) {
          played.current = true
          play()
          io.disconnect()
        }
      },
      { threshold: 0.55 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [play, reduced])

  return {
    layer: (
      <div ref={root} className="fireworks" aria-hidden="true">
        <div className="fireworks__night" />
        <div ref={flash} className="fireworks__flash" />
        <canvas ref={sky} className="fireworks__sky" />
        <canvas ref={ground} className="fireworks__ground" />
      </div>
    ),
    button: (
      <button type="button" className="fireworks__replay" onClick={play} disabled={playing}>
        <span aria-hidden="true">✦</span> {playing ? t.fireworks.playing : t.fireworks.replay}
      </button>
    ),
  }
}
