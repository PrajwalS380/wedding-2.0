// Royal intro behaviour: assets, opening sequence, skip, repeated input, session, layout, motion, keyboard, failures.
// Usage: node tests/e2e/intro.mjs [baseUrl]
import { BASE, VIEWPORTS, launch, newContext, overflowX, reporter, watchErrors } from './lib.mjs'

const { ok, done } = reporter('INTRO')
const browser = await launch()

const introGone = (page, timeout = 9000) =>
  page
    .getByRole('dialog')
    .waitFor({ state: 'detached', timeout })
    .then(() => true, () => false)

const pageUsable = (page) =>
  page.evaluate(() => !document.querySelector('[inert]') && !document.documentElement.classList.contains('is-locked') && window.scrollY === 0)

async function ready(page) {
  await page.waitForFunction(() => document.querySelector('.intro')?.dataset.state === 'ready', null, { timeout: 10000 })
  await page.waitForTimeout(950) // fade-in
}

for (const vp of VIEWPORTS) {
  const ctx = await newContext(browser, vp)
  const page = await ctx.newPage()
  const errors = watchErrors(page)
  const introAssets = []
  page.on('response', (r) => r.url().includes('/intro/') && introAssets.push([r.url().split('/').pop(), r.status()]))
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await ready(page)

  ok(`[${vp.name}] intro assets load (no missing files)`, introAssets.length >= 10 && introAssets.every(([, s]) => s === 200 || s === 304), introAssets.filter(([, s]) => s >= 400))
  ok(`[${vp.name}] no horizontal overflow`, (await overflowX(page)) <= 0)

  // text must not overlap itself, the envelope, or the button, and must stay on screen
  const boxes = await page.evaluate(() => {
    const r = (sel) => {
      const b = document.querySelector(sel)?.getBoundingClientRect()
      return b && { l: b.left, r: b.right, t: b.top, b: b.bottom }
    }
    // the envelope's visible body: pocket image box minus the pedestal (lower ~28%)
    const pocket = r('img[src*="envelope-pocket"]')
    return {
      vw: innerWidth,
      vh: innerHeight,
      title: r('.intro-title p'),
      names: r('#intro-names'),
      date: r('#intro-date'),
      button: r('.intro-open'),
      skip: r('.intro-skip'),
      envelope: pocket && { ...pocket, b: pocket.t + (pocket.b - pocket.t) * 0.72 },
    }
  })
  const overlap = (a, b, tol = 2) => a && b && a.l < b.r - tol && b.l < a.r - tol && a.t < b.b - tol && b.t < a.b - tol
  const inView = (a) => a && a.l >= 0 && a.r <= boxes.vw && a.t >= 0 && a.b <= boxes.vh
  ok(`[${vp.name}] title, names, date, button and skip are fully on screen`, ['title', 'names', 'date', 'button', 'skip'].every((k) => inView(boxes[k])), boxes)
  ok(
    `[${vp.name}] no overlaps between names / date / button / envelope / skip`,
    !overlap(boxes.names, boxes.date) && !overlap(boxes.date, boxes.button) && !overlap(boxes.names, boxes.envelope) && !overlap(boxes.skip, boxes.title),
  )
  const sizes = await page.evaluate(() => ['#intro-names', '#intro-date', '.intro-open .label', '.intro-title p', '.intro-skip'].map((s) => parseFloat(getComputedStyle(document.querySelector(s)).fontSize)))
  ok(`[${vp.name}] readable text sizes (names ≥ 28px, others ≥ 11px)`, sizes[0] >= 28 && sizes.slice(1).every((s) => s >= 11), sizes)

  // the opening sequence
  await page.getByRole('button', { name: /tap to open/i }).click()
  // read the sequence at fixed points of its own timeline (dev builds expose it), not wall-clock
  const atTime = (t) => page.waitForFunction((tt) => (window.__introTimeline?.time() ?? 0) >= tt, t, { timeout: 8000 }).catch(() => {})
  await atTime(1.5)
  const mid = await page.evaluate(() => ({
    state: document.querySelector('.intro')?.dataset.state,
    flap: getComputedStyle(document.querySelector('.intro-flap')).transform,
    card: getComputedStyle(document.querySelector('.intro-card')).transform,
  }))
  ok(`[${vp.name}] tap opens the envelope: flap lifts, card rises`, mid.state === 'opening' && mid.flap.startsWith('matrix3d') && mid.card !== 'none', mid)
  await atTime(2.3)
  const doors = await page.evaluate(() => [...document.querySelectorAll('.intro-door')].map((d) => getComputedStyle(d).transform))
  ok(`[${vp.name}] the palace doors swing open`, doors.length === 2 && doors.every((t) => t.startsWith('matrix3d')), doors.map((t) => t.slice(0, 30)))
  ok(`[${vp.name}] sequence completes into the real website`, await introGone(page))
  ok(`[${vp.name}] hero visible, page usable, scrolled to top`, (await page.locator('#home-title').isVisible()) && (await pageUsable(page)))
  ok(`[${vp.name}] no console / network errors`, errors.length === 0, errors.slice(0, 3))

  // skip from the idle state
  await page.goto(BASE + '/?intro', { waitUntil: 'networkidle' })
  await ready(page)
  const t0 = Date.now()
  await page.getByRole('button', { name: /skip intro/i }).click()
  ok(`[${vp.name}] skip reveals the site immediately`, (await introGone(page, 2000)) && Date.now() - t0 < 2000, `${Date.now() - t0} ms`)
  await ctx.close()
}

