import type { ReactNode } from 'react'
import * as THREE from 'three'
import { LampStand } from '../objects/BrassLamps'
import { Elephant } from '../objects/Elephant'
import { FloralCorner } from '../objects/FloralCluster'
import { Garden } from '../objects/Garden'
import { Garland, hangingStrand } from '../objects/Garland'
import { WaxSeal, Tassel } from '../objects/Keepsakes'
import { Lotus, LotusLeaf } from '../objects/Lotus'
import { Lounge } from '../objects/Lounge'
import { Petals } from '../objects/Petals'
import { Sky } from '../objects/Sky'
import { SunsetEnvironment } from '../env/SunsetEnvironment'
import { CoupleCard } from './couple'

/** ?lite: lighter GPU memory for the largest frames (the capture script's retry), invisible after the downsample */
export const LITE = new URLSearchParams(location.search).has('lite')

type V3 = [number, number, number]

/** One still: what to frame, at what size, and how it is lit. */
export interface Shot {
  /** Output size in CSS pixels (rendered at 2× and downsampled by the capture script). */
  w: number
  h: number
  camera: { position: V3; target: V3; fov: number }
  /** Transparent background, studio lighting, no post-processing (single objects). */
  transparent?: boolean
  /** Golden hour (0) to twilight (1), for the garden shots. */
  dusk?: number
  /** Focus distance for a shallow depth of field (garden shots). */
  focus?: V3
  content: () => ReactNode
}

/** The palace garden, lit for the hour. */
function GardenSet({ dusk = 0, petals = 0, palmsRight = true }: { dusk?: number; petals?: number; palmsRight?: boolean }) {
  const fog = new THREE.Color('#d98455').lerp(new THREE.Color('#4a2c44'), dusk)
  return (
    <>
      <fog attach="fog" args={[fog, 22, 125]} />
      <Sky dusk={dusk} />
      <SunsetEnvironment />
      <hemisphereLight args={['#ffcf9a', '#1e0f06', 0.26 * (1 - dusk * 0.55)]} />
      {/* the low sun behind the palace: long, soft shadows across the lawn and aisle toward the camera */}
      <directionalLight
        position={[3, 9, -72]}
        intensity={2.4 * (1 - dusk * 0.8)}
        color="#ffb36b"
        castShadow
        shadow-mapSize={LITE ? [2048, 2048] : [4096, 4096]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.04}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={1}
        shadow-camera-far={140}
      >
        <object3D attach="target" position={[0, 0, -18]} />
      </directionalLight>
      <Garden palmsRight={palmsRight} />
      {petals > 0 && <Petals count={petals} bounds={[[-3, 0.2, -16], [3, 4.5, -4]]} seed={21} />}
    </>
  )
}

/** Night light for objects set into the dusk scenes: a lamp's warm key, violet sky above, a festive rim behind. */
function NightLight() {
  return (
    <>
      <SunsetEnvironment />
      <hemisphereLight args={['#8a78c0', '#2a1608', 0.55]} />
      <pointLight position={[-2.6, 1.4, 2.8]} color="#ffad5a" intensity={5} distance={10} decay={2} />
      <directionalLight
        position={[-3, 4.5, 4]}
        intensity={1.5}
        color="#ffc488"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.03}
        shadow-camera-left={-2.5}
        shadow-camera-right={2.5}
        shadow-camera-top={3}
        shadow-camera-bottom={-1}
        shadow-camera-near={0.5}
        shadow-camera-far={14}
      />
      <directionalLight position={[2.5, 3.2, -3]} intensity={1.6} color="#ff8ab8" />
      <directionalLight position={[-1, 2.5, 4]} intensity={0.55} color="#ffe2bd" />
    </>
  )
}

/** Soft studio light for single objects on a transparent background. */
function StudioLight() {
  return (
    <>
      <SunsetEnvironment />
      <hemisphereLight args={['#fff1dc', '#3a2412', 0.32]} />
      <directionalLight
        position={[-1.2, 2.2, 2.6]}
        intensity={3.2}
        color="#fff0d8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.01}
        shadow-camera-left={-1.2}
        shadow-camera-right={1.6}
        shadow-camera-top={1.2}
        shadow-camera-bottom={-1.6}
        shadow-camera-near={0.5}
        shadow-camera-far={8}
      />
      <directionalLight position={[2, 0.6, -1.5]} intensity={1.4} color="#ffb070" />
    </>
  )
}

