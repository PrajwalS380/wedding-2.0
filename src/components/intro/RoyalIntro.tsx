import { gsap } from 'gsap'
import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { wedding } from '../../config/wedding'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useI18n } from '../../i18n/useI18n'
import { detectQuality } from '../../three/quality'
import type { IntroWorldHandle } from '../../three/IntroWorld'
import { NamesDivider, OpenCartouche, TitleCrown, TitleScroll } from './ornaments'
import './intro.css'

const loadWorld = () => import('../../three/IntroWorld')
const IntroWorld = lazy(() => loadWorld().then((m) => ({ default: m.IntroWorld })))

interface Props {
  /** Called once, when the intro has finished (opened or skipped). */
  onComplete: () => void
}

type IntroState = 'loading' | 'ready' | 'opening' | 'closing'

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** If the 3D scene throws (driver bug, lost context), fall back to the text-only intro. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/**
 * The royal invitation intro, rendered live in WebGL: carved rosewood palace
 * doors with gold inlay, a velvet envelope embroidered in gold thread, a D&V wax
 * seal and silk tassel on a gilded pedestal, brass lamps with living flames,
 * lotus in brass urlis, jasmine garlands, falling petals, and the sunset garden
 * mandap beyond the doors — every object modelled and textured in code.
 *
 * One GSAP timeline drives the opening: the seal cracks, the flap lifts, the card
 * rises, the doors swing wide, the camera walks through the doorway and the light
 * fills the frame as the website appears beneath. Skip, Escape and reduced
 * motion all end in the same onComplete, exactly once.
 */
