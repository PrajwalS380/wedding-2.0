/**
 * Rendering quality tier, chosen once from the device: phones and low-memory
 * devices get fewer pixels, cheaper reflections and no depth of field, so the
 * scene stays smooth on mid-range Android.
 */
export type Tier = 'ultra' | 'high' | 'medium' | 'low'

export interface Quality {
  tier: Tier
  dpr: [number, number]
  shadows: boolean
  shadowMapSize: number
  reflections: boolean
  reflectorResolution: number
  bloom: boolean
  dof: boolean
  msaa: number
  petals: number
  maxTextureSize: number
  /** Render-target pixel budget: large screens render a little below native resolution instead of dropping frames. */
  maxPixels: number
  /** Multiplier for flower counts (garlands, bougainvillea). */
  floral: number
}

export function detectQuality(): Quality {
  const nav = navigator as Navigator & { deviceMemory?: number }
  const mem = nav.deviceMemory ?? 4
  const cores = nav.hardwareConcurrency ?? 4
  const small = Math.min(window.screen.width, window.screen.height) < 600
  const coarse = window.matchMedia?.('(pointer: coarse)').matches
  const forced = new URLSearchParams(location.search).get('quality') as Tier | null
  let tier: Tier = forced ?? (mem <= 2 || cores <= 4 ? 'low' : small || coarse ? 'medium' : 'high')
  if (!['ultra', 'high', 'medium', 'low'].includes(tier)) tier = 'medium'
  const table: Record<Tier, Quality> = {
    ultra: { tier, dpr: [1, 1.75], shadows: true, shadowMapSize: 2048, reflections: true, reflectorResolution: 512, bloom: true, dof: true, msaa: 4, petals: 110, maxTextureSize: 2048, maxPixels: 2.6e6, floral: 1 },
    high: { tier, dpr: [1, 1.5], shadows: true, shadowMapSize: 1024, reflections: false, reflectorResolution: 512, bloom: true, dof: false, msaa: 0, petals: 80, maxTextureSize: 2048, maxPixels: 1.45e6, floral: 1 },
    medium: { tier, dpr: [1, 1.3], shadows: true, shadowMapSize: 1024, reflections: false, reflectorResolution: 256, bloom: true, dof: false, msaa: 0, petals: 50, maxTextureSize: 1024, maxPixels: 1.2e6, floral: 0.7 },
    low: { tier, dpr: [1, 1.1], shadows: false, shadowMapSize: 512, reflections: false, reflectorResolution: 256, bloom: true, dof: false, msaa: 0, petals: 24, maxTextureSize: 1024, maxPixels: 0.8e6, floral: 0.5 },
  }
  const q = { ...table[tier] }
  // development switches for profiling: ?noreflect ?noshadow
  if (import.meta.env.DEV) {
    const sp = new URLSearchParams(location.search)
    if (sp.has('noreflect')) q.reflections = false
    if (sp.has('noshadow')) q.shadows = false
    if (sp.has('nodof')) q.dof = false
  }
  return q
}
