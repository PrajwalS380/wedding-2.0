import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, DepthOfField, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { forwardRef, Suspense, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject, type RefObject } from 'react'
import * as THREE from 'three'
import { useWorldAssets, WorldAssetsProvider } from './assets'
import { SunsetEnvironment } from './env/SunsetEnvironment'
import { Envelope, type EnvelopeHandle } from './objects/Envelope'
import { FlameField } from './objects/Flame'
import { MarbleFloor } from './objects/Floor'
import { Garden } from './objects/Garden'
import { DOOR, PalaceDoor } from './objects/PalaceDoors'
import { Petals } from './objects/Petals'
import { Sky } from './objects/Sky'
import { Vestibule } from './objects/Vestibule'
import type { Quality } from './quality'

/** Where the envelope rests (on the pedestal), in world units. */
export const ENVELOPE_POS = new THREE.Vector3(0, 0.178, 2.2)

/**
 * Camera framing for the intro: the envelope sits about 62 % down the frame,
 * the doors rise out of frame above it, the garden horizon near the top — the
 * Reference A composition, kept for any screen shape.
 */
export interface Rig {
  /** 0 = in the vestibule, 1 = through the doors in the garden. */
  travel: number
  /** Look-target blend toward the mandap. */
  look: number
}

export function framing(aspect: number) {
  const portrait = aspect < 0.85
  const fov = portrait ? 46 : aspect < 1.3 ? 40 : 36
  const dz = portrait ? 2.85 : aspect < 1.3 ? 3.3 : 3.75
  // a low, cinematic vantage near the envelope's height, looking toward the doorway
  const eye = new THREE.Vector3(0, portrait ? 0.82 : 0.78, ENVELOPE_POS.z + dz)
  const envCentre = ENVELOPE_POS.clone().setY(0.39)
  const down = Math.atan2(eye.y - envCentre.y, dz)
  // the envelope sits about 8 % below the frame centre
  const pitch = down - (portrait ? 0.02 : 0.02) * THREE.MathUtils.degToRad(fov / 2)
  const target = new THREE.Vector3(0, eye.y - Math.tan(pitch) * eye.z, 0)
  return { fov, eye, target }
}

function CameraRig({ rig }: { rig: MutableRefObject<Rig> }) {
  const { camera, size } = useThree()
  const cam = camera as THREE.PerspectiveCamera
  const base = useRef(framing(size.width / size.height))
  useLayoutEffect(() => {
    base.current = framing(size.width / size.height)
  }, [size.width, size.height])
  const look = useRef(new THREE.Vector3())
  const pos = useRef(new THREE.Vector3())
  useFrame(({ clock }) => {
    const { fov, eye, target } = base.current
    const { travel, look: lk } = rig.current
    // a gentle breathing drift while idle
    const t = clock.elapsedTime
    const drift = (1 - travel) * 0.015
    pos.current.set(eye.x + Math.sin(t * 0.21) * drift, eye.y + Math.sin(t * 0.17) * drift * 0.6, THREE.MathUtils.lerp(eye.z, -16, travel))
    // a crane move: lift clear of the open envelope first, then glide down the aisle in a shallow arc
    pos.current.y = THREE.MathUtils.lerp(pos.current.y, 1.9, THREE.MathUtils.smoothstep(travel, 0, 0.25)) + Math.sin(Math.PI * travel) * 0.35
    look.current.copy(target).lerp(new THREE.Vector3(0, 3.0, -34), lk)
    cam.position.copy(pos.current)
    cam.lookAt(look.current)
    const f = THREE.MathUtils.lerp(fov, fov * 0.92, travel)
    if (Math.abs(cam.fov - f) > 0.01) {
      cam.fov = f
      cam.updateProjectionMatrix()
    }
  })
  return null
}

