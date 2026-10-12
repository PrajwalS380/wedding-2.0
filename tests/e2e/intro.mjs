// Royal intro behaviour (live 3D scene): rendering, opening sequence, skip, repeated input, session,
// layout, reduced motion, keyboard, and the fallbacks for no WebGL / a lost GPU context.
// Needs the dev server (reads the dev-only hooks __introTimeline, __introWorld, __envelopeRect).
// Usage: node tests/e2e/intro.mjs [baseUrl]
import { BASE, VIEWPORTS, launch, newContext, overflowX, reporter, watchErrors } from './lib.mjs'

const { ok, done } = reporter('INTRO')
const browser = await launch()
const { PNG } = await import('pngjs')

const introGone = (page, timeout = 12000) =>
  page
    .getByRole('dialog')
    .waitFor({ state: 'detached', timeout })
    .then(() => true, () => false)

const pageUsable = (page) =>
  page.evaluate(() => !document.querySelector('[inert]') && !document.documentElement.classList.contains('is-locked') && window.scrollY === 0)

async function ready(page) {
  await page.waitForFunction(() => document.querySelector('.intro')?.dataset.state === 'ready', null, { timeout: 30000 })
  // the fade-in can stretch while shaders compile (GSAP lag smoothing): wait for the lettering itself
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.intro-text')).opacity === '1', null, { timeout: 15000 })
}

/** Luminance spread across the screen: a painted scene, not a blank or single-colour canvas. */
async function sceneSpread(page) {
  const png = PNG.sync.read(await page.screenshot())
  const vals = []
  for (let y = 4; y < png.height; y += 9)
    for (let x = 4; x < png.width; x += 9) {
      const i = (y * png.width + x) * 4
      vals.push(0.2126 * png.data[i] + 0.7152 * png.data[i + 1] + 0.0722 * png.data[i + 2])
    }
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length
  return Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length)
}

const atTime = (page, t) => page.waitForFunction((tt) => (window.__introTimeline?.time() ?? 0) >= tt, t, { timeout: 10000 }).catch(() => {})

