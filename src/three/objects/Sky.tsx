import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { useWorldAssets } from '../assets'
import { NOISE_GLSL } from '../bake/glsl'

/**
 * A golden-hour sky dome: deep amber at the horizon through rose and peach to a
 * soft lavender-blue zenith, a low sun with a wide warm halo, and banks of cloud.
 * The clouds are billowing, domain-warped noise lit by the low sun: each bank is
 * sampled again a little way toward the sun, so the edges that face it burn gold
 * while the bellies turn mauve in their own shade, and the clouds nearest the sun
 * take a bright silver lining. High cirrus streaks catch the last pink light.
 * The detail follows the device's quality tier. `dusk` (0..1) carries it into twilight.
 */
export const SUN_DIRECTION = new THREE.Vector3(0, 0.07, -1).normalize()

const DETAIL = { ultra: 3, high: 2, medium: 1, low: 0 } as const

export function Sky({ dusk = 0 }: { dusk?: number }) {
  const { quality } = useWorldAssets()
  // ?sky=0..3 overrides the cloud detail in development (for measuring its cost)
  const forced = import.meta.env.DEV ? new URLSearchParams(location.search).get('sky') : null
  const detail = forced !== null ? Number(forced) : DETAIL[quality.tier]
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        defines: { CLOUD_DETAIL: detail },
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
          // cloud density on the cloud deck, with its large shapes bent by a slower noise
          float density(vec2 uv, vec2 warp) {
            #if CLOUD_DETAIL >= 3
              const int OCT = 5;
            #elif CLOUD_DETAIL == 2
              const int OCT = 4;
            #else
              const int OCT = 3;
            #endif
            return fbm(uv * vec2(0.28, 0.6) + warp * 1.0 + vec2(time * 0.004, 0.0), OCT) * 0.5 + 0.5;
          }
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

            // the cloud deck, seen in perspective
            vec2 uv = d.xz / max(d.y + 0.1, 0.045) * 1.6;
            float band = smoothstep(0.015, 0.09, h) * (1.0 - smoothstep(0.32, 0.62, h));
            #if CLOUD_DETAIL >= 2
              vec2 warp = vec2(fbm(uv * 0.12 + vec2(0.0, time * 0.002), 3), fbm(uv * 0.12 + vec2(5.2, 1.3), 3));
            #elif CLOUD_DETAIL == 1
              vec2 warp = vec2(fbm(uv * 0.12, 2), 0.0);
            #else
              vec2 warp = vec2(0.0);
            #endif
            float dens = density(uv, warp);
            // thinner just round the sun, so it glows through a gap
            float cover = 0.53 + 0.08 * pow(s, 24.0);
            float cl = smoothstep(cover, cover + 0.2, dens) * band;
            // light: compare with the density a step toward the sun; the edges facing it burn gold
            #if CLOUD_DETAIL >= 2
              vec2 sunUv = sunDir.xz / max(sunDir.y + 0.1, 0.045) * 1.6;
              vec2 toSun = normalize(sunUv - uv + 1e-4);
              float dens2 = density(uv + toSun * 0.5, warp);
              float lit = clamp((dens - dens2) * 5.0 + 0.28, 0.0, 1.0);
            #else
              float lit = clamp(1.1 - (dens - cover) * 3.0, 0.0, 1.0);
            #endif
            float near = pow(s, 5.0);
            vec3 shadeCol = mix(vec3(0.4, 0.2, 0.3), vec3(0.18, 0.1, 0.2), dusk);
            vec3 litCol = mix(vec3(1.1, 0.56, 0.26), vec3(0.62, 0.3, 0.32), dusk);
            vec3 cloudCol = mix(shadeCol, litCol, lit) * (0.9 + 0.3 * h);
            // a silver lining on the clouds nearest the sun
            cloudCol += vec3(1.2, 0.85, 0.5) * near * lit * 1.6 * (1.0 - dusk);
            // thin edges let the sky through
            col = mix(col, cloudCol, cl * (0.6 + 0.38 * smoothstep(cover, cover + 0.3, dens)));

            // high cirrus: long, faint streaks catching pink light
            #if CLOUD_DETAIL >= 1
              vec2 cu = d.xz / max(d.y + 0.25, 0.1);
              float ci = smoothstep(0.58, 0.88, fbm(cu * vec2(0.18, 2.2) + vec2(time * 0.003, 3.0), 3) * 0.5 + 0.5);
              ci *= smoothstep(0.12, 0.3, h) * (1.0 - smoothstep(0.6, 0.9, h));
              col = mix(col, mix(vec3(1.0, 0.66, 0.6), vec3(0.45, 0.25, 0.4), dusk) + vec3(0.3, 0.15, 0.05) * near, ci * 0.35);
            #endif

            // below the horizon: warm haze
            col = mix(col, horizon * 0.9, smoothstep(0.0, -0.08, d.y));
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    // dusk is driven through the uniform below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [detail],
  )
  useFrame((_, dt) => {
    material.uniforms.time.value += dt
    material.uniforms.dusk.value = dusk
  })
  return (
    // drawn after the opaque scene at the far plane: the depth test then skips every pixel
    // already covered by a wall, a tree or the palace, so the clouds cost only what shows
    <mesh material={material} renderOrder={10} frustumCulled={false}>
      <sphereGeometry args={[400, 48, 24]} />
    </mesh>
  )
}
