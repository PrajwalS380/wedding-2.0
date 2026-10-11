// Frame rate, draw calls and triangles of the live 3D intro (dev server; uses the dev-only window.__gl hook).
// Usage: node tests/e2e/worldperf.mjs [query ...]   e.g. quality=medium nogarden
import { BASE, launch } from './lib.mjs'
const queries = process.argv.slice(2).filter((a) => !/^https?:/.test(a))
const browser = await launch()
for (const q of queries.length ? queries : ['']) {
  for (const [name, vp] of [['desktop-1366', { width: 1366, height: 768 }], ['phone-390', { width: 390, height: 844, dpr: 2 }]]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr || 1, isMobile: !!vp.dpr, hasTouch: !!vp.dpr })
    const p = await ctx.newPage()
    await p.goto(BASE + '/?intro' + (q ? '&' + q : ''), { waitUntil: 'networkidle' })
    await p.waitForFunction(() => document.querySelector('.intro')?.dataset.state === 'ready', null, { timeout: 30000 }).catch(() => {})
    await p.waitForTimeout(2500)
    const r = await p.evaluate(() => new Promise((res) => {
      const gl = window.__gl
      if (!gl) return res('no renderer')
      gl.info.autoReset = false
      gl.info.reset()
      let n = 0
      const t0 = performance.now()
      const f = () => {
        n++
        if (performance.now() - t0 < 2000) requestAnimationFrame(f)
        else {
          const out = { fps: Math.round(n / 2), calls: Math.round(gl.info.render.calls / n), tris: Math.round(gl.info.render.triangles / n), px: gl.domElement.width + 'x' + gl.domElement.height }
          gl.info.autoReset = true
          res(JSON.stringify(out))
        }
      }
      requestAnimationFrame(f)
      setTimeout(() => res('stalled'), 6000)
    }))
    console.log((q || 'auto').padEnd(18), name.padEnd(13), r)
    await ctx.close()
  }
}
await browser.close()
