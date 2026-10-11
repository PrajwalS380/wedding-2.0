import { gsap } from 'gsap'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { coupleNames, wedding } from '../../config/wedding'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { weddingDateRange } from '../../lib/format'
import { PetalField, type PetalFieldHandle } from '../effects/PetalField'
import { NamesDivider, OpenCartouche, TitleCrown, TitleScroll } from './ornaments'
import { FLAMES, STAGE, flapHingeOrigin, layerBox, layerBoxWithin, layerSrc, stagePoint, type LayerName } from './scene'
import './intro.css'

interface Props {
  /** Called once, when the intro has finished (opened or skipped). */
  onComplete: () => void
}

type IntroState = 'loading' | 'ready' | 'opening' | 'closing'

/** Images the first frame cannot do without; the rest stream in behind them. */
const CRITICAL: LayerName[] = ['backdrop', 'door-left', 'door-right', 'envelope-pocket', 'envelope-flap']

function Layer({ name, className = '', style }: { name: LayerName; className?: string; style?: CSSProperties }) {
  const { src, srcSet } = layerSrc(name)
  return (
    <img
      className={`intro-layer ${className}`}
      src={src}
      srcSet={srcSet}
      alt=""
      draggable={false}
      decoding="async"
      fetchPriority={CRITICAL.includes(name) ? 'high' : 'auto'}
      style={{ ...layerBox(name), ...style }}
    />
  )
}

/**
 * Wide screens only: the doorway stands in a candle-lit palace wall. The wing
 * re-uses the painting's own carved panels, jasmine columns and brass lamps
 * (no new imagery), darkening into shadow away from the door.
 */
