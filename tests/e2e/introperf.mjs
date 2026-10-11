// Rendering guard for the intro: frames keep flowing at idle and the sequence always completes,
// at every viewport (incl. a landscape phone) and through the keyboard path (focus ring visible).
// Several Chromium compositor stalls were found while building the intro (preserve-3d + pseudo
// element, filter + focus outline, degenerate SVG gradients); this test keeps them from returning.
import { VIEWPORTS, BASE, launch, newContext, reporter } from './lib.mjs'

const { ok, done } = reporter('INTRO PERF')
const browser = await launch()
const fps = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        let n = 0
        const t0 = performance.now()
        const tick = () => {
          n++
          if (performance.now() - t0 < 1000) requestAnimationFrame(tick)
          else resolve(n)
        }
        requestAnimationFrame(tick)
        setTimeout(() => resolve(n), 2500) // a stalled compositor never calls back
      }),
  )

const sizes = [...VIEWPORTS, { name: 'phone-landscape-844', width: 844, height: 390, mobile: true }]
for (const vp of sizes) {
  const ctx = await newContext(browser, vp)
  const page = await ctx.newPage()
  await page.goto(BASE + '/?intro', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.querySelector('.intro')?.dataset.state === 'ready', null, { timeout: 10000 })
  await page.waitForTimeout(1200)
  // best of two readings: the very first second after start-up includes GPU / image-decode warm-up
  const idle = Math.max(await fps(page), await fps(page))
  ok(`[${vp.name}] idle intro keeps rendering (${idle} fps)`, idle >= 20)
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1600)
  const during = await fps(page)
  ok(`[${vp.name}] frames keep flowing during the opening (${during} fps)`, during >= 15)
  const t0 = Date.now()
  const gone = await page
    .getByRole('dialog')
    .waitFor({ state: 'detached', timeout: 8000 })
    .then(() => true, () => false)
  ok(`[${vp.name}] keyboard-activated sequence completes`, gone, `${Date.now() - t0 + 1600 + 1000} ms after Enter`)
  await ctx.close()
}
await browser.close()
done()
