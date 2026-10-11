// Frames of the opening sequence at fixed times (dev server only: seeks the exposed GSAP timeline).
// Usage: node tests/e2e/introframes.mjs [--only=phone-390] [--out=dir]
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { BASE, VIEWPORTS, launch, newContext } from './lib.mjs'
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `=${d}`).split('=').slice(1).join('=')
const OUT = path.resolve(arg('out', 'test-results/introframes'))
const only = arg('only', 'phone-390,desktop-1366').split(',')
const times = arg('times', '0.3,0.7,1.0,1.4,1.9,2.4,2.9,3.4,3.8').split(',').map(Number)
mkdirSync(OUT, { recursive: true })
const browser = await launch()
for (const vp of VIEWPORTS.filter((v) => only.includes(v.name))) {
  const ctx = await newContext(browser, vp)
  const page = await ctx.newPage()
  await page.goto(BASE + '/?intro', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.getByRole('button', { name: /tap to open/i }).click()
  await page.waitForFunction(() => !!window.__introTimeline, null, { timeout: 3000 })
  await page.evaluate(() => { window.__introTimeline.pause() })
  for (const t of times) {
    await page.evaluate((tt) => { window.__introTimeline.seek(tt, false) }, t)
    await page.waitForTimeout(250)
    await page.screenshot({ path: path.join(OUT, `${vp.name}-t${t.toFixed(1)}.png`) })
  }
  await ctx.close()
}
await browser.close()
console.log('frames written to', OUT)
