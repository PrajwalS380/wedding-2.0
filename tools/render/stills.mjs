// Renders stills of the palace world (src/three/studio) and writes optimised WebP files to public/site/.
// Needs the dev server (port 5174) and Python 3 with Pillow.
// Usage: node tools/render/stills.mjs [--only=garden-wide,lotus] [--base=http://127.0.0.1:5174]
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch } from '../../tests/e2e/lib.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `=${d}`).split('=').slice(1).join('=')
const BASE = arg('base', 'http://127.0.0.1:5174')
const only = arg('only', '').split(',').filter(Boolean)
const RAW = path.join(root, 'tools/out/stills')
const OUT = path.join(root, 'public/site')
mkdirSync(RAW, { recursive: true })
mkdirSync(OUT, { recursive: true })

const probeBrowser = await launch()
const probe = await probeBrowser.newPage()
await probe.goto(`${BASE}/studio.html`)
const shots = await probe.evaluate(() => window.__shots)
await probeBrowser.close()

for (const [name, s] of Object.entries(shots)) {
  if (only.length && !only.includes(name)) continue
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await render(name, s)
      break
    } catch (e) {
      console.log(`${name}: attempt ${attempt} failed (${String(e.message || e).split(/\r?\n/)[0]})`)
      if (attempt === 3) throw e
    }
  }
}

async function render(name, s) {
  // a fresh browser per shot: several large renders in one GPU process can exhaust it
  const browser = await launch()
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  let crashed = false
  page.on('crash', () => (crashed = true))
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  const t0 = Date.now()
  await page.goto(`${BASE}/studio.html?shot=${name}`)
  await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 120000 })
  const raw = path.join(RAW, `${name}@2x.png`)
  await page.waitForTimeout(300)
  if (crashed) {
    await browser.close()
    throw new Error('the page crashed while rendering')
  }
  await page.screenshot({ path: raw, omitBackground: !!s.transparent })
  if (crashed) {
    await browser.close()
    throw new Error('the page crashed while rendering')
  }
  // free the GPU before the (memory-hungry) downsample
  await browser.close()
  const out = path.join(OUT, `${name}.webp`)
  const finish = () => execFileSync('python', [path.join(here, 'finish.py'), raw, out, String(s.w), String(s.h), s.transparent ? 'alpha' : 'opaque'], { stdio: 'inherit' })
  try {
    finish()
  } catch {
    finish() // one retry: a transient memory spike while the browser releases the page
  }
  console.log(`${name}: ${s.w}×${s.h} in ${Date.now() - t0} ms${errors.length ? ' — ' + errors.slice(0, 2).join(' | ') : ''}`)
}
