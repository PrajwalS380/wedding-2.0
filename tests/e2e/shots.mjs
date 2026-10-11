// Screenshots for visual review: intro + every section at the five reference viewports.
// Usage: node tests/e2e/shots.mjs [baseUrl] [--out=dir] [--only=phone-390,desktop-1366] [--sections=home,venue] [--intro-only]
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { BASE, VIEWPORTS, launch, newContext } from './lib.mjs'

const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `=${d}`).split('=').slice(1).join('=')
const OUT = path.resolve(arg('out', 'test-results/shots'))
const only = arg('only', '').split(',').filter(Boolean)
const sections = arg('sections', 'home,invitation,calendar,compass,celebrations,venue,guest-services,rsvp,closing').split(',')
const introOnly = process.argv.includes('--intro-only')
const lang = arg('lang', '')
mkdirSync(OUT, { recursive: true })

const browser = await launch()
for (const vp of VIEWPORTS.filter((v) => !only.length || only.includes(v.name))) {
  const ctx = await newContext(browser, vp)
  if (lang) await ctx.addInitScript((l) => localStorage.setItem('w2:lang', l), lang)
  const page = await ctx.newPage()
  await page.goto(BASE + '/?intro', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(OUT, `${vp.name}-intro${lang ? '-' + lang : ''}.png`) })
  if (introOnly) {
    await ctx.close()
    continue
  }
  await page.goto(BASE + '/?nointro', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  for (const id of sections) {
    await page.evaluate((i) => {
      const el = document.getElementById(i)
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'instant' })
    }, id)
    await page.waitForTimeout(1400)
    await page.screenshot({ path: path.join(OUT, `${vp.name}-${id}${lang ? '-' + lang : ''}.png`) })
  }
  await ctx.close()
}
await browser.close()
console.log('shots written to', OUT)