/** A warm spot from the front-left so the embroidery and seal catch the light. */
function KeyLight({ castShadow, mapSize }: { castShadow: boolean; mapSize: number }) {
  const scene = useThree((s) => s.scene)
  const light = useMemo(() => {
    const l = new THREE.SpotLight('#ffd2a0', 9, 12, 0.5, 0.95, 1.6)
    l.position.set(0.6, 3.4, 6.2)
    l.target.position.set(0, 0.35, 2.2)
    l.castShadow = castShadow
    l.shadow.mapSize.set(mapSize, mapSize)
    l.shadow.bias = -0.0005
    return l
  }, [castShadow, mapSize])
  useLayoutEffect(() => {
    scene.add(light.target)
    return () => {
      scene.remove(light.target)
    }
  }, [scene, light])
  return <primitive object={light} />
}

/** The garden lies up a short flight of marble steps beyond the threshold. */
const GARDEN_Y = 0.6
function GardenSteps() {
  const { marble } = useWorldAssets()
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: marble.map, roughnessMap: marble.roughnessMap, color: '#8f7d68', roughness: 0.42, envMapIntensity: 0.45 }), [marble])
  const plinth = useMemo(() => new THREE.MeshStandardMaterial({ color: '#9a7458', roughness: 0.8 }), [])
  return (
    <group>
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} material={mat} position={[0, (k + 1) * 0.15 - 0.075, -0.75 - k * 0.42]} receiveShadow castShadow>
          <boxGeometry args={[3.6, 0.15, 0.42 + (3 - k) * 0.84]} />
        </mesh>
      ))}
      {/* sandstone plinths either side of the stair, level with the garden terrace */}
      {[-1, 1].map((side) => (
        <mesh key={side} material={plinth} position={[side * 4.9, GARDEN_Y / 2, -1.3]} receiveShadow>
          <boxGeometry args={[6.2, GARDEN_Y, 1.9]} />
        </mesh>
      ))}
    </group>
  )
}

/** Development only: report the envelope's on-screen box (CSS px) so tests can check the lettering never covers it. */
function DevProbe({ envRef }: { envRef: RefObject<EnvelopeHandle | null> }) {
  const { camera, size } = useThree()
  useEffect(() => {
    const w = window as unknown as { __envelopeRect?: () => { l: number; r: number; t: number; b: number } | null }
    w.__envelopeRect = () => {
      const root = envRef.current?.root
      if (!root) return null
      root.updateWorldMatrix(true, true)
      const box = new THREE.Box3().setFromObject(root)
      const r = { l: Infinity, r: -Infinity, t: Infinity, b: -Infinity }
      for (let i = 0; i < 8; i++) {
        const p = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(camera)
        const x = ((p.x + 1) / 2) * size.width
        const y = ((1 - p.y) / 2) * size.height
        r.l = Math.min(r.l, x)
        r.r = Math.max(r.r, x)
        r.t = Math.min(r.t, y)
        r.b = Math.max(r.b, y)
      }
      return r
    }
    return () => {
      delete w.__envelopeRect
    }
  }, [camera, size, envRef])
  return null
}

export interface IntroWorldHandle {
  envelope: EnvelopeHandle | null
  doorL: THREE.Group | null
  doorR: THREE.Group | null
  rig: Rig
}

