// Pixel contrast of the intro's text against the live scene behind it (WCAG ratios).
import { mkdirSync } from 'node:fs'
import { BASE, VIEWPORTS, launch, newContext, reporter } from './lib.mjs'
const { ok, done } = reporter('INTRO CONTRAST')
mkdirSync('test-results', { recursive: true })
const lum = ([r, g, b]) => {
  const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
const browser = await launch()
for (const vp of VIEWPORTS) {
  const ctx = await newContext(browser, { ...vp, mobile: false })
  const page = await ctx.newPage()
  await page.goto(BASE + '/?intro', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.querySelector('.intro')?.dataset.state === 'ready', null, { timeout: 30000 })
  // the fade-in can stretch while shaders compile (GSAP lag smoothing): wait for the lettering itself
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.intro-text')).opacity === '1', null, { timeout: 15000 })
  await page.waitForTimeout(300)
  const items = await page.evaluate(() =>
    [
      ['skip', '.intro-skip', true],
      ['title', '.intro-title p', false],
      ['names', '#intro-names', false],
      ['date', '#intro-date', false],
      ['button', '.intro-open .label', true],
    ].map(([name, sel, ownBg]) => {
      const el = document.querySelector(sel)
      // tight boxes around the visible glyphs (text-node ranges), not the whole element
      const rects = []
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      while (tw.nextNode()) {
        const n = tw.currentNode
        if (!n.textContent.trim() || n.parentElement.closest('.sr-only')) continue
        const range = document.createRange()
        range.selectNodeContents(n)
        for (const r of range.getClientRects()) rects.push([r.left, r.top + r.height * 0.18, r.width, r.height * 0.64])
      }
      const c = getComputedStyle(el).color.match(/\d+(\.\d+)?/g).map(Number)
      return { name, sel, ownBg, rects, color: c.slice(0, 3), size: parseFloat(getComputedStyle(el).fontSize) }
    }),
  )
  // hide text, keep each control's own background, and screenshot what lies behind the letters
  await page.addStyleTag({ content: '.intro-text *, .intro-skip { color: transparent !important; text-shadow: none !important }' })
  await page.waitForTimeout(200)
  const shot = await page.screenshot()
  const { PNG } = await import('pngjs').catch(() => ({ PNG: null }))
  let png = null
  if (PNG) png = PNG.sync.read(shot)
  for (const it of items) {
    if (!png) break
    const samples = []
    for (const box of it.rects) {
      const [x, y, w, h] = box.map(Math.round)
      for (let yy = y; yy < y + h; yy += 1)
        for (let xx = x; xx < x + w; xx += 1) {
          if (xx < 0 || yy < 0 || xx >= png.width || yy >= png.height) continue
          const i = (yy * png.width + xx) * 4
          samples.push(ratio(it.color, [png.data[i], png.data[i + 1], png.data[i + 2]]))
        }
    }
    samples.sort((a, b) => a - b)
    const p5 = samples[Math.floor(samples.length * 0.05)]
    const min = samples[0]
    // large text (>= 24px, or >= 18.66px bold) needs 3:1, other text 4.5:1 — measured without the text-shadow halos
    const need = it.size >= 24 ? 3 : 4.5
    ok(`[${vp.name}] ${it.name} ${it.size.toFixed(0)}px: 5th-percentile ${p5.toFixed(2)}:1, min ${min.toFixed(2)} (needs ${need})`, p5 >= need)
  }
  await ctx.close()
}
await browser.close()
done()
