// Development screenshot of the live 3D intro scene (waits for the bake + first frames).
// Usage: node tests/e2e/worldshot.mjs [--only=phone-390,desktop-1366] [--out=dir] [--t=seconds-into-opening]
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { BASE, VIEWPORTS, launch, newContext } from './lib.mjs'
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `=${d}`).split('=').slice(1).join('=')
const OUT = path.resolve(arg('out', 'test-results/world'))
const only = arg('only', 'phone-390,desktop-1366').split(',')
const times = arg('t', '').split(',').filter(Boolean).map(Number)
mkdirSync(OUT, { recursive: true })
const browser = await launch()
for (const vp of VIEWPORTS.filter((v) => only.includes(v.name))) {
  const ctx = await newContext(browser, vp)
  const page = await ctx.newPage()
  const logs = []
  page.on('console', (m) => (m.type() === 'error' || m.text().includes('[world]')) && logs.push(m.text().slice(0, 200)))
  page.on('pageerror', (e) => logs.push('pageerror ' + e.message))
  await page.goto(BASE + '/?intro', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.querySelector('.intro')?.dataset.state === 'ready', null, { timeout: 30000 }).catch(() => logs.push('NOT READY'))
  await page.waitForTimeout(1800)
  await page.screenshot({ path: path.join(OUT, `${vp.name}.png`) })
  if (times.length) {
    await page.getByRole('button', { name: /tap to open/i }).click()
    await page.waitForFunction(() => !!window.__introTimeline, null, { timeout: 4000 })
    await page.evaluate(() => { window.__introTimeline.pause() })
    for (const t of times) {
      await page.evaluate((tt) => { const tl = window.__introTimeline; for (let s = tl.time(); s < tt; s += 0.05) tl.seek(s, false); tl.seek(tt, false) }, t)
      await page.waitForTimeout(350)
      await page.screenshot({ path: path.join(OUT, `${vp.name}-t${t.toFixed(1)}.png`) })
    }
  }
  console.log(vp.name, logs.join(' | '))
  await ctx.close()
}
await browser.close()
