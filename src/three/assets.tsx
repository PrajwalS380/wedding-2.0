import { useThree } from '@react-three/fiber'
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import { bakeDoor, bakeEmbroidery, bakeFrieze, bakeGrass, bakeMarble, bakeSeal, bakeVelvet, bakeWood, type PBRSet } from './bake/bakers'
import type { Quality } from './quality'

export interface WorldAssets {
  doorL: PBRSet
  doorR: PBRSet
  embroidery: PBRSet
  seal: PBRSet
  marble: ReturnType<typeof bakeMarble>
  velvet: ReturnType<typeof bakeVelvet>
  wood: ReturnType<typeof bakeWood>
  frieze: ReturnType<typeof bakeFrieze>
  grass: ReturnType<typeof bakeGrass>
  quality: Quality
}

const Ctx = createContext<WorldAssets | null>(null)
/** One bake per renderer, even when React renders the provider twice. */
const bakedFor = new WeakMap<THREE.WebGLRenderer, WorldAssets>()

/** Bakes every procedural texture once, on the GPU, when the canvas starts. */
export function WorldAssetsProvider({ quality, children }: { quality: Quality; children: ReactNode }) {
  const gl = useThree((s) => s.gl)
  const assets = useMemo<WorldAssets>(() => {
    const cached = bakedFor.get(gl)
    if (cached) return cached
    const t0 = performance.now()
    const baker = { renderer: gl, maxSize: quality.maxTextureSize }
    const times: string[] = []
    const step = <T,>(name: string, f: () => T): T => {
      const s = performance.now()
      const r = f()
      gl.getContext().finish()
      times.push(`${name} ${(performance.now() - s).toFixed(0)}`)
      return r
    }
    const a: WorldAssets = {
      doorL: step('doorL', () => bakeDoor(baker, false)),
      doorR: step('doorR', () => bakeDoor(baker, true)),
      embroidery: step('embroidery', () => bakeEmbroidery(baker)),
      seal: step('seal', () => bakeSeal(baker)),
      marble: step('marble', () => bakeMarble(baker)),
      velvet: step('velvet', () => bakeVelvet(baker)),
      wood: step('wood', () => bakeWood(baker)),
      frieze: step('frieze', () => bakeFrieze(baker)),
      grass: step('grass', () => bakeGrass(baker)),
      quality,
    }
    if (import.meta.env.DEV) console.info(`[world] textures baked in ${(performance.now() - t0).toFixed(0)} ms — ${times.join(' | ')}`)
    bakedFor.set(gl, a)
    return a
  }, [gl, quality])
  return <Ctx.Provider value={assets}>{children}</Ctx.Provider>
}

export function useWorldAssets(): WorldAssets {
  const a = useContext(Ctx)
  if (!a) throw new Error('useWorldAssets must be used inside WorldAssetsProvider')
  return a
}
