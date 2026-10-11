import * as THREE from 'three'
import { drawDoorArt } from './doorArt'
import { drawEmbroidery, EMB_H, EMB_W } from './embroideryArt'
import { blur, canvasTex, makeRT, NORMAL_FROM_HEIGHT, runPass, type Baker } from './gpuBake'
import { drawSealArt } from './sealArt'

/** A baked PBR set: albedo (sRGB), tangent-space normal, ORM (AO, roughness, metalness). */
export interface PBRSet {
  map: THREE.Texture
  normalMap: THREE.Texture
  ormMap: THREE.Texture
}

const v2 = (x: number, y: number) => new THREE.Vector2(x, y)

function finalize(baker: Baker, w: number, h: number, height: THREE.Texture, normalStrength: number, colorFrag: string, ormFrag: string, uniforms: Record<string, THREE.IUniform>): PBRSet {
  const normalRT = makeRT(w, h, { mipmaps: true })
  runPass(baker, normalRT, NORMAL_FROM_HEIGHT, { height: { value: height }, texel: { value: v2(1 / w, 1 / h) }, strength: { value: normalStrength } })
  const colorRT = makeRT(w, h, { mipmaps: true, srgb: true })
  runPass(baker, colorRT, colorFrag, uniforms)
  const ormRT = makeRT(w, h, { mipmaps: true })
  runPass(baker, ormRT, ormFrag, uniforms)
  return { map: colorRT.texture, normalMap: normalRT.texture, ormMap: ormRT.texture }
}

// ------------------------------------------------------------------ carved door
export function bakeDoor(baker: Baker, flip: boolean): PBRSet {
  const w = baker.maxSize >= 2048 ? 640 : 448
  const h = w * 3
  const k = w / 512 // design → bake pixels
  const art = drawDoorArt(w, h, flip)
  const heightTex = canvasTex(art.height)
  const goldTex = canvasTex(art.gold)
  const grooveTex = canvasTex(art.groove)
  const hBlur = blur(baker, heightTex, w, h, 3.2 * k)
  const gBlur = blur(baker, goldTex, w, h, 1.0 * k)
  const grBlur = blur(baker, grooveTex, w, h, 0.9 * k)
  const hRT = makeRT(w, h, { float: true })
  const GRAIN = /* glsl */ `
    float grain(vec2 uv, float seed) {
      float warp = fbm(uv * vec2(3.0, 1.2) + seed, 3);
      float f = fbm(vec2(uv.x * 26.0 + warp * 2.2, uv.y * 2.4) + seed, 4);
      return f;
    }`
  runPass(
    baker,
    hRT,
    /* glsl */ `
    uniform sampler2D hb; uniform sampler2D gr; uniform float seed;
    ${GRAIN}
    void main() {
      float h = texture2D(hb, vUv).r - texture2D(gr, vUv).r * 0.2 + grain(vUv, seed) * 0.012;
      gl_FragColor = vec4(h, h, h, 1.0);
    }`,
    { hb: { value: hBlur.texture }, gr: { value: grBlur.texture }, seed: { value: flip ? 11.3 : 3.7 } },
  )
  const local = blur(baker, hRT.texture, w, h, 12 * k)
  const uniforms = {
    hf: { value: hRT.texture },
    local: { value: local.texture },
    gold: { value: gBlur.texture },
    seed: { value: flip ? 11.3 : 3.7 },
  }
  const COMMON = /* glsl */ `
    uniform sampler2D hf; uniform sampler2D local; uniform sampler2D gold; uniform float seed;
    ${GRAIN}
    float cavity() { return smoothstep(-0.12, 0.08, texture2D(hf, vUv).r - texture2D(local, vUv).r); }
    float goldMask() { return clamp(texture2D(gold, vUv).r * 1.7, 0.0, 1.0); }
  `
  const set = finalize(
    baker,
    w,
    h,
    hRT.texture,
    5.5 * (w / 512),
    /* glsl */ `${COMMON}
    void main() {
      float hgt = texture2D(hf, vUv).r;
      float raised = smoothstep(0.3, 0.9, hgt);
      float gr = grain(vUv, seed) * 0.5 + 0.5;
      float rings = 0.5 + 0.5 * sin(vUv.x * 160.0 + grain(vUv * 1.7, seed + 2.0) * 9.0);
      vec3 wood = vec3(0.055, 0.024, 0.01) + vec3(0.035, 0.016, 0.006) * gr + vec3(0.016, 0.007, 0.002) * rings;
      wood += vec3(0.07, 0.034, 0.012) * raised;        // worn, lighter highlights on the carving
      wood *= mix(0.7, 1.0, cavity());                    // grime in the recesses
      float gm = goldMask();
      float gv = snoise(vUv * vec2(40.0, 120.0)) * 0.5 + 0.5;
      vec3 gilt = mix(vec3(0.74, 0.5, 0.2), vec3(0.95, 0.74, 0.36), gv);
      gl_FragColor = vec4(mix(wood, gilt, gm), 1.0);
    }`,
    /* glsl */ `${COMMON}
    void main() {
      float hgt = texture2D(hf, vUv).r;
      float raised = smoothstep(0.3, 0.9, hgt);
      float gm = goldMask();
      float ao = mix(0.42, 1.0, cavity());
      float rough = 0.6 - raised * 0.14 - gm * 0.3;
      gl_FragColor = vec4(ao, rough, gm, 1.0);
    }`,
    uniforms,
  )
  for (const t of [heightTex, goldTex, grooveTex]) t.dispose()
  for (const rt of [hBlur, gBlur, grBlur]) rt.dispose()
  return set
}

