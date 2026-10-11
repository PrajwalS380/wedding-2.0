import manifest from './sceneManifest.json'

/** Stage size of the reference painting the intro layers were cut from. */
export const STAGE = manifest.stage

export type LayerName = keyof typeof manifest.layers

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const pct = (v: number, of: number) => `${(v / of) * 100}%`

/** Absolute position of a layer, in % of the stage. */
export function layerBox(name: LayerName): { left: string; top: string; width: string; height: string } {
  const r = manifest.layers[name] as Rect
  return { left: pct(r.x, STAGE.w), top: pct(r.y, STAGE.h), width: pct(r.w, STAGE.w), height: pct(r.h, STAGE.h) }
}

/** Position of one layer inside another layer's box (e.g. the seal on the flap). */
export function layerBoxWithin(name: LayerName, parent: LayerName) {
  const r = manifest.layers[name] as Rect
  const p = manifest.layers[parent] as Rect
  return { left: pct(r.x - p.x, p.w), top: pct(r.y - p.y, p.h), width: pct(r.w, p.w), height: pct(r.h, p.h) }
}

/** A stage point (painting pixels) as % of the stage. */
export const stagePoint = (x: number, y: number) => ({ left: pct(x, STAGE.w), top: pct(y, STAGE.h) })

/** Hinge line of the envelope flap (the envelope's top edge) as a transform-origin within the lining box. */
export function flapHingeOrigin(): string {
  const p = manifest.layers['envelope-lining'] as Rect
  return `50% ${((752 - p.y) / p.h) * 100}%`
}

/** 1x / 2x sources of a layer image. */
export function layerSrc(name: LayerName): { src: string; srcSet: string } {
  return { src: `/intro/${name}.webp`, srcSet: `/intro/${name}.webp 1x, /intro/${name}@2x.webp 2x` }
}

/** Lamp flames visible in the painting, for the live flicker glows: [x, y, size in cqh]. */
export const FLAMES: ReadonlyArray<readonly [number, number, number]> = [
  // brass lamp stands beside the pedestal
  [41, 772, 4.2],
  [65, 760, 5.2],
  [789, 762, 5.2],
  [816, 775, 4.2],
  [840, 785, 3.6],
  // foreground diyas and lotus bowls
  [46, 1126, 7.5],
  [100, 1232, 7],
  [66, 1352, 9.5],
  [741, 1240, 7.5],
  [825, 1127, 7.5],
  // the walkway lamps beyond the doors
  [312, 618, 2.4],
  [343, 644, 2.2],
  [363, 714, 2.4],
  [425, 710, 2.6],
  [495, 712, 2.4],
  [519, 645, 2.2],
  [550, 617, 2.4],
]
