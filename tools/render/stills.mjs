// Renders stills of the palace world (src/three/studio) and writes optimised WebP files to public/site/.
// Needs the dev server (port 5174) and Python 3 with Pillow.
// Usage: node tools/render/stills.mjs [--only=garden-wide,lotus] [--base=http://127.0.0.1:5174] [--dsf=1.5] [--lite]
import { execFileSync } from 'node:child_process'
import { mkdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { launch } from '../../tests/e2e/lib.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `=${d}`).split('=').slice(1).join('=')
const BASE = arg('base', 'http://127.0.0.1:5174')
const only = arg('only', '').split(',').filter(Boolean)
// --dsf=1.5 and --lite force the supersampling and the lighter GPU mode from the first attempt
const forceDsf = Number(arg('dsf', '0'))
const forceLite = process.argv.includes('--lite')
const RAW = path.join(root, 'tools/out/stills')
const OUT = path.join(root, 'public/site')
mkdirSync(RAW, { recursive: true })
mkdirSync(OUT, { recursive: true })

const probeBrowser = await launch()
const probe = await probeBrowser.newPage()
await probe.goto(`${BASE}/studio.html`)
const shots = await probe.evaluate(() => window.__shots)
await probeBrowser.close()

const failed = []
for (const [name, s] of Object.entries(shots)) {
  if (only.length && !only.includes(name)) continue
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      // 2x supersampling; then lighter GPU memory (half-res AO, 2048 shadows); then 1.5x
      await render(name, s, forceDsf || (attempt <= 4 ? 2 : 1.5), forceLite || attempt >= 3)
      break
    } catch (e) {
      console.log(`${name}: attempt ${attempt} failed (${String(e.message || e).split(/\r?\n/)[0]})`)
      if (attempt === 6) throw e
      // let the GPU process release its memory before trying again
      await new Promise((r) => setTimeout(r, 4000))
    }
  }
}
if (failed.length) {
  console.log(`not rendered (previous stills kept): ${failed.join(', ')}`)
  process.exitCode = 1
}

async function render(name, s, dsf, lite) {
  // a fresh browser per shot: several large renders in one GPU process can exhaust it
  // the largest frames take seconds each on a laptop GPU: keep Chromium's GPU watchdog from killing them
  const browser = await launch(['--disable-gpu-watchdog'])
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: dsf })
  const page = await ctx.newPage()
  let crashed = false
  page.on('crash', () => (crashed = true))
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  const t0 = Date.now()
  await page.goto(`${BASE}/studio.html?shot=${name}${lite ? '&lite' : ''}`)
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
  // a lost WebGL context renders nothing: never let a blank frame replace a good still
  const gpuError = errors.find((e) => /VALIDATE_STATUS|CONTEXT_LOST|context lost/i.test(e))
  if (gpuError || statSync(raw).size < 60000) {
    await browser.close()
    throw new Error(gpuError ? `the GPU failed (${gpuError.split(String.fromCharCode(10))[0].trim()})` : 'the frame came out blank')
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
  console.log(`${name}: ${s.w}×${s.h} at ${dsf}x${lite ? ' (lite)' : ''} in ${Date.now() - t0} ms${errors.length ? ' — ' + errors.slice(0, 2).join(' | ') : ''}`)
}