// ------------------------------------------------------------------ embroidery on velvet
export function bakeEmbroidery(baker: Baker): PBRSet {
  const w = baker.maxSize >= 2048 ? 1536 : 1024
  const h = Math.round((w * EMB_H) / EMB_W)
  const k = w / EMB_W
  const maskTex = canvasTex(drawEmbroidery(w, h))
  const mBlur = blur(baker, maskTex, w, h, 1.1 * k)
  const hRT = makeRT(w, h, { float: true })
  const COMMON = /* glsl */ `
    uniform sampler2D mask; uniform vec2 res;
    float thread() { return clamp(texture2D(mask, vUv).r * 1.7, 0.0, 1.0); }
    float nap() { return fbm(vUv * vec2(9.0, 6.0) + 4.0, 4) * 0.5 + 0.5; }
    float stitch() {
      vec2 p = vUv * res;
      return 0.5 + 0.5 * sin((p.x + p.y) * 1.6 + snoise(p / 40.0) * 2.0);
    }`
  runPass(
    baker,
    hRT,
    /* glsl */ `${COMMON}
    void main() {
      float t = thread();
      float h = t * (0.82 + stitch() * 0.18) + nap() * 0.035 + snoise(vUv * res * 0.9) * 0.006;
      gl_FragColor = vec4(h, h, h, 1.0);
    }`,
    { mask: { value: mBlur.texture }, res: { value: v2(w, h) } },
  )
  const uniforms = { mask: { value: mBlur.texture }, res: { value: v2(w, h) } }
  const set = finalize(
    baker,
    w,
    h,
    hRT.texture,
    3.4 * k,
    /* glsl */ `${COMMON}
    void main() {
      float t = thread();
      float v = nap();
      vec3 velvetC = vec3(0.004, 0.042, 0.027) + vec3(0.006, 0.026, 0.016) * v;
      float s = stitch();
      vec3 goldC = vec3(0.78, 0.56, 0.23) + vec3(0.14, 0.11, 0.06) * s;
      gl_FragColor = vec4(mix(velvetC, goldC, t), 1.0);
    }`,
    /* glsl */ `${COMMON}
    void main() {
      float t = thread();
      float halo = smoothstep(0.02, 0.35, texture2D(mask, vUv).r) * (1.0 - t);
      gl_FragColor = vec4(1.0 - halo * 0.35, 0.9 - t * 0.55, t * 0.95, 1.0);
    }`,
    uniforms,
  )
  maskTex.dispose()
  return set
}

