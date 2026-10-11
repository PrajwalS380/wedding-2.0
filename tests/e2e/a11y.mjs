// axe-core accessibility audit of the intro and the main page at a phone and a desktop size.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { BASE, VIEWPORTS, launch, newContext, reporter } from './lib.mjs'

const require = createRequire(import.meta.url)
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
const lang = (process.argv.find((a) => a.startsWith('--lang=')) || '').slice(7)

const { ok, done } = reporter('A11Y')
const browser = await launch()

async function audit(page, label, include) {
  await page.addScriptTag({ content: axeSource })
  const r = await page.evaluate(
    async ([tags, inc]) => {
      const res = await window.axe.run(inc ? { include: [inc] } : document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] })
      return res.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, first: v.nodes[0]?.target.join(' '), msg: v.nodes[0]?.failureSummary?.slice(0, 160) }))
    },
    [TAGS, include],
  )
  ok(`${label}: no axe violations`, r.length === 0, r)
}

for (const vp of [VIEWPORTS[1], VIEWPORTS[3]]) {
  const ctx = await newContext(browser, vp, { reducedMotion: 'reduce' })
  if (lang) await ctx.addInitScript((l) => localStorage.setItem('w2:lang', l), lang)
  const page = await ctx.newPage()
  await page.goto(BASE + '/?intro', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await audit(page, `[${vp.name}] intro`, '[role="dialog"]')
  await page.goto(BASE + '/?nointro', { waitUntil: 'networkidle' })
  const total = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < total; y += vp.height * 0.7) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y)
    await page.waitForTimeout(80)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(400)
  await audit(page, `[${vp.name}] main page`)
  await ctx.close()
}

await browser.close()
done()