export const SHOTS: Record<string, Shot> = {
  // ---------------------------------------------------------------- the garden
  // the hero: the couple on the aisle, in focus, the mandap and palace soft behind them
  'hero-wide': {
    w: 1920,
    h: 1080,
    camera: { position: [0, 1.7, -9.5], target: [0, 2.55, -34], fov: 42 },
    focus: [1.0, 1.1, -15.2],
    content: () => (
      <>
        <GardenSet petals={40} />
        <CoupleCard position={[1.0, 0, -15.2]} />
      </>
    ),
  },
  'hero-tablet': {
    w: 1200,
    h: 1600,
    camera: { position: [0, 1.6, -10.2], target: [0, 3.9, -34], fov: 50 },
    focus: [0, 1.1, -15.8],
    content: () => (
      <>
        <GardenSet petals={40} />
        <CoupleCard position={[0, 0, -15.8]} />
      </>
    ),
  },
  'hero-tall': {
    w: 900,
    h: 1600,
    camera: { position: [0, 1.55, -10.5], target: [0, 3.75, -34], fov: 58 },
    focus: [0, 1.1, -14.4],
    content: () => (
      <>
        <GardenSet petals={40} />
        <CoupleCard position={[0, 0, -14.4]} />
      </>
    ),
  },
  'garden-wide': {
    w: 1920,
    h: 1080,
    camera: { position: [0, 1.75, -9.5], target: [0, 3.3, -34], fov: 42 },
    focus: [0, 1.5, -30],
    content: () => <GardenSet petals={40} />,
  },
  'garden-tall': {
    w: 900,
    h: 1600,
    camera: { position: [0, 1.6, -11], target: [0, 3.9, -34], fov: 58 },
    focus: [0, 1.5, -30],
    content: () => <GardenSet petals={40} />,
  },
  'mandap-wide': {
    w: 1600,
    h: 1000,
    camera: { position: [0, 1.65, -26.2], target: [0, 1.75, -34], fov: 46 },
    focus: [0, 1.4, -33],
    content: () => <GardenSet />,
  },
  'dusk-wide': {
    w: 1920,
    h: 1080,
    camera: { position: [0, 1.75, -9.5], target: [0, 3.3, -34], fov: 42 },
    dusk: 0.8,
    content: () => <GardenSet dusk={0.8} />,
  },

  // the venue: the palace mirrored in the long pool, lamps along the banks
  'venue-wide': {
    w: 1600,
    h: 1000,
    camera: { position: [0, 1.9, -36.5], target: [0, 7.5, -105], fov: 40 },
    focus: [0, 6, -100],
    content: () => <GardenSet />,
  },
  'venue-tall': {
    w: 900,
    h: 1600,
    camera: { position: [0, 1.8, -38], target: [0, 9, -105], fov: 60 },
    focus: [0, 6, -100],
    content: () => <GardenSet />,
  },

  // the closing: the palace at dusk low in the frame, open sky above for the blessing
  'closing-wide': {
    w: 1920,
    h: 1080,
    camera: { position: [0, 1.9, -38.5], target: [0, 28, -105], fov: 42 },
    dusk: 0.85,
    content: () => <GardenSet dusk={0.85} />,
  },
  'closing-tall': {
    w: 900,
    h: 1600,
    camera: { position: [0, 1.8, -38], target: [0, 26, -105], fov: 62 },
    dusk: 0.85,
    content: () => <GardenSet dusk={0.85} />,
  },

  // guest services: the lounge under its canopy on the lawn, lanterns lit, the garden soft behind
  'lounge-wide': {
    w: 1920,
    h: 960,
    camera: { position: [12, 1.5, -5.4], target: [12, 0.95, -11.4], fov: 44 },
    focus: [12, 0.9, -10.6],
    content: () => (
      <>
        <GardenSet petals={20} palmsRight={false} />
        <Lounge position={[12, 0, -11]} />
        {/* evening light falling on the front of the lounge */}
        <spotLight position={[15.5, 4, -5.5]} target-position={[12, 0.6, -11]} angle={0.75} penumbra={1} intensity={60} distance={16} decay={2} color="#ffc890" />
      </>
    ),
  },

  // ---------------------------------------------------------------- single objects (transparent)
  // the carved elephant for the closing scene's foreground
  elephant: {
    w: 900,
    h: 760,
    transparent: true,
    camera: { position: [-0.5, 1.75, 6.2], target: [-0.15, 1.4, 0], fov: 31 },
    content: () => (
      <>
        <NightLight />
        <Elephant />
      </>
    ),
  },
  lotus: {
    w: 720,
    h: 470,
    transparent: true,
    camera: { position: [0.05, 0.36, 0.7], target: [0.05, 0.035, 0], fov: 33 },
    content: () => (
      <>
        <StudioLight />
        <LotusLeaf position={[-0.12, 0, 0.02]} radius={0.17} seed={4} rotation={0.6} tilt={-0.25} />
        <LotusLeaf position={[0.17, -0.01, -0.06]} radius={0.15} seed={7} rotation={2.1} tilt={0.2} />
        <Lotus position={[0.02, 0.0, 0.04]} size={0.13} seed={3} />
        <Lotus position={[-0.19, 0.0, -0.08]} size={0.085} seed={9} openness={0.55} rotation={1.2} />
      </>
    ),
  },
  garland: {
    w: 260,
    h: 1300,
    transparent: true,
    camera: { position: [0, 0.0, 3.2], target: [0, 0.0, 0], fov: 40 },
    content: () => (
      <>
        <StudioLight />
        <Garland points={hangingStrand(-0.12, 1.15, -1.05, 0, 0.02)} radius={0.04} density={900} seed={41} />
        <Garland points={hangingStrand(0.1, 1.15, -0.55, 0.06, 0.025)} radius={0.036} density={800} seed={42} />
      </>
    ),
  },
  strand: {
    w: 110,
    h: 1300,
    transparent: true,
    camera: { position: [0, 0.0, 3.2], target: [0, 0.0, 0], fov: 40 },
    content: () => (
      <>
        <StudioLight />
        <Garland points={hangingStrand(0, 1.15, -1.12, 0, 0.018)} radius={0.04} density={900} seed={43} />
      </>
    ),
  },
  // corner arrangements that frame each section (top-left; mirrored in CSS for the others)
  'florals-a': {
    w: 900,
    h: 900,
    transparent: true,
    camera: { position: [0.34, -0.3, 1.25], target: [0.34, -0.3, 0], fov: 34 },
    content: () => (
      <>
        <StudioLight />
        <FloralCorner seed={3} roses={11} shadows />
      </>
    ),
  },
  'florals-b': {
    w: 900,
    h: 900,
    transparent: true,
    camera: { position: [0.34, -0.3, 1.25], target: [0.34, -0.3, 0], fov: 34 },
    content: () => (
      <>
        <StudioLight />
        <FloralCorner seed={8} roses={7} shadows />
      </>
    ),
  },
  // a bottom-corner arrangement: roses, lotus, jasmine and leaves rising from the lower left
  'florals-bottom': {
    w: 900,
    h: 900,
    transparent: true,
    camera: { position: [0.36, 0.3, 1.3], target: [0.36, 0.3, 0], fov: 34 },
    content: () => (
      <>
        <StudioLight />
        <group scale={[1, -1, 1]}>
          <FloralCorner seed={12} roses={12} shadows />
        </group>
        <Lotus position={[0.42, 0.06, 0.12]} size={0.13} seed={41} />
        <Lotus position={[0.18, 0.12, 0.18]} size={0.09} seed={44} openness={0.6} rotation={1.1} />
        <LotusLeaf position={[0.5, 0.0, 0.08]} radius={0.17} seed={45} rotation={0.4} tilt={-1.2} />
      </>
    ),
  },
  lamp: {
    w: 320,
    h: 900,
    transparent: true,
    camera: { position: [0, 0.62, 3.4], target: [0, 0.62, 0], fov: 22 },
    content: () => (
      <>
        <StudioLight />
        <LampStand position={[0, 0, 0]} height={1.15} castShadow={false} />
      </>
    ),
  },
  'seal-tassels': {
    w: 520,
    h: 600,
    transparent: true,
    camera: { position: [0, -0.095, 0.78], target: [0, -0.095, 0], fov: 30 },
    content: () => (
      <>
        <StudioLight />
        <Tassel position={[-0.018, -0.02, -0.01]} rotation={-0.22} cord={0.09} length={0.1} seed={5} />
        <Tassel position={[0.018, -0.02, -0.012]} rotation={0.18} cord={0.11} length={0.1} seed={6} />
        <WaxSeal position={[0, 0.02, 0]} scale={1.15} />
      </>
    ),
  },
}