// ------------------------------------------------------------------ wax seal face
export function bakeSeal(baker: Baker): PBRSet {
  const S = 512
  const art = drawSealArt(S)
  const hTex = canvasTex(art.height)
  const gTex = canvasTex(art.gold)
  const hBlur = blur(baker, hTex, S, S, 2.2)
  const gBlur = blur(baker, gTex, S, S, 1)
  const uniforms = { hb: { value: hBlur.texture }, gold: { value: gBlur.texture } }
  const COMMON = /* glsl */ `
    uniform sampler2D hb; uniform sampler2D gold;
    float gilt() { return clamp(texture2D(gold, vUv).r * 1.5, 0.0, 1.0); }
    float mott() { return fbm(vUv * 6.0 + 9.0, 3) * 0.5 + 0.5; }`
  const hRT = makeRT(S, S, { float: true })
  runPass(baker, hRT, `${COMMON} void main(){ float h = texture2D(hb, vUv).r + mott() * 0.02; gl_FragColor = vec4(h,h,h,1.0); }`, uniforms)
  const set = finalize(
    baker,
    S,
    S,
    hRT.texture,
    4.5,
    `${COMMON} void main(){ float g = gilt(); float v = mott();
      vec3 wax = vec3(0.36, 0.035, 0.06) + vec3(0.1, 0.02, 0.02) * v;
      vec3 gl = vec3(0.86, 0.64, 0.29) + vec3(0.06, 0.05, 0.02) * v;
      gl_FragColor = vec4(mix(wax, gl, g), 1.0); }`,
    `${COMMON} void main(){ float g = gilt(); float v = mott();
      gl_FragColor = vec4(1.0, 0.3 - g * 0.06 + v * 0.06, g, 1.0); }`,
    uniforms,
  )
  for (const t of [hTex, gTex]) t.dispose()
  return set
}

// ------------------------------------------------------------------ marble floor
export function bakeMarble(baker: Baker): { map: THREE.Texture; roughnessMap: THREE.Texture } {
  const S = baker.maxSize >= 2048 ? 1024 : 512
  const COMMON = /* glsl */ `
    float vein(vec2 uv) {
      vec2 p = uv * 3.0;
      float warp = fbm(p * 0.8 + 2.0, 4);
      float v = abs(sin((p.x * 1.4 + p.y * 0.9) * 2.0 + warp * 4.0));
      float veinMain = pow(1.0 - v, 22.0);
      float fine = pow(1.0 - abs(fbm(p * 2.2 + 7.0, 4)), 30.0);
      return veinMain * 0.55 + fine * 0.25;
    }
    float cloud(vec2 uv) { return fbm(uv * 2.4 + 13.0, 4) * 0.5 + 0.5; }`
  const mapRT = makeRT(S, S, { mipmaps: true, srgb: true, wrap: THREE.MirroredRepeatWrapping })
  runPass(
    baker,
    mapRT,
    `${COMMON} void main(){ float v = vein(vUv); float c = cloud(vUv);
      vec3 base = vec3(0.94, 0.9, 0.82) - vec3(0.03, 0.035, 0.04) * c;
      vec3 veinC = vec3(0.62, 0.58, 0.52);
      gl_FragColor = vec4(mix(base, veinC, clamp(v, 0.0, 1.0)), 1.0); }`,
    {},
  )
  const roughRT = makeRT(S, S, { mipmaps: true, wrap: THREE.MirroredRepeatWrapping })
  runPass(baker, roughRT, `${COMMON} void main(){ float r = 0.06 + cloud(vUv) * 0.06 + vein(vUv) * 0.12; gl_FragColor = vec4(r, r, r, 1.0); }`, {})
  return { map: mapRT.texture, roughnessMap: roughRT.texture }
}

// ------------------------------------------------------------------ plain velvet & wood
export function bakeVelvet(baker: Baker): { map: THREE.Texture; normalMap: THREE.Texture } {
  const S = 256
  const hRT = makeRT(S, S, { float: true, wrap: THREE.RepeatWrapping })
  runPass(baker, hRT, `void main(){ float h = fbm(vUv * 8.0 + 3.0, 4) * 0.5 + 0.5 + snoise(vUv * 120.0) * 0.06; gl_FragColor = vec4(h,h,h,1.0); }`, {})
  const n = makeRT(S, S, { mipmaps: true, wrap: THREE.RepeatWrapping })
  runPass(baker, n, NORMAL_FROM_HEIGHT, { height: { value: hRT.texture }, texel: { value: v2(1 / S, 1 / S) }, strength: { value: 1.6 } })
  const c = makeRT(S, S, { mipmaps: true, srgb: true, wrap: THREE.RepeatWrapping })
  runPass(baker, c, `void main(){ float v = fbm(vUv * 6.0 + 1.0, 4) * 0.5 + 0.5; gl_FragColor = vec4(vec3(0.004, 0.042, 0.027) + vec3(0.006, 0.026, 0.016) * v, 1.0); }`, {})
  return { map: c.texture, normalMap: n.texture }
}

