// Rasterises an SVG with a transparent background in Edge.
// Usage: node tools/couple/render.mjs <in.svg> <out.png> <width> <height>
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { launch } from '../../tests/e2e/lib.mjs'

const [input, output, w, h] = process.argv.slice(2)
const width = Number(w)
const height = Number(h)
const svg = readFileSync(input, 'utf8')
const browser = await launch()
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
await page.setContent(`<html><body style="margin:0;background:transparent"><div style="width:${width}px;height:${height}px">${svg}</div></body></html>`)
await page.waitForTimeout(300)
await page.screenshot({ path: path.resolve(output), omitBackground: true, clip: { x: 0, y: 0, width, height } })
await browser.close()
