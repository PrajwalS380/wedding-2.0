import { MeshReflectorMaterial } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { useWorldAssets } from '../assets'

/**
 * Polished ivory marble. On capable devices it reflects the scene (blurred,
 * roughness-modulated planar reflection); otherwise a plain polished PBR floor
 * that still mirrors the environment. Tiling is done in the geometry's UVs —
 * the baked marble is a GPU render target and must not be cloned.
 */
export function MarbleFloor({ size = [24, 24] as [number, number], position = [0, 0, 0] as [number, number, number], repeat = 6, reflect = true, tint = '#b8a690', roughness = 0.22, envMapIntensity = 0.9 }) {
  const { marble, quality } = useWorldAssets()
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(size[0], size[1])
    const uv = g.attributes.uv
    const ry = (repeat * size[1]) / size[0]
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * repeat, uv.getY(i) * ry)
    return g
  }, [size, repeat])

  return (
    <mesh geometry={geo} rotation-x={-Math.PI / 2} position={position} receiveShadow>
      {quality.reflections && reflect ? (
        <MeshReflectorMaterial
          map={marble.map}
          roughnessMap={marble.roughnessMap}
          roughness={0.55}
          metalness={0}
          blur={[400, 140]}
          resolution={quality.reflectorResolution}
          mixBlur={1}
          mixStrength={0.7}
          mixContrast={1}
          depthScale={0.5}
          minDepthThreshold={0.5}
          maxDepthThreshold={1.2}
          mirror={0.2}
          color="#b8a690"
          envMapIntensity={0.45}
        />
      ) : (
        <meshStandardMaterial map={marble.map} roughnessMap={marble.roughnessMap} roughness={roughness} metalness={0} color={tint} envMapIntensity={envMapIntensity} />
      )}
    </mesh>
  )
}