export function bakeWood(baker: Baker): { map: THREE.Texture } {
  const c = makeRT(256, 1024, { mipmaps: true, srgb: true, wrap: THREE.RepeatWrapping })
  runPass(
    baker,
    c,
    `void main(){ float warp = fbm(vUv * vec2(3.0, 1.2), 3); float f = fbm(vec2(vUv.x * 18.0 + warp * 2.0, vUv.y * 2.0), 4) * 0.5 + 0.5;
      float rings = 0.5 + 0.5 * sin(vUv.x * 120.0 + f * 8.0);
      gl_FragColor = vec4(vec3(0.055, 0.024, 0.01) + vec3(0.035, 0.016, 0.006) * f + vec3(0.016, 0.007, 0.002) * rings, 1.0); }`,
    {},
  )
  return { map: c.texture }
}

// ------------------------------------------------------------------ gold repoussé frieze (tiles horizontally)
export function bakeFrieze(baker: Baker): { normalMap: THREE.Texture } {
  const w = 1024
  const h = 128
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  g.fillStyle = '#333'
  g.fillRect(0, 0, w, h)
  g.strokeStyle = '#fff'
  g.fillStyle = '#fff'
  g.lineCap = 'round'
  // beaded borders
  for (let x = 6; x < w; x += 14) {
    for (const y of [10, h - 10]) {
      g.beginPath()
      g.arc(x, y, 4.5, 0, Math.PI * 2)
      g.fill()
    }
  }
  // a running vine of lotus buds and leaves (period = w / 4 so it tiles)
  g.lineWidth = 7
  g.beginPath()
  for (let x = 0; x <= w; x += 4) {
    const y = h / 2 + Math.sin((x / w) * Math.PI * 8) * 22
    if (x === 0) g.moveTo(x, y)
    else g.lineTo(x, y)
  }
  g.stroke()
  for (let k = 0; k < 16; k++) {
    const x = (k + 0.5) * (w / 16)
    const y = h / 2 + Math.sin((x / w) * Math.PI * 8) * 22
    g.save()
    g.translate(x, y)
    g.rotate(k % 2 ? 0.6 : -0.6 + Math.PI)
    g.beginPath()
    g.moveTo(0, 0)
    g.quadraticCurveTo(12, -18, 0, -38)
    g.quadraticCurveTo(-12, -18, 0, 0)
    g.fill()
    g.restore()
  }
  const tex = canvasTex(c)
  const hb = blur(baker, tex, w, h, 2.2)
  const n = makeRT(w, h, { mipmaps: true, wrap: THREE.RepeatWrapping })
  runPass(baker, n, NORMAL_FROM_HEIGHT, { height: { value: hb.texture }, texel: { value: v2(1 / w, 1 / h) }, strength: { value: 5 } })
  tex.dispose()
  hb.dispose()
  return { normalMap: n.texture }
}

// ------------------------------------------------------------------ lawn grass (tiles)
export function bakeGrass(baker: Baker): { map: THREE.Texture } {
  const S = 512
  const c = makeRT(S, S, { mipmaps: true, srgb: true, wrap: THREE.RepeatWrapping })
  runPass(
    baker,
    c,
    `void main(){
      vec2 p = vUv;
      float pch = fbm(p * 3.0 + 2.0, 4) * 0.5 + 0.5;
      float blades = snoise(vec2(p.x * 260.0, p.y * 60.0)) * 0.5 + 0.5;
      float speck = snoise(p * 140.0) * 0.5 + 0.5;
      vec3 deep = vec3(0.045, 0.085, 0.022);
      vec3 lush = vec3(0.11, 0.17, 0.045);
      vec3 dry = vec3(0.2, 0.19, 0.07);
      vec3 col = mix(deep, lush, pch);
      col = mix(col, dry, smoothstep(0.75, 1.0, pch) * 0.35);
      col *= 0.82 + blades * 0.28 + speck * 0.06;
      gl_FragColor = vec4(col, 1.0);
    }`,
    {},
  )
  return { map: c.texture }
}