for (const vp of VIEWPORTS) {
  const ctx = await newContext(browser, vp)
  const page = await ctx.newPage()
  const errors = watchErrors(page)
  const failed = []
  page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`))
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await ready(page)

  const scene = await page.evaluate(() => ({ canvas: !!document.querySelector('.intro-scene canvas'), flat: document.querySelector('.intro')?.classList.contains('intro--flat') }))
  ok(`[${vp.name}] the WebGL scene is live (no fallback)`, scene.canvas && !scene.flat, scene)
  const spread = await sceneSpread(page)
  ok(`[${vp.name}] the scene is painted (luminance spread ${spread.toFixed(0)})`, spread > 25)
  ok(`[${vp.name}] no failed requests`, failed.length === 0, failed.slice(0, 3))
  ok(`[${vp.name}] no horizontal overflow`, (await overflowX(page)) <= 0)

  // lettering must not overlap itself, the envelope, or the controls, and must stay on screen
  const boxes = await page.evaluate(() => {
    const r = (sel) => {
      const b = document.querySelector(sel)?.getBoundingClientRect()
      return b && { l: b.left, r: b.right, t: b.top, b: b.bottom }
    }
    return {
      vw: innerWidth,
      vh: innerHeight,
      title: r('.intro-title p'),
      names: r('#intro-names'),
      date: r('#intro-date'),
      button: r('.intro-open'),
      skip: r('.intro-skip'),
      envelope: window.__envelopeRect?.() ?? null,
    }
  })
  const overlap = (a, b, tol = 2) => a && b && a.l < b.r - tol && b.l < a.r - tol && a.t < b.b - tol && b.t < a.b - tol
  const inView = (a) => a && a.l >= 0 && a.r <= boxes.vw && a.t >= 0 && a.b <= boxes.vh
  ok(`[${vp.name}] title, names, date, button and skip are fully on screen`, ['title', 'names', 'date', 'button', 'skip'].every((k) => inView(boxes[k])), boxes)
  ok(`[${vp.name}] the envelope is on screen`, !!boxes.envelope && boxes.envelope.t >= 0 && boxes.envelope.b <= boxes.vh && boxes.envelope.l >= -2 && boxes.envelope.r <= boxes.vw + 2, boxes.envelope)
  ok(
    `[${vp.name}] no overlaps between title / names / date / button / envelope / skip`,
    ['title', 'names', 'date', 'button'].every((k) => !overlap(boxes[k], boxes.envelope)) &&
      !overlap(boxes.names, boxes.date) &&
      !overlap(boxes.date, boxes.button) &&
      !overlap(boxes.skip, boxes.title),
    boxes,
  )
  const sizes = await page.evaluate(() => ['#intro-names', '#intro-date', '.intro-open .label', '.intro-title p', '.intro-skip'].map((s) => parseFloat(getComputedStyle(document.querySelector(s)).fontSize)))
  ok(`[${vp.name}] readable text sizes (names ≥ 28px, others ≥ 11px)`, sizes[0] >= 28 && sizes.slice(1).every((s) => s >= 11), sizes)

  // the opening sequence, read at fixed points of its own timeline (not wall-clock)
  await page.getByRole('button', { name: /tap to open/i }).click()
  await atTime(page, 1.5)
  const mid = await page.evaluate(() => {
    const w = window.__introWorld
    return { state: document.querySelector('.intro')?.dataset.state, flap: w?.envelope?.flap.rotation.x, text: getComputedStyle(document.querySelector('.intro-text')).opacity }
  })
  ok(`[${vp.name}] tap opens the envelope (flap over its hinge, lettering faded)`, mid.state === 'opening' && mid.flap < -1.5 && Number(mid.text) < 0.05, mid)
  await atTime(page, 3.5)
  const later = await page.evaluate(() => {
    const w = window.__introWorld
    return { doorL: w?.doorL?.rotation.y, doorR: w?.doorR?.rotation.y, travel: w?.rig.travel }
  })
  ok(`[${vp.name}] the doors swing wide and the camera walks through`, later.doorL > 1.3 && later.doorR < -1.3 && later.travel > 0.3, later)
  ok(`[${vp.name}] sequence completes into the real website`, await introGone(page))
  ok(`[${vp.name}] hero visible, page usable, scrolled to top`, (await page.locator('#home-title').isVisible()) && (await pageUsable(page)))
  ok(`[${vp.name}] the WebGL scene is released (its canvas leaves the page)`, await page.evaluate(() => !!window.__gl && !window.__gl.domElement.isConnected && !document.querySelector('.intro-scene')))
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
  const state = await page.evaluate(() => ({ s: document.querySelector('.intro')?.dataset.state, t: window.__introTimeline?.time() }))
  ok('repeated taps start exactly one sequence', state.s === 'opening', state)
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
  await page.waitForFunction(() => document.querySelector('.intro')?.dataset.state === 'ready', null, { timeout: 30000 })
  await page.waitForTimeout(400)
  const t0 = Date.now()
  await page.getByRole('button', { name: /tap to open/i }).click()
  await page.waitForTimeout(250)
  const w = await page.evaluate(() => ({ travel: window.__introWorld?.rig.travel, door: window.__introWorld?.doorL?.rotation.y, flap: window.__introWorld?.envelope?.flap.rotation.x }))
  ok('reduced motion: no camera travel or door swing; the envelope shown open at once', w.travel === 0 && w.door < 1.0 && w.flap < -2.5, w)
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

// no WebGL at all: the painted fallback, never a blank screen
{
  const ctx = await newContext(browser, VIEWPORTS[1])
  await ctx.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      return /webgl/i.test(type) ? null : get.call(this, type, ...rest)
    }
  })
  const page = await ctx.newPage()
  const errors = watchErrors(page)
  await page.goto(BASE + '/?intro', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.querySelector('.intro')?.dataset.state === 'ready', null, { timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(1300)
  const v = await page.evaluate(() => ({
    flat: document.querySelector('.intro')?.classList.contains('intro--flat'),
    text: getComputedStyle(document.querySelector('.intro-text')).opacity,
    names: !!document.querySelector('#intro-names')?.offsetHeight,
  }))
  ok('no WebGL: painted fallback with the invitation text and button', v.flat && v.text === '1' && v.names, v)
  await page.getByRole('button', { name: /tap to open/i }).click()
  ok('no WebGL: opening still reaches the site', await introGone(page, 3000))
  ok('no WebGL: no errors', errors.length === 0, errors)
  await ctx.close()
}

// the GPU context is lost while the invitation is showing
{
  const ctx = await newContext(browser, VIEWPORTS[1])
  const page = await ctx.newPage()
  await page.goto(BASE + '/?intro', { waitUntil: 'networkidle' })
  await ready(page)
  await page.evaluate(() => window.__gl.getContext().getExtension('WEBGL_lose_context')?.loseContext())
  await page.waitForTimeout(600)
  const v = await page.evaluate(() => ({
    flat: document.querySelector('.intro')?.classList.contains('intro--flat'),
    canvas: document.querySelectorAll('.intro-scene canvas').length,
    names: !!document.querySelector('#intro-names')?.offsetHeight,
  }))
  ok('context lost: falls back to the painted intro, text intact', v.flat && v.canvas === 0 && v.names, v)
  await page.getByRole('button', { name: /tap to open/i }).click()
  ok('context lost: opening still reaches the site', await introGone(page, 3000))
  await ctx.close()
}

await browser.close()
done()