function Scene({ quality, rigRef, envRef, doorL, doorR, onFirstFrame }: {
  quality: Quality
  rigRef: MutableRefObject<Rig>
  envRef: RefObject<EnvelopeHandle | null>
  doorL: RefObject<THREE.Group | null>
  doorR: RefObject<THREE.Group | null>
  onFirstFrame: () => void
}) {
  const fired = useRef(false)
  useFrame(() => {
    if (!fired.current) {
      fired.current = true
      requestAnimationFrame(onFirstFrame)
    }
  })
  return (
    <WorldAssetsProvider quality={quality}>
      <FlameField>
      <fog attach="fog" args={['#d98455', 22, 125]} />
      <Sky />
      <SunsetEnvironment />
      <hemisphereLight args={['#ffcf9a', '#1e0f06', 0.26]} />
      <directionalLight
        position={[1.4, 5.2, -14]}
        intensity={2.1}
        color="#ffb36b"
        castShadow={false}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={5}
        shadow-camera-bottom={-1}
        shadow-camera-near={1}
        shadow-camera-far={30}
        shadow-bias={-0.0004}
      />
      {/* warm key from the front so the envelope's embroidery catches the light */}
      <KeyLight castShadow={quality.shadows} mapSize={quality.shadowMapSize} />
      {/* light spilling through the doorway */}
      <pointLight position={[0, 1.8, -0.6]} intensity={3.2} distance={6} decay={1.8} color="#ffbf73" />

      <MarbleFloor size={[16, 10]} position={[0, 0, 4.8]} repeat={4} />
      <Vestibule />
      <PalaceDoor ref={doorL} side="left" open={0.95} />
      <PalaceDoor ref={doorR} side="right" open={0.95} />
      <Envelope ref={envRef} position={ENVELOPE_POS} rotation-x={-0.1} />
      <GardenSteps />
      {!(import.meta.env.DEV && new URLSearchParams(location.search).has('nogarden')) && (
        <group position-y={GARDEN_Y}>
          <Garden />
        </group>
      )}
      <Petals count={quality.petals} bounds={[[-2.6, 0, 0.4], [2.6, 4.4, 5.6]]} resting={70} />
      <CameraRig rig={rigRef} />
      {import.meta.env.DEV && <DevProbe envRef={envRef} />}
      </FlameField>

      {!(import.meta.env.DEV && new URLSearchParams(location.search).has('nopost')) && <EffectComposer multisampling={quality.msaa} enableNormalPass={false}>
        {quality.dof ? <DepthOfField target={[0, 0.45, 2.2]} focalLength={0.045} bokehScale={2.6} height={480} /> : <></>}
        <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.95} luminanceSmoothing={0.3} radius={0.7} />
        <Vignette offset={0.22} darkness={0.72} />
        <Noise opacity={0.045} blendFunction={BlendFunction.OVERLAY} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>}
    </WorldAssetsProvider>
  )
}

/** The intro's real-time palace scene (vestibule, doors, envelope, garden). */
export const IntroWorld = forwardRef<IntroWorldHandle, { quality: Quality; onReady: () => void; onLost?: () => void; className?: string }>(function IntroWorld(
  { quality, onReady, onLost, className },
  ref,
) {
  // a lost GPU context (driver reset, memory pressure) hands over to the painted fallback;
  // ignored once this component is unmounting (the renderer releases its context then)
  const alive = useRef(true)
  const lost = useRef(onLost)
  useEffect(() => {
    lost.current = onLost
  })
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  const rig = useRef<Rig>({ travel: 0, look: 0 })
  const envRef = useRef<EnvelopeHandle | null>(null)
  const doorL = useRef<THREE.Group | null>(null)
  const doorR = useRef<THREE.Group | null>(null)
  // device pixel ratio within the tier's pixel budget; stepped down further if the GPU falls behind
  const [scale, setScale] = useState(1)
  const dpr = useMemo((): [number, number] => {
    const fit = Math.sqrt(quality.maxPixels / Math.max(1, window.innerWidth * window.innerHeight))
    const hi = Math.max(0.6, Math.min(quality.dpr[1], window.devicePixelRatio || 1, fit) * scale)
    return [Math.min(quality.dpr[0], hi), hi]
  }, [quality, scale])
  useImperativeHandle(ref, () => ({
    get envelope() {
      return envRef.current
    },
    get doorL() {
      return doorL.current
    },
    get doorR() {
      return doorR.current
    },
    rig: rig.current,
  }))
  return (
    <Canvas
      className={className}
      dpr={dpr}
      shadows={quality.shadows}
      gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping, stencil: false }}
      camera={{ fov: 46, near: 0.05, far: 900, position: [0, 1.3, 5.2] }}
      aria-hidden="true"
      onCreated={({ gl, scene }) => {
        gl.domElement.addEventListener('webglcontextlost', () => {
          if (alive.current) lost.current?.()
        })
        if (import.meta.env.DEV) Object.assign(window, { __gl: gl, __scene: scene })
      }}
    >
      <PerformanceMonitor ms={400} iterations={6} threshold={0.75} onDecline={() => setScale((s) => Math.max(0.6, s - 0.15))} />
      <Suspense fallback={null}>
        <Scene quality={quality} rigRef={rig} envRef={envRef} doorL={doorL} doorR={doorR} onFirstFrame={onReady} />
      </Suspense>
    </Canvas>
  )
})

export { DOOR }
