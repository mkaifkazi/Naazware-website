/**
 * Render public/og-image.png from scripts/og/og-template.html.
 * Uses puppeteer-core driving the installed Edge/Chrome (no bundled Chromium).
 *
 *   node scripts/og/render-og.mjs
 *
 * Re-run after editing the template or brand copy. Override the browser binary
 * with EDGE_PATH / CHROME_PATH if auto-detect fails.
 */
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { existsSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const here = dirname(fileURLToPath(import.meta.url))
const templatePath = resolve(here, 'og-template.html')
const outPath = resolve(here, '../../public/og-image.png')

const CANDIDATES = [
  process.env.EDGE_PATH,
  process.env.CHROME_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].filter(Boolean)

const executablePath = CANDIDATES.find((p) => existsSync(p))
if (!executablePath) {
  console.error('No Edge/Chrome found. Set EDGE_PATH or CHROME_PATH.')
  process.exit(1)
}

const browser = await puppeteer.launch({
  executablePath,
  headless: 'new',
  args: ['--no-sandbox', '--force-color-profile=srgb'],
})

try {
  const page = await browser.newPage()
  // deviceScaleFactor 1 → exact 1200×630 output (OG spec size)
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
  await page.goto(pathToFileURL(templatePath).href, { waitUntil: 'networkidle0' })
  // ensure webfonts (Fraunces / JetBrains Mono) are loaded before shooting
  await page.evaluateHandle('document.fonts.ready')
  await page.screenshot({ path: outPath, type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } })
  console.log(`Wrote ${outPath}`)
} finally {
  await browser.close()
}