// skip in the middle of the sequence, and repeated input
{
  const ctx = await newContext(browser, VIEWPORTS[1])
  const page = await ctx.newPage()
  const errors = watchErrors(page)
  await page.goto(BASE + '/?intro', { waitUntil: 'networkidle' })
  await ready(page)
  await page.getByRole('button', { name: /tap to open/i }).click()
  await page.waitForTimeout(1200)
  const t0 = Date.now()
  await page.getByRole('button', { name: /skip intro/i }).click()
  ok('skip mid-sequence finishes at once', (await introGone(page, 2000)) && (await pageUsable(page)), `${Date.now() - t0} ms`)

  await page.goto(BASE + '/?intro', { waitUntil: 'networkidle' })
  await ready(page)
  const btn = page.getByRole('button', { name: /tap to open/i })
  for (let i = 0; i < 5; i++) await btn.click({ force: true, timeout: 1000 }).catch(() => {})
  await page.mouse.click(195, 500).catch(() => {}) // the envelope itself
  const state = await page.evaluate(() => document.querySelector('.intro')?.dataset.state)
  ok('repeated taps start exactly one sequence', state === 'opening', state)
  ok('…which still completes cleanly', (await introGone(page)) && (await pageUsable(page)))
  await page.getByRole('button', { name: /skip intro/i }).click({ timeout: 500 }).catch(() => {})
  ok('no errors from repeated / late input', errors.length === 0, errors)
  await ctx.close()
}

// session behaviour
{
  const ctx = await newContext(browser, VIEWPORTS[3])
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await ready(page)
  await page.getByRole('button', { name: /skip intro/i }).click()
  await introGone(page)
  await page.reload({ waitUntil: 'networkidle' })
  ok('session: a refresh after skipping goes straight to the site', (await page.getByRole('dialog').count()) === 0 && (await page.locator('#home-title').isVisible()))
  await page.goto(BASE + '/#venue', { waitUntil: 'networkidle' })
  ok('session: section links work normally', (await page.getByRole('dialog').count()) === 0)
  const fresh = await newContext(browser, VIEWPORTS[3])
  const p2 = await fresh.newPage()
  await p2.goto(BASE + '/', { waitUntil: 'networkidle' })
  ok('a new browsing session sees the intro again', await p2.getByRole('dialog').isVisible())
  await fresh.close()
  await ctx.close()
}

// reduced motion
{
  const ctx = await newContext(browser, VIEWPORTS[0], { reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(BASE + '/?intro', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.querySelector('.intro')?.dataset.state === 'ready', null, { timeout: 10000 })
  await page.waitForTimeout(300)
  const t0 = Date.now()
  await page.getByRole('button', { name: /tap to open/i }).click()
  await page.waitForTimeout(250)
  const cam = await page.evaluate(() => getComputedStyle(document.querySelector('.intro-camera')).transform)
  ok('reduced motion: no camera movement', cam === 'none' || cam === 'matrix(1, 0, 0, 1, 0, 0)', cam)
  ok('reduced motion: short transition to the site', (await introGone(page, 2500)) && Date.now() - t0 < 2500, `${Date.now() - t0} ms`)
  const anim = await page.evaluate(() => getComputedStyle(document.querySelector('#home-title')).opacity)
  ok('reduced motion: hero shown', anim === '1')
  await ctx.close()
}

// keyboard
{
  const ctx = await newContext(browser, VIEWPORTS[4])
  const page = await ctx.newPage()
  await page.goto(BASE + '/?intro', { waitUntil: 'networkidle' })
  await ready(page)
  ok('keyboard: focus starts inside the dialog', await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')))
  await page.keyboard.press('Tab')
  const first = await page.evaluate(() => document.activeElement?.textContent?.trim())
  await page.keyboard.press('Tab')
  const second = await page.evaluate(() => document.activeElement?.textContent?.trim())
  ok('keyboard: Tab reaches "Tap to open" then "Skip intro"', /tap to open/i.test(first) && /skip intro/i.test(second), [first, second])
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle)
  ok('keyboard: visible focus ring', ring !== 'none', ring)
  await page.keyboard.press('Escape')
  ok('keyboard: Escape skips the intro', await introGone(page, 2000))
  await page.goto(BASE + '/?intro', { waitUntil: 'networkidle' })
  await ready(page)
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  ok('keyboard: Enter on "Tap to open" plays the sequence', await introGone(page))
  await ctx.close()
}

// asset failure: never a blank screen
{
  const ctx = await newContext(browser, VIEWPORTS[1])
  await ctx.route(/\/intro\/(backdrop|door-left)/, (r) => r.fulfill({ status: 404, body: '' }))
  const page = await ctx.newPage()
  await page.goto(BASE + '/?intro', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.querySelector('.intro')?.dataset.state === 'ready', null, { timeout: 10000 })
  await page.waitForTimeout(1000)
  const visible = await page.evaluate(() => {
    const s = document.querySelector('.intro-stage')
    return { stage: getComputedStyle(s).opacity, names: !!document.querySelector('#intro-names')?.offsetHeight }
  })
  ok('missing images: invitation text and button still shown', visible.stage === '1' && visible.names, visible)
  await page.getByRole('button', { name: /tap to open/i }).click()
  ok('missing images: opening still reaches the site', await introGone(page, 3000))
  await ctx.close()
}

await browser.close()
done()