function Wing({ side }: { side: 'left' | 'right' }) {
  const img = (key: string, name: LayerName, style: CSSProperties, className = 'intro-layer') => {
    const { src, srcSet } = layerSrc(name)
    return <img key={key} className={className} src={src} srcSet={srcSet} alt="" draggable={false} decoding="async" style={style} />
  }
  // positions in stage units (cqh), measured outward from the stage edge
  return (
    <div className={`intro-wing intro-wing--${side}`} aria-hidden="true">
      <div className="intro-wing__wall" />
      {img('panel-1', 'door-left', { right: '1cqh', top: 0, width: '12.1cqh', height: '57cqh', opacity: 0.55, transform: 'scaleX(-1)' })}
      {img('panel-2', 'door-left', { right: '26cqh', top: 0, width: '12.1cqh', height: '57cqh', opacity: 0.32 })}
      <div className="intro-wing__floor" />
      {img('garland-1', 'frame-left', { right: '12.5cqh', top: 0, width: '11.3cqh', height: '48.6cqh', opacity: 0.85 })}
      {img('garland-2', 'frame-left', { right: '37cqh', top: 0, width: '11.3cqh', height: '48.6cqh', opacity: 0.45, transform: 'scaleX(-1)' })}
      <div className="intro-wing__glow" />
      <div className="intro-wing__lamp">
        {img('lamp', 'props-left', { left: 0, top: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' })}
        <span className="intro-flame" style={{ left: '66%', top: '11%', '--s': '6cqh' } as CSSProperties} />
        <span className="intro-flame" style={{ left: '79%', top: '13.5%', '--s': '4.6cqh', '--delay': '-0.8s' } as CSSProperties} />
      </div>
      {img('bowl', 'foreground-right', { right: '-4cqh', bottom: '-6cqh', width: '22cqh', height: '31.5cqh' }, 'intro-layer intro-wing__bowl')}
      <div className="intro-wing__shade" />
    </div>
  )
}

/**
 * The royal invitation intro (Reference A): carved palace doors open onto a
 * sunset garden mandap; an emerald velvet envelope with a D&V wax seal waits on
 * a gold pedestal among brass lamps and lotus.
 *
 * One GSAP timeline drives the whole opening so the envelope, doors, light and
 * hand-off move as one sequence: the seal cracks, the flap lifts, the invitation
 * card rises, the doors swing wide, the camera moves through the doorway and the
 * light spills over into the website's own hero. Skip, Escape and reduced-motion
 * paths all end in the same `onComplete`, exactly once.
 */
export function RoyalIntro({ onComplete }: Props) {
  const reduced = useReducedMotion()
  const [state, setState] = useState<IntroState>('loading')
  const [imagesFailed, setImagesFailed] = useState(false)

  const root = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const camera = useRef<HTMLDivElement>(null)
  const doorL = useRef<HTMLDivElement>(null)
  const doorR = useRef<HTMLDivElement>(null)
  const envelope = useRef<HTMLDivElement>(null)
  const flap = useRef<HTMLDivElement>(null)
  const sealTop = useRef<HTMLImageElement>(null)
  const sealGlow = useRef<HTMLDivElement>(null)
  const envGlow = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const fgL = useRef<HTMLImageElement>(null)
  const fgR = useRef<HTMLImageElement>(null)
  const text = useRef<HTMLDivElement>(null)
  const bloom = useRef<HTMLDivElement>(null)
  const veil = useRef<HTMLDivElement>(null)
  const openButton = useRef<HTMLButtonElement>(null)
  const petals = useRef<PetalFieldHandle>(null)
  const timeline = useRef<gsap.core.Timeline | null>(null)
  const finished = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    onComplete()
  }, [onComplete])

  // ---- preload the critical layers; never wait more than a few seconds
  useEffect(() => {
    let cancelled = false
    const loads = CRITICAL.map(
      (name) =>
        new Promise<boolean>((resolve) => {
          const img = new Image()
          const { src, srcSet } = layerSrc(name)
          img.srcset = srcSet
          img.src = src
          img.decode().then(
            () => resolve(true),
            () => resolve(false),
          )
        }),
    )
    const timeout = new Promise<'timeout'>((r) => window.setTimeout(() => r('timeout'), 6000))
    Promise.race([Promise.all(loads), timeout]).then((result) => {
      if (cancelled) return
      if (result !== 'timeout' && result.some((ok) => !ok)) setImagesFailed(true)
      setState((s) => (s === 'loading' ? 'ready' : s))
    })
    return () => {
      cancelled = true
    }
  }, [])

  // ---- fade the scene in once it is ready (never interrupted: an early tap simply finishes it)
  const fadedIn = useRef(false)
  useLayoutEffect(() => {
    if (state !== 'ready' || fadedIn.current || !stage.current) return
    fadedIn.current = true
    gsap.fromTo(stage.current, { opacity: 0 }, { opacity: 1, duration: reduced ? 0.2 : 0.9, ease: 'power1.out' })
    root.current?.focus({ preventScroll: true })
  }, [state, reduced])

  // ---- kill everything on unmount
  useEffect(
    () => () => {
      timeline.current?.kill()
      if (root.current) gsap.killTweensOf(root.current)
      if (stage.current) gsap.killTweensOf(stage.current)
    },
    [],
  )

  const open = useCallback(() => {
    if (state !== 'ready' && state !== 'loading') return // repeated taps are ignored
    setState('opening')
    try {
      navigator.vibrate?.(8)
    } catch {
      /* not supported — fine */
    }
    const q = gsap.utils.selector(root)
    const flames = q('.intro-flame')
    // a tap during the fade-in finishes the fade rather than freezing it half-way
    gsap.to(stage.current, { opacity: 1, duration: 0.2, overwrite: true })

    if (reduced || imagesFailed) {
      // short, calm version: the flap is shown open, the card rises, the scene fades
      const tl = gsap.timeline({ onComplete: finish })
      tl.to(text.current, { opacity: 0, duration: 0.25 }, 0)
        .set(flap.current, { rotationX: 178, zIndex: 1 }, 0.1)
        .to(card.current, { yPercent: -60, duration: 0.3, ease: 'power1.out' }, 0.1)
        .to(root.current, { opacity: 0, duration: 0.45, ease: 'power1.inOut' }, 0.45)
      timeline.current = tl
      return
    }

    const rush = { v: 0 }
    // push far enough that the painting fills any screen shape by the end (and the
    // painted-in floor below the doorway has left the frame)
    const stageWidth = stage.current?.offsetWidth || window.innerWidth
    const camScale = Math.max(3.2, (window.innerWidth / stageWidth) * 1.15)
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onComplete: finish })
    // 1 — tactile press: the envelope gives under the touch, the seal warms
    tl.to(envelope.current, { scale: 0.985, duration: 0.12, ease: 'power1.out' }, 0)
      .to(envelope.current, { scale: 1, duration: 0.45, ease: 'back.out(2.2)' }, 0.12)
      .to(sealGlow.current, { opacity: 1, scale: 1.15, duration: 0.4, ease: 'power1.out' }, 0.04)
      .to(text.current, { opacity: 0, yPercent: 1.2, duration: 0.55, ease: 'power1.in' }, 0.12)
      // 2 — the wax seal cracks
      .call(() => petals.current?.sparkle((430 / STAGE.w) * 100, (897 / STAGE.h) * 100, 34), [], 0.42)
      .to(sealTop.current, { yPercent: -7, duration: 0.16, ease: 'power3.out' }, 0.42)
      .to(sealGlow.current, { opacity: 0, scale: 1.4, duration: 0.7, ease: 'power1.out' }, 0.55)
      // 3 — the flap lifts over its hinge; the card rises in warm light
      .to(flap.current, { rotationX: 178, duration: 1.0, ease: 'power2.inOut' }, 0.5)
      .set(flap.current, { zIndex: 1 }, 1.0)
      .to(envGlow.current, { opacity: 0.85, duration: 0.8, ease: 'power1.out' }, 0.85)
      .to(card.current, { yPercent: -72, duration: 0.95, ease: 'power3.out' }, 1.05)
      // 4 — the palace doors swing wide, their faces turning out of the light
      .to(doorL.current, { rotationY: 72, '--door-shade': 1, duration: 1.7, ease: 'power3.inOut' }, 1.2)
      .to(doorR.current, { rotationY: -72, '--door-shade': 1, duration: 1.7, ease: 'power3.inOut' }, 1.2)
      .to(flames, { opacity: 0, duration: 0.9 }, 1.6)
      .set(flames, { display: 'none' }, 2.5)
      .to(q('.intro-rays'), { opacity: 0, duration: 0.8 }, 1.6)
      .set(q('.intro-rays'), { display: 'none' }, 2.4)
      .set(q('.intro-wing, .intro-seam'), { visibility: 'hidden' }, 3.3)
      // 5 — the camera moves through the doorway; the foreground passes by
      .to(camera.current, { scale: camScale, duration: 2.0, ease: 'power2.in' }, 1.75)
      .to(fgL.current, { xPercent: -55, yPercent: 35, scale: 1.45, duration: 1.5, ease: 'power2.in' }, 1.75)
      .to(fgR.current, { xPercent: 55, yPercent: 35, scale: 1.45, duration: 1.5, ease: 'power2.in' }, 1.75)
      .to(envelope.current, { yPercent: 30, scale: 1.25, opacity: 0, duration: 0.85, ease: 'power2.in' }, 2.1)
      .to(rush, { v: 1, duration: 1.9, ease: 'power1.in', onUpdate: () => petals.current?.setRush(rush.v) }, 1.75)
      // 6 — light spills through the doors and becomes the website
      .to(bloom.current, { opacity: 1, scale: 1, duration: 1.45, ease: 'power2.in' }, 2.4)
      .to(veil.current, { opacity: 1, duration: 0.45, ease: 'power1.in' }, 3.5)
      .to(root.current, { opacity: 0, duration: 0.55, ease: 'power1.out' }, 3.95)
    timeline.current = tl
    // development builds expose the timeline so the browser checks can inspect exact frames
    if (import.meta.env.DEV) (window as unknown as { __introTimeline?: gsap.core.Timeline }).__introTimeline = tl
  }, [state, reduced, imagesFailed, finish])

  const skip = useCallback(() => {
    if (finished.current || state === 'closing') return
    setState('closing')
    timeline.current?.kill()
    gsap.to(root.current, { opacity: 0, duration: reduced ? 0.15 : 0.35, ease: 'power1.out', onComplete: finish })
  }, [state, reduced, finish])

  // Escape skips, like closing any dialog
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [skip])

  return (
    <div
      ref={root}
      className="intro"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      aria-labelledby="intro-names"
      aria-describedby="intro-date"
      data-state={state}
    >
      {state === 'loading' && (
        <div className="intro-loader" role="status">
          <span className="intro-loader__mono" aria-hidden="true">
            D<span>&amp;</span>V
          </span>
          <span className="intro-loader__text">Preparing your invitation…</span>
        </div>
      )}

      <div
        ref={stage}
        className="intro-stage"
        style={{ opacity: 0, background: imagesFailed ? 'radial-gradient(90% 70% at 50% 35%, #f6d9a8 0%, #c98d4a 45%, #3a1f0c 100%)' : undefined }}
        onClick={(e) => {
          // tapping the invitation itself opens it too (the button is the accessible control)
          if (!(e.target as HTMLElement).closest('button')) open()
        }}
      >
        <div ref={camera} className="intro-camera" aria-hidden="true">
          {!imagesFailed && (
            <>
              <Wing side="left" />
              <Wing side="right" />
              <Layer name="backdrop" />
              <div className="intro-rays" />
              <div ref={doorL} className="intro-layer intro-door intro-door--left" style={layerBox('door-left')}>
                <Layer name="door-left" style={{ left: 0, top: 0, width: '100%', height: '100%' }} />
              </div>
              <div ref={doorR} className="intro-layer intro-door intro-door--right" style={layerBox('door-right')}>
                <Layer name="door-right" style={{ left: 0, top: 0, width: '100%', height: '100%' }} />
              </div>
              <Layer name="frame-left" />
              <Layer name="frame-right" />

              <div
                ref={envelope}
                className="intro-envelope"
                style={{
                  transformOrigin: `${(430 / STAGE.w) * 100}% ${(950 / STAGE.h) * 100}%`,
                  perspectiveOrigin: `${(430 / STAGE.w) * 100}% ${(780 / STAGE.h) * 100}%`,
                }}
              >
                <div className="intro-layer" style={{ ...layerBox('envelope-inside'), zIndex: 0 }}>
                  <Layer name="envelope-inside" style={{ left: 0, top: 0, width: '100%', height: '100%' }} />
                </div>
                <div ref={envGlow} className="intro-envelope-glow" style={{ zIndex: 1 }} />
                <div ref={card} className="intro-card" style={{ zIndex: 2 }}>
                  <span className="intro-card__mono">
                    D<span>&amp;</span>V
                  </span>
                  <span className="intro-card__names">{coupleNames}</span>
                </div>
                <Layer name="envelope-pocket" style={{ zIndex: 3 }} />
                <div
                  ref={flap}
                  className="intro-layer intro-flap"
                  style={{ ...layerBox('envelope-lining'), zIndex: 4, transformOrigin: flapHingeOrigin() }}
                >
                  <div className="flap-face">
                    <img className="intro-layer" alt="" draggable={false} {...layerSrc('envelope-flap')} style={layerBoxWithin('envelope-flap', 'envelope-lining')} />
                    <img ref={sealTop} className="intro-layer" alt="" draggable={false} {...layerSrc('seal-top')} style={layerBoxWithin('seal-top', 'envelope-lining')} />
                  </div>
                  <div className="flap-face flap-face--back">
                    <img className="intro-layer" alt="" draggable={false} {...layerSrc('envelope-lining')} style={{ left: 0, top: 0, width: '100%', height: '100%' }} />
                  </div>
                </div>
                <div ref={sealGlow} className="intro-seal-glow" style={{ zIndex: 5 }} />
              </div>

              <Layer name="props-left" />
              <Layer name="props-right" />
              {FLAMES.map(([x, y, s], i) => (
                <span
                  key={i}
                  className="intro-flame"
                  style={{ ...stagePoint(x, y), '--s': `${s}cqh`, '--d': `${2.2 + (i % 4) * 0.45}s`, '--delay': `${-(i * 0.37) % 2}s` } as CSSProperties}
                />
              ))}
              <img ref={fgL} className="intro-layer" alt="" draggable={false} {...layerSrc('foreground-left')} style={{ ...layerBox('foreground-left'), transformOrigin: '0% 100%' }} />
              <img ref={fgR} className="intro-layer" alt="" draggable={false} {...layerSrc('foreground-right')} style={{ ...layerBox('foreground-right'), transformOrigin: '100% 100%' }} />
              <span className="intro-seam intro-seam--left" />
              <span className="intro-seam intro-seam--right" />
            </>
          )}
        </div>

        <PetalField ref={petals} className="intro-particles" petals={16} motes={24} focus={{ x: 50, y: 27 }} />

        <div ref={text} className="intro-text">
          <div className="intro-title">
            <TitleCrown />
            <p>A Royal Invitation</p>
            <TitleScroll />
          </div>
          <div className="intro-names">
            <h2 id="intro-names">
              {wedding.couple.first}
              <span className="amp">&amp;</span>
              {wedding.couple.second}
            </h2>
            <NamesDivider />
            <p id="intro-date" className="date">
              {weddingDateRange} · {wedding.venue.city}
            </p>
          </div>
          <button ref={openButton} type="button" className="intro-open" onClick={open}>
            <OpenCartouche />
            <span className="label">
              Tap to open<span className="sr-only"> the invitation</span>
            </span>
          </button>
        </div>

      </div>

      <div ref={bloom} className="intro-bloom" aria-hidden="true" />
      <div ref={veil} className="intro-veil" aria-hidden="true" />

      <button type="button" className="intro-skip" onClick={skip}>
        Skip intro
      </button>
    </div>
  )
}