export function RoyalIntro({ onComplete }: Props) {
  const reduced = useReducedMotion()
  const { t } = useI18n()
  const quality = useMemo(() => detectQuality(), [])
  const [state, setState] = useState<IntroState>('loading')
  const [fontsReady, setFontsReady] = useState(false)
  const [sceneFailed, setSceneFailed] = useState(() => !webglAvailable())

  const root = useRef<HTMLDivElement>(null)
  const text = useRef<HTMLDivElement>(null)
  const bloom = useRef<HTMLDivElement>(null)
  const veil = useRef<HTMLDivElement>(null)
  const world = useRef<IntroWorldHandle>(null)
  const timeline = useRef<gsap.core.Timeline | null>(null)
  const finished = useRef(false)
  const fadedIn = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    onComplete()
  }, [onComplete])

  // start fetching the 3D scene at once, alongside the fonts (it mounts once they are ready)
  useEffect(() => {
    if (!sceneFailed) loadWorld().catch(() => setSceneFailed(true))
  }, [sceneFailed])

  // fonts first: the seal and card lettering are painted into textures
  useEffect(() => {
    let done = false
    const ready = () => {
      if (!done) {
        done = true
        setFontsReady(true)
      }
    }
    Promise.all([
      document.fonts.load('600 64px "Cormorant Garamond"'),
      document.fonts.load('italic 500 64px "Cormorant Garamond"'),
      document.fonts.load('400 64px "Pinyon Script"'),
    ]).then(ready, ready)
    const t = window.setTimeout(ready, 2500)
    return () => window.clearTimeout(t)
  }, [])

  const reveal = useCallback(() => {
    setState((s) => (s === 'loading' ? 'ready' : s))
  }, [])

  // never wait forever for the scene
  useEffect(() => {
    const t = window.setTimeout(reveal, sceneFailed ? 0 : 9000)
    return () => window.clearTimeout(t)
  }, [reveal, sceneFailed])

  useEffect(() => {
    if (state !== 'ready' || fadedIn.current || !root.current) return
    fadedIn.current = true
    gsap.fromTo(root.current.querySelectorAll('.intro-scene, .intro-text'), { opacity: 0 }, { opacity: 1, duration: reduced ? 0.2 : 1.1, ease: 'power1.out' })
    root.current.focus({ preventScroll: true })
  }, [state, reduced])

  useEffect(
    () => () => {
      timeline.current?.kill()
      if (root.current) gsap.killTweensOf(root.current)
    },
    [],
  )

  const open = useCallback(() => {
    if (state !== 'ready') return // repeated taps (and taps while loading) are ignored
    setState('opening')
    try {
      navigator.vibrate?.(8)
    } catch {
      /* not supported */
    }
    const w = world.current
    const env = w?.envelope
    if (import.meta.env.DEV) (window as unknown as { __introWorld?: IntroWorldHandle | null }).__introWorld = w
    // a tap during the fade-in: the opening timeline takes over from wherever the fade got to
    const fadeTargets = root.current?.querySelectorAll('.intro-scene, .intro-text')
    if (fadeTargets) gsap.killTweensOf(fadeTargets)
    const sceneEl = root.current?.querySelector('.intro-scene')

    if (reduced || sceneFailed || !w || !env || !w.doorL || !w.doorR) {
      const tl = gsap.timeline({ onComplete: finish })
      if (sceneEl) tl.to(sceneEl, { opacity: 1, duration: 0.2 }, 0)
      tl.to(text.current, { opacity: 0, duration: 0.25 }, 0)
      if (env) tl.set(env.flap.rotation, { x: -2.95 }, 0.1).set(env.card.position, { y: env.card.position.y + 0.26 }, 0.1)
      tl.to(root.current, { opacity: 0, duration: 0.45, ease: 'power1.inOut' }, 0.4)
      timeline.current = tl
      return
    }

    const glowMat = env.glow.material as { opacity: number }
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: finish })
    if (sceneEl) tl.to(sceneEl, { opacity: 1, duration: 0.2, ease: 'power1.out' }, 0)
    // 1 — the envelope gives under the touch; the lettering fades
    tl.to(env.root.scale, { x: 0.985, y: 0.985, z: 0.985, duration: 0.12, ease: 'power1.out' }, 0)
      .to(env.root.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'back.out(2.2)' }, 0.12)
      .to(text.current, { opacity: 0, y: 12, duration: 0.55, ease: 'power1.in' }, 0.1)
      // 2 — the wax seal cracks; the tassel swings
      .to(env.sealTop.position, { y: '+=0.004', z: '+=0.004', duration: 0.14, ease: 'power3.out' }, 0.42)
      .call(() => env.nudge(2.2), [], 0.42)
      // 3 — the flap lifts over its hinge, warm light rises, the card comes up
      .to(env.flap.rotation, { x: -2.95, duration: 1.05, ease: 'power2.inOut' }, 0.5)
      .to(glowMat, { opacity: 0.55, duration: 0.8, ease: 'power1.out' }, 0.85)
      .to(env.card.position, { y: '+=0.27', duration: 1.0, ease: 'power3.out' }, 1.05)
      // 4 — the palace doors swing wide
      .to(w.doorL.rotation, { y: 1.85, duration: 1.7, ease: 'power3.inOut' }, 1.2)
      .to(w.doorR.rotation, { y: -1.85, duration: 1.7, ease: 'power3.inOut' }, 1.2)
      // 5 — the camera walks through the doorway toward the mandap
      .to(w.rig, { travel: 1, duration: 2.3, ease: 'power2.inOut' }, 1.6)
      .to(w.rig, { look: 1, duration: 2.0, ease: 'power2.inOut' }, 1.75)
      // 6 — the light fills the frame and becomes the website
      .to(bloom.current, { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.in' }, 2.65)
      .to(veil.current, { opacity: 1, duration: 0.45, ease: 'power1.in' }, 3.6)
      .to(root.current, { opacity: 0, duration: 0.55, ease: 'power1.out' }, 4.05)
    timeline.current = tl
    if (import.meta.env.DEV) (window as unknown as { __introTimeline?: gsap.core.Timeline }).__introTimeline = tl
  }, [state, reduced, sceneFailed, finish])

  const skip = useCallback(() => {
    if (finished.current || state === 'closing') return
    setState('closing')
    timeline.current?.kill()
    gsap.to(root.current, { opacity: 0, duration: reduced ? 0.15 : 0.35, ease: 'power1.out', onComplete: finish })
  }, [state, reduced, finish])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [skip])

  return (
    <div ref={root} className={`intro ${sceneFailed ? 'intro--flat' : ''}`} role="dialog" aria-modal="true" aria-labelledby="intro-names" aria-describedby="intro-date" data-state={state} tabIndex={-1}>
      {state === 'loading' && (
        <div className="intro-loader" role="status">
          <span className="intro-loader__mono" aria-hidden="true">
            D<span>&amp;</span>V
          </span>
          <span className="intro-loader__text">{t.intro.preparing}</span>
        </div>
      )}

      <div
        className="intro-scene"
        style={{ opacity: 0 }}
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest('button')) open()
        }}
      >
        {!sceneFailed && fontsReady && (
          <SceneBoundary onError={() => setSceneFailed(true)}>
            <Suspense fallback={null}>
              <IntroWorld ref={world} quality={quality} onReady={reveal} onLost={() => setSceneFailed(true)} className="intro-canvas" />
            </Suspense>
          </SceneBoundary>
        )}
      </div>

      <div ref={text} className="intro-text" style={{ opacity: 0 }}>
        <div className="intro-title">
          <TitleCrown />
          <p>{t.intro.title}</p>
          <TitleScroll />
        </div>
        <div className="intro-names">
          <h2 id="intro-names">
            {wedding.couple.first} <span className="amp">&amp;</span> {wedding.couple.second}
          </h2>
          <NamesDivider />
          <p id="intro-date" className="date">
            {t.date.range} · {t.city}
          </p>
        </div>
        <button type="button" className="intro-open" onClick={open} aria-label={t.intro.openLabel}>
          <OpenCartouche />
          <span className="label">{t.intro.open}</span>
        </button>
      </div>

      <div ref={bloom} className="intro-bloom" aria-hidden="true" />
      <div ref={veil} className="intro-veil" aria-hidden="true" />

      <button type="button" className="intro-skip" onClick={skip}>
        {t.intro.skip}
      </button>
    </div>
  )
}
