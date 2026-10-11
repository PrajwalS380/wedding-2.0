// Foundation smoke test: intro → main site, sections, navigation targets, facts, overflow, errors.
// Usage: node tests/e2e/smoke.mjs [baseUrl]   (default http://127.0.0.1:5174)
import { BASE, VIEWPORTS, launch, newContext, overflowX, reporter, watchErrors } from './lib.mjs'

const MAPS =
  'https://www.google.com/maps/search/?api=1&query=Bapuji+Samudhaya+Bhavan%2C+Shamanur+Road%2C+Siddaveerappa+Layout%2C+Shamanur%2C+Davangere%2C+Karnataka+577004'
const SECTIONS = ['home', 'invitation', 'calendar', 'compass', 'celebrations', 'venue', 'guest-services', 'rsvp', 'closing']

const { ok, done } = reporter('SMOKE')
const browser = await launch()

for (const vp of VIEWPORTS) {
  const ctx = await newContext(browser, vp)
  const page = await ctx.newPage()
  const errors = watchErrors(page)
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })

  const dialog = page.getByRole('dialog')
  ok(`[${vp.name}] intro shows on first visit`, await dialog.isVisible())
  const introText = (await dialog.innerText()).replace(/\s+/g, ' ')
  ok(`[${vp.name}] intro text is exact`, ['A ROYAL INVITATION', 'Darshan & Vathsala', '15 & 16 November 2026 · Davangere', 'TAP TO OPEN'].every((t) => introText.toUpperCase().includes(t.toUpperCase())), introText.slice(0, 120))
  ok(`[${vp.name}] intro: no horizontal overflow`, (await overflowX(page)) <= 0)
  ok(`[${vp.name}] main content is inert behind the intro`, await page.evaluate(() => !!document.querySelector('[inert] main')))

  await page.getByRole('button', { name: /skip intro/i }).click()
  await dialog.waitFor({ state: 'detached', timeout: 5000 })
  ok(`[${vp.name}] skip reveals the main website`, await page.locator('#home-title').isVisible())
  ok(`[${vp.name}] page is interactive after the intro`, await page.evaluate(() => !document.querySelector('[inert]') && !document.documentElement.classList.contains('is-locked')))

  const ids = await page.evaluate((list) => list.filter((id) => document.getElementById(id)), SECTIONS)
  ok(`[${vp.name}] all sections present`, ids.length === SECTIONS.length, ids.join(','))
  const h1 = await page.locator('h1').count()
  ok(`[${vp.name}] exactly one h1`, h1 === 1, String(h1))

  const badLinks = await page.evaluate(() =>
    [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href').slice(1)).filter((id) => id && !document.getElementById(id)),
  )
  ok(`[${vp.name}] every in-page link has a target`, badLinks.length === 0, badLinks.join(','))

  const maps = await page.evaluate(() => [...document.querySelectorAll('a[href*="google.com/maps"]')].map((a) => [a.href, a.target, a.rel]))
  ok(`[${vp.name}] directions use the exact Maps URL, safely`, maps.length > 0 && maps.every(([h, t, r]) => h === MAPS && t === '_blank' && /noopener/.test(r)), maps.length)

  // scroll the whole page for overflow and lazy content
  const total = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < total; y += vp.height * 0.8) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y)
    await page.waitForTimeout(60)
  }
  ok(`[${vp.name}] no horizontal overflow on the page`, (await overflowX(page)) <= 0)

  await page.reload({ waitUntil: 'networkidle' })
  ok(`[${vp.name}] reload in the same session goes straight to the site`, (await page.getByRole('dialog').count()) === 0 && (await page.locator('#home-title').isVisible()))
  ok(`[${vp.name}] no console / network errors`, errors.length === 0, errors.slice(0, 3).join(' | '))
  await ctx.close()
}

// Tap to open, keyboard and reduced motion (one phone context each)
{
  const ctx = await newContext(browser, VIEWPORTS[1], { reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'dialog', null, { timeout: 8000 })
  ok('keyboard: focus moves into the intro dialog', true)
  await page.keyboard.press('Tab')
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim())
  ok('keyboard: first Tab reaches "Tap to open"', /tap to open/i.test(focused || ''), focused)
  await page.keyboard.press('Enter')
  await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 5000 })
  ok('keyboard Enter opens the invitation (reduced motion)', await page.locator('#home-title').isVisible())
  ok('focus moves to the hero heading after opening', await page.waitForFunction(() => document.activeElement?.id === 'home-title', null, { timeout: 2000 }).then(() => true, () => false))
  await ctx.close()
}
{
  const ctx = await newContext(browser, VIEWPORTS[3])
  const page = await ctx.newPage()
  await page.goto(BASE + '/?intro', { waitUntil: 'networkidle' })
  const btn = page.getByRole('button', { name: /tap to open/i })
  await btn.click()
  await btn.click({ force: true, timeout: 1000 }).catch(() => {}) // a second click must not break anything
  await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 5000 })
  ok('tap to open reveals the site; repeated clicks are harmless', await page.locator('#home-title').isVisible())
  // RSVP: empty submission shows both errors, nothing opens
  let opened = 0
  await page.exposeFunction('__opened', () => opened++)
  await page.evaluate(() => (window.open = () => (window.__opened(), null)))
  await page.locator('#rsvp form button[type="submit"]').click()
  const errs = await page.locator('#rsvp [id$="-error"]').count()
  ok('RSVP: empty form shows validation, WhatsApp not opened', errs === 2 && opened === 0, { errs, opened })
  const tel = await page.locator('a[href^="tel:"]').first().getAttribute('href')
  ok('Need help: confirmed phone number', tel === 'tel:+919591420987', tel)
  await ctx.close()
}

// Blocked storage (private mode / disabled site data): never a blank screen
{
  const ctx = await newContext(browser, VIEWPORTS[0])
  await ctx.addInitScript(() => {
    for (const name of ['sessionStorage', 'localStorage']) {
      Object.defineProperty(window, name, { get() { throw new DOMException('blocked', 'SecurityError') } })
    }
  })
  const page = await ctx.newPage()
  const errors = watchErrors(page)
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  ok('storage blocked: intro still shows', await page.getByRole('dialog').isVisible())
  await page.getByRole('button', { name: /skip intro/i }).click()
  await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 5000 })
  ok('storage blocked: skip reveals the site, no errors', (await page.locator('#home-title').isVisible()) && errors.length === 0, errors.join(' | '))
  await ctx.close()
}

await browser.close()
done()

