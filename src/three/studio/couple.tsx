import { useMemo } from 'react'
import * as THREE from 'three'
import coupleUrl from './assets/couple.webp'

/**
 * The couple: the illustration (tools/couple/build_couple.py) relit as rounded, sunlit forms by
 * tools/couple/paint_couple.py. Loaded once before any shot renders.
 */
let image: HTMLImageElement | null = null

export function loadCouple(): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      image = img
      resolve()
    }
    img.onerror = () => resolve()
    img.src = coupleUrl
  })
}

/**
 * The couple standing in the scene: the illustration rasterised onto an upright
 * card, so the render's fog, bloom and depth of field treat them like everything
 * else in the garden. `height` is their height in metres (feet at y = 0).
 */
export function CoupleCard({ position, height = 1.8 }: { position: [number, number, number]; height?: number }) {
  const material = useMemo(() => {
    if (!image) return null
    const c = document.createElement('canvas')
    // at most 1200 x 1920: the shots already sit near the GPU's memory limit
    const k = Math.min(1, 1920 / image.naturalHeight)
    c.width = Math.round(image.naturalWidth * k)
    c.height = Math.round(image.naturalHeight * k)
    const g = c.getContext('2d')!
    g.imageSmoothingQuality = 'high'
    g.drawImage(image, 0, 0, c.width, c.height)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    // writes depth (for the depth of field) except where the art is fully clear
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.02, toneMapped: true })
  }, [])
  // a soft contact shadow at their feet, stretched toward the camera (the sun is behind them)
  const shadow = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
    grad.addColorStop(0, 'rgba(30,14,6,0.75)')
    grad.addColorStop(0.45, 'rgba(30,14,6,0.4)')
    grad.addColorStop(1, 'rgba(30,14,6,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 256, 256)
    const t = new THREE.CanvasTexture(c)
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })
  }, [])
  if (!material) return null
  // the art is 600 x 960 with the feet at y = 940
  const h = height * (960 / 900)
  const w = h * (600 / 960)
  return (
    <group>
      <mesh material={shadow} rotation-x={-Math.PI / 2} position={[position[0] + w * 0.08, position[1] + 0.015, position[2] + 0.55]} renderOrder={1}>
        <planeGeometry args={[w * 1.05, 1.6]} />
      </mesh>
      <mesh material={material} position={[position[0], position[1] + h / 2 - h * (20 / 960), position[2]]} renderOrder={2}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  )
}
