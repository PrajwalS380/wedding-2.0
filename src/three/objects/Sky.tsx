import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { NOISE_GLSL } from '../bake/glsl'

/**
 * A golden-hour sky dome: deep amber at the horizon through rose and peach to a
 * soft lavender-blue zenith, a low sun with a wide warm halo, and slow layered
 * cloud bands lit from below. `dusk` (0..1) carries it into twilight.
 */
export const SUN_DIRECTION = new THREE.Vector3(0, 0.07, -1).normalize()

export function Sky({ dusk = 0 }: { dusk?: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          sunDir: { value: SUN_DIRECTION.clone() },
          time: { value: 0 },
          dusk: { value: dusk },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p.xyww;
          }`,
        fragmentShader: /* glsl */ `
          precision highp float;
          varying vec3 vDir;
          uniform vec3 sunDir; uniform float time; uniform float dusk;
          ${NOISE_GLSL}
          void main() {
            vec3 d = normalize(vDir);
            float h = clamp(d.y, -0.2, 1.0);
            // golden hour gradient (linear colour)
            vec3 horizon = mix(vec3(0.95, 0.36, 0.1), vec3(0.62, 0.22, 0.2), dusk);
            vec3 low = mix(vec3(0.92, 0.48, 0.3), vec3(0.42, 0.2, 0.32), dusk);
            vec3 mid = mix(vec3(0.78, 0.42, 0.5), vec3(0.2, 0.12, 0.3), dusk);
            vec3 zenith = mix(vec3(0.3, 0.3, 0.56), vec3(0.06, 0.06, 0.18), dusk);
            vec3 col = mix(horizon, low, smoothstep(0.0, 0.08, h));
            col = mix(col, mid, smoothstep(0.08, 0.28, h));
            col = mix(col, zenith, smoothstep(0.28, 0.85, h));
            // the sun and its halo
            float s = max(dot(d, sunDir), 0.0);
            col += vec3(1.0, 0.55, 0.25) * pow(s, 6.0) * 0.35 * (1.0 - dusk);
            col += vec3(1.0, 0.75, 0.45) * pow(s, 90.0) * 0.8 * (1.0 - dusk);
            col += vec3(1.5, 1.25, 0.9) * smoothstep(0.99955, 0.9998, s) * 4.0 * (1.0 - dusk * 0.9);
            // layered clouds: thin streaks near the horizon, lit warm from below
            vec2 uv = d.xz / max(d.y + 0.12, 0.05);
            float c = fbm(uv * vec2(0.35, 1.4) + vec2(time * 0.004, 0.0), 3) * 0.5 + 0.5;
            float band = smoothstep(0.02, 0.12, h) * (1.0 - smoothstep(0.25, 0.5, h));
            float cloud = smoothstep(0.55, 0.85, c) * band;
            vec3 cloudCol = mix(vec3(0.95, 0.5, 0.42), vec3(0.55, 0.3, 0.4), dusk) + vec3(0.35, 0.18, 0.06) * pow(s, 4.0);
            col = mix(col, cloudCol, cloud * 0.65);
            // below the horizon: warm haze
            col = mix(col, horizon * 0.9, smoothstep(0.0, -0.08, d.y));
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    // dusk is driven through the uniform below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  useFrame((_, dt) => {
    material.uniforms.time.value += dt
    material.uniforms.dusk.value = dusk
  })
  return (
    <mesh material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[400, 48, 24]} />
    </mesh>
  )
}
