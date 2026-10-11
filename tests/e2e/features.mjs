// Phase 5 & 6 features: languages, music, RSVP → WhatsApp, calendar file, sharing.
// Usage: node tests/e2e/features.mjs [baseUrl]
import { readFileSync } from 'node:fs'
import { BASE, VIEWPORTS, launch, newContext, overflowX, reporter, watchErrors } from './lib.mjs'

const { ok, done } = reporter('FEATURES')
const browser = await launch()

// ---------------------------------------------------------------- languages
{
  const ctx = await newContext(browser, VIEWPORTS[1])
  const page = await ctx.newPage()
  const errors = watchErrors(page)
  await page.goto(BASE + '/?nointro', { waitUntil: 'networkidle' })
  ok('English for a first-time visitor', (await page.evaluate(() => document.documentElement.lang)) === 'en')

  // type into the RSVP, scroll there, then switch language
  await page.locator('#rsvp-name').fill('Asha Rao')
  await page.locator('#rsvp form label', { hasText: /joyfully accepts/i }).click()
  await page.locator('#rsvp-name').scrollIntoViewIfNeeded()
  const y0 = await page.evaluate(() => document.querySelector('#rsvp-name').getBoundingClientRect().top)
  await page.getByRole('group', { name: /choose a language/i }).first().getByRole('button', { name: 'ಕನ್ನಡ' }).click()
  await page.waitForTimeout(400)
  const kn = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    title: document.title,
    rsvpTitle: document.querySelector('#rsvp-title')?.textContent,
    name: document.querySelector('#rsvp-name')?.value,
    checked: document.querySelector('#rsvp-accept')?.checked,
    venue: document.querySelector('.venue__name')?.textContent,
    y: document.querySelector('#rsvp-name').getBoundingClientRect().top,
  }))
  ok('Kannada: page language, title and headings switch', kn.lang === 'kn' && /ದರ್ಶನ್/.test(kn.title) && kn.rsvpTitle === 'ದಯವಿಟ್ಟು ನಮಗೆ ತಿಳಿಸಿ', kn)
  ok('Kannada: the venue keeps its confirmed name (in Kannada script)', kn.venue === 'ಬಾಪೂಜಿ ಸಮುದಾಯ ಭವನ', kn.venue)
  ok("switching keeps RSVP input, the choice and the visitor's place on the page", kn.name === 'Asha Rao' && kn.checked === true && Math.abs(kn.y - y0) < 40, { y0, y: kn.y })

  // no English left in visible text (beyond the Latin design lettering and the address/number)
  const english = await page.evaluate(() => {
    const allow = /^(Darshan|Vathsala|D|V|&|D&V|R · S · V · P|EN|IST|Send|WhatsApp|\+91 95914 20987|[\d\s.,·:&–—-]+)$/
    const out = new Set()
    const tw = document.createTreeWalker(document.querySelector('#main'), NodeFilter.SHOW_TEXT)
    while (tw.nextNode()) {
      const s = tw.currentNode.textContent.trim()
      const el = tw.currentNode.parentElement
      if (!s || !el || el.closest('[aria-hidden="true"], .sr-only, svg, script, style')) continue
      if (/[A-Za-z]{3,}/.test(s) && !allow.test(s) && !/[ಀ-೿]/.test(s)) out.add(s)
    }
    return [...out]
  })
  ok('Kannada: no untranslated English text on the page', english.length === 0, english.slice(0, 8))

  await page.getByRole('group', { name: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ' }).first().getByRole('button', { name: 'हिन्दी' }).click()
  await page.waitForTimeout(300)
  ok('Hindi: switches in place', (await page.evaluate(() => document.documentElement.lang)) === 'hi' && (await page.locator('#rsvp-title').textContent()) === 'कृपया हमें बताएँ')
  ok('Hindi: no horizontal overflow', (await overflowX(page)) <= 0)
  await page.reload({ waitUntil: 'networkidle' })
  ok('the chosen language is restored after a reload', (await page.evaluate(() => document.documentElement.lang)) === 'hi')
  ok('no errors while switching languages', errors.length === 0, errors.slice(0, 3))
  await ctx.close()
}

// ---------------------------------------------------------------- RSVP → WhatsApp (Kannada)
{
  const ctx = await newContext(browser, VIEWPORTS[3])
  await ctx.addInitScript(() => localStorage.setItem('w2:lang', 'kn'))
  const page = await ctx.newPage()
  await page.goto(BASE + '/?nointro', { waitUntil: 'networkidle' })
  const opened = []
  await page.exposeFunction('__opened', (u) => opened.push(u))
  await page.evaluate(() => (window.open = (u) => (window.__opened(u), null)))
  const form = page.locator('#rsvp form')
  await form.locator('button[type="submit"]').click()
  const errs = await form.locator('[id$="-error"]').allTextContents()
  ok('RSVP: empty form shows translated errors, focus on the name, WhatsApp not opened', errs.length === 2 && errs.every((e) => /[ಀ-೿]/.test(e)) && opened.length === 0 && (await page.evaluate(() => document.activeElement?.id)) === 'rsvp-name', errs)
  await page.locator('#rsvp-name').fill('  ಆಶಾ  ')
  await form.locator('label.rsvp__choice').first().click()
  await page.locator('#rsvp-guests').fill('25')
  await form.locator('button[type="submit"]').click()
  ok('RSVP: an impossible guest count is explained, nothing opens', (await page.locator('#rsvp-guests-error').count()) === 1 && opened.length === 0 && (await page.locator('#rsvp-guests').inputValue()) === '25')
  await page.locator('#rsvp-guests').fill('3')
  await page.locator('#rsvp-note').fill('ಶುಭಾಶಯಗಳು!')
  await form.locator('button[type="submit"]').click()
  const url = opened[0] || ''
  const text = decodeURIComponent(url.split('?text=')[1] || '')
  ok('RSVP: WhatsApp opens for the confirmed number', url.startsWith('https://wa.me/919591420987?text='), url.slice(0, 60))
  ok('RSVP: the message is in Kannada, with name, answer, count and note', text.includes('ನಾನು ಆಶಾ.') && text.includes('ಸಂತೋಷದಿಂದ ಭಾಗವಹಿಸುತ್ತೇನೆ') && text.includes('ಬರುವವರ ಸಂಖ್ಯೆ: 3') && text.includes('ಶುಭಾಶಯಗಳು!'), text)
  const ready = await page.locator('.rsvp__ready').innerText()
  ok('RSVP: a ready state with a fallback link, never "received"', /ಸಿದ್ಧ/.test(ready) && (await page.locator('.rsvp__ready a[href^="https://wa.me/919591420987"]').count()) === 1)
  await ctx.close()
}

// ---------------------------------------------------------------- calendar file and sharing
{
  const ctx = await newContext(browser, VIEWPORTS[3], { permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await ctx.newPage()
  await page.goto(BASE + '/?nointro', { waitUntil: 'networkidle' })
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#venue').getByRole('button', { name: /add to calendar/i }).click()])
  const ics = readFileSync(await download.path(), 'utf8')
  ok('calendar: a .ics file named for the wedding', download.suggestedFilename() === 'darshan-vathsala-wedding.ics')
  ok('calendar: all-day 15–16 November (exclusive end 17), CRLF', ics.includes('DTSTART;VALUE=DATE:20261115\r\n') && ics.includes('DTEND;VALUE=DATE:20261117\r\n') && !/[^\r]\n/.test(ics))
  ok('calendar: confirmation shown', /calendar file/i.test(await page.locator('.toast').innerText()))
  await page.evaluate(() => { Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }) })
  await page.locator('#closing').getByRole('button', { name: /share invitation/i }).click()
  await page.waitForTimeout(300)
  const clip = await page.evaluate(() => navigator.clipboard.readText())
  ok('share: without a share sheet the link is copied, then confirmed', clip.startsWith(BASE) && /copied/i.test(await page.locator('.toast').innerText()), clip)
  await ctx.close()
}

// ---------------------------------------------------------------- music: on by default, after a gesture
{
  const ctx = await newContext(browser, VIEWPORTS[1])
  const page = await ctx.newPage()
  const errors = watchErrors(page)
  await page.goto(BASE + '/?nointro', { waitUntil: 'networkidle' })
  const btn = page.locator('.music-btn')
  ok('music: waits for a gesture (no autoplay on load)', (await btn.getAttribute('aria-pressed')) === 'false')
  await page.mouse.click(5, 400)
  const started = await page.waitForFunction(() => document.querySelector('.music-btn')?.getAttribute('aria-pressed') === 'true', null, { timeout: 6000 }).then(() => true, () => false)
  ok('music: starts with the first tap (on by default)', started)
  await btn.click()
  await page.waitForTimeout(900)
  ok('music: pauses on request, with a translated label', (await btn.getAttribute('aria-pressed')) === 'false' && /play music/i.test(await btn.getAttribute('aria-label')))
  await page.reload({ waitUntil: 'networkidle' })
  await page.mouse.click(5, 400)
  await page.waitForTimeout(1200)
  ok('music: stays off after the visitor turned it off', (await page.locator('.music-btn').getAttribute('aria-pressed')) === 'false')
  ok('music: no errors', errors.length === 0, errors.slice(0, 3))
  await ctx.close()
}

await browser.close()
done()
