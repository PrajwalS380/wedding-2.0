import * as THREE from 'three'
import { FULLSCREEN_VERT, NOISE_GLSL } from './glsl'

/**
 * GPU texture baking: Canvas 2D draws the vector ornament (fast), then GLSL
 * passes rendered into render targets do the per-pixel work — blur, normals,
 * ambient occlusion, wood grain, stitching, wax, marble — in milliseconds,
 * even on phones. The results are ordinary textures used by standard PBR
 * materials.
 */

export interface Baker {
  renderer: THREE.WebGLRenderer
  /** Max texture edge for this device (lower on phones). */
  maxSize: number
}

const quadGeo = new THREE.PlaneGeometry(2, 2)
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

export function makeRT(w: number, h: number, opts: { mipmaps?: boolean; float?: boolean; srgb?: boolean; wrap?: THREE.Wrapping } = {}) {
  const rt = new THREE.WebGLRenderTarget(w, h, {
    type: opts.float ? THREE.HalfFloatType : THREE.UnsignedByteType,
    format: THREE.RGBAFormat,
    generateMipmaps: !!opts.mipmaps,
    minFilter: opts.mipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: opts.wrap ?? THREE.ClampToEdgeWrapping,
    wrapT: opts.wrap ?? THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    colorSpace: opts.srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace,
  })
  rt.texture.anisotropy = 8
  return rt
}

/** Runs a fragment shader over a render target. */
export function runPass(baker: Baker, rt: THREE.WebGLRenderTarget, fragment: string, uniforms: Record<string, THREE.IUniform>) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: FULLSCREEN_VERT,
    fragmentShader: `precision highp float;\nvarying vec2 vUv;\n${NOISE_GLSL}\n${fragment}`,
    uniforms,
    depthTest: false,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(quadGeo, mat)
  const scene = new THREE.Scene()
  scene.add(mesh)
  const { renderer } = baker
  const prevRT = renderer.getRenderTarget()
  const prevAuto = renderer.autoClear
  const prevTone = renderer.toneMapping
  renderer.toneMapping = THREE.NoToneMapping
  renderer.autoClear = true
  renderer.setRenderTarget(rt)
  renderer.render(scene, quadCam)
  renderer.setRenderTarget(prevRT)
  renderer.autoClear = prevAuto
  renderer.toneMapping = prevTone
  mat.dispose()
  return rt.texture
}

/** Separable gaussian blur of one channel set (RGB) into a new target. */
export function blur(baker: Baker, src: THREE.Texture, w: number, h: number, radiusPx: number): THREE.WebGLRenderTarget {
  const a = makeRT(w, h, { float: true })
  const b = makeRT(w, h, { float: true })
  const frag = /* glsl */ `
    uniform sampler2D src; uniform vec2 dir; uniform float radius;
    void main() {
      vec4 acc = vec4(0.0); float wsum = 0.0;
      for (int i = -12; i <= 12; i++) {
        float t = float(i) / 12.0;
        float w = exp(-t * t * 2.5);
        acc += texture2D(src, vUv + dir * t * radius) * w;
        wsum += w;
      }
      gl_FragColor = acc / wsum;
    }`
  runPass(baker, a, frag, { src: { value: src }, dir: { value: new THREE.Vector2(1 / w, 0) }, radius: { value: radiusPx } })
  runPass(baker, b, frag, { src: { value: a.texture }, dir: { value: new THREE.Vector2(0, 1 / h) }, radius: { value: radiusPx } })
  a.dispose()
  return b
}

export function canvasTex(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.NoColorSpace
  t.minFilter = THREE.LinearFilter
  t.generateMipmaps = false
  t.needsUpdate = true
  return t
}

/** Final normal-map pass from a height texture (R channel). */
export const NORMAL_FROM_HEIGHT = /* glsl */ `
  uniform sampler2D height; uniform vec2 texel; uniform float strength;
  float H(vec2 uv) { return texture2D(height, uv).r; }
  void main() {
    float dx = (H(vUv + vec2(texel.x, 0.0)) - H(vUv - vec2(texel.x, 0.0))) * strength;
    float dy = (H(vUv + vec2(0.0, texel.y)) - H(vUv - vec2(0.0, texel.y))) * strength;
    vec3 n = normalize(vec3(-dx, -dy, 1.0));
    gl_FragColor = vec4(n * 0.5 + 0.5, 1.0);
  }`

export function disposeLater(...targets: Array<{ dispose(): void } | undefined>) {
  for (const t of targets) t?.dispose()
}
