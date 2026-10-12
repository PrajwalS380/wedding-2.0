/**
 * Development-only studio: renders one still of the palace world (or one of its
 * objects) at a time, for `tools/render/stills.mjs` to capture. Served by the dev
 * server at /studio.html?shot=<name>; not part of the production build.
 */
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource/pinyon-script/400.css'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, DepthOfField, EffectComposer, N8AO, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useLayoutEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import * as THREE from 'three'
import { WorldAssetsProvider } from '../assets'
import { FlameField } from '../objects/Flame'
import type { Quality } from '../quality'
import { loadCouple } from './couple'
import { LITE, SHOTS, type Shot } from './shots'

const QUALITY: Quality = {
  tier: 'ultra',
  dpr: [2, 2],
  shadows: true,
  shadowMapSize: 2048,
  reflections: true,
  reflectorResolution: 1024,
  bloom: true,
  dof: true,
  msaa: 4,
  petals: 140,
  maxTextureSize: 2048,
  maxPixels: 1e8,
  floral: 1,
}

function Frame({ shot }: { shot: Shot }) {
  const { camera } = useThree()
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    cam.fov = shot.camera.fov
    cam.position.set(...shot.camera.position)
    cam.lookAt(...shot.camera.target)
    cam.updateProjectionMatrix()
  }, [camera, shot])
  // let the environment, flames and petals settle, then tell the capture script
  const frames = useRef(0)
  useFrame(() => {
    frames.current++
    if (frames.current === 45) (window as unknown as { __shotReady?: boolean }).__shotReady = true
  })
  return null
}

function Studio({ shot }: { shot: Shot }) {
  return (
    <Canvas
      dpr={2}
      shadows
      gl={{
        antialias: !!shot.transparent,
        alpha: !!shot.transparent,
        preserveDrawingBuffer: true,
        toneMapping: shot.transparent ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping,
        stencil: false,
      }}
      camera={{ fov: shot.camera.fov, near: 0.02, far: 900, position: shot.camera.position }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, shot.transparent ? 0 : 1)}
    >
      <WorldAssetsProvider quality={QUALITY}>
        <FlameField>
          {shot.content()}
          <Frame shot={shot} />
        </FlameField>
        {!shot.transparent && (
          <EffectComposer multisampling={0} enableNormalPass={false}>
            {/* contact shadows where things meet: flowers in their urns, columns on the steps, lamps on the lawn */}
            <N8AO quality="ultra" aoRadius={0.9} distanceFalloff={0.6} intensity={2.2} color="#2a1608" halfRes={LITE} />
            {shot.focus ? <DepthOfField target={shot.focus} focalLength={0.06} bokehScale={2.2} height={720} /> : <></>}
            <Bloom mipmapBlur intensity={0.75 + (shot.dusk ?? 0) * 0.5} luminanceThreshold={0.9} luminanceSmoothing={0.3} radius={0.72} />
            <Vignette offset={0.3} darkness={0.5} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        )}
      </WorldAssetsProvider>
    </Canvas>
  )
}

// the shot list, for the capture script
;(window as unknown as { __shots?: unknown }).__shots = Object.fromEntries(Object.entries(SHOTS).map(([k, s]) => [k, { w: s.w, h: s.h, transparent: !!s.transparent }]))

const name = new URLSearchParams(location.search).get('shot') ?? ''
const shot = SHOTS[name]
const root = createRoot(document.getElementById('root')!)
if (!shot) {
  root.render(<pre style={{ font: '14px monospace', padding: 16 }}>Unknown shot. Available: {Object.keys(SHOTS).join(', ')}</pre>)
} else {
  // the seal monogram is painted into a texture: fonts first
  Promise.all(['500 64px "Cormorant Garamond"', '600 64px "Cormorant Garamond"', 'italic 500 64px "Cormorant Garamond"', '400 64px "Pinyon Script"'].map((f) => document.fonts.load(f)))
    .catch(() => {})
    .then(loadCouple)
    .then(() => root.render(<Studio shot={shot} />))
}
