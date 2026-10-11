// Shared helpers for the browser checks (playwright-core driving the installed Microsoft Edge).
import { chromium } from 'playwright-core'

export const BASE = (process.env.BASE_URL || process.argv.slice(2).find((a) => /^https?:\/\//.test(a)) || 'http://127.0.0.1:5174').replace(/\/$/, '')

export const VIEWPORTS = [
  { name: 'phone-360', width: 360, height: 800, mobile: true },
  { name: 'phone-390', width: 390, height: 844, mobile: true },
  { name: 'tablet-768', width: 768, height: 1024, mobile: true },
  { name: 'desktop-1366', width: 1366, height: 768, mobile: false },
  { name: 'desktop-1920', width: 1920, height: 1080, mobile: false },
]

export function launch() {
  return chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] })
}

export function newContext(browser, vp, extra = {}) {
  return browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.mobile ? 2 : 1,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    ...extra,
  })
}

/** Tiny reporter: ok(name, condition, detail) and a summary with a non-zero exit code on failure. */
export function reporter(title) {
  let pass = 0
  let fail = 0
  const ok = (name, cond, detail = '') => {
    if (cond) pass++
    else fail++
    console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`)
    return cond
  }
  const done = () => {
    console.log(`${title}: PASS ${pass} / FAIL ${fail}`)
    process.exitCode = fail ? 1 : 0
  }
  return { ok, done }
}

/** Collects page errors and console errors for a page. */
export function watchErrors(page) {
  const errors = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`)
  })
  page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`))
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`)
  })
  return errors
}

export const overflowX = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
