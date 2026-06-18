/**
 * Generates an on-brand cover image for each project and uploads it to Sanity,
 * setting it as the project's coverImage. Re-runnable (replaces the cover).
 * Run: npm run seed:covers
 */
import { createClient } from '@sanity/client'
import puppeteer from 'puppeteer-core'

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN
if (!projectId || !token) {
  console.error('Missing project id / write token in .env.local')
  process.exit(1)
}
const client = createClient({ projectId, dataset, apiVersion: '2024-06-01', token, useCdn: false })

const tint: Record<string, string> = {
  Retail: '#2DD4BF',
  Healthcare: '#38BDF8',
  Logistics: '#14B8A6',
  Finance: '#6366F1',
}

function coverHtml(title: string, client: string, industry: string) {
  const accent = tint[industry] || '#2DD4BF'
  return `<!doctype html><html><head><meta charset="utf8">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:1600px;height:1000px;background:#0B0B0C;position:relative;overflow:hidden;font-family:'Space Grotesk',sans-serif;color:#FAFAFA}
    .grid{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.045) 1px,transparent 1px);background-size:80px 80px}
    .glow{position:absolute;top:-280px;right:-200px;width:900px;height:900px;border-radius:50%;background:radial-gradient(closest-side, ${accent}, transparent);opacity:.22;filter:blur(40px)}
    .wrap{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:90px}
    .tag{font-family:'JetBrains Mono',monospace;font-size:26px;letter-spacing:.16em;text-transform:uppercase;color:${accent};display:flex;align-items:center;gap:14px}
    .dot{width:14px;height:14px;border-radius:50%;background:${accent}}
    h1{font-size:104px;line-height:.98;font-weight:600;letter-spacing:-0.04em;max-width:1200px}
    .client{margin-top:26px;font-family:'JetBrains Mono',monospace;font-size:30px;color:#A1A1A5}
  </style></head>
  <body>
    <div class="grid"></div><div class="glow"></div>
    <div class="wrap">
      <div class="tag"><span class="dot"></span>${industry}</div>
      <div><h1>${title}</h1><div class="client">${client}</div></div>
    </div>
  </body></html>`
}

async function run() {
  const projects = await client.fetch<{ _id: string; title: string; client: string; industry: string }[]>(
    `*[_type=="project"]{_id, title, client, industry}`
  )
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
  for (const p of projects) {
    const page = await browser.newPage()
    await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 })
    await page.setContent(coverHtml(p.title, p.client, p.industry), { waitUntil: 'networkidle0' })
    await page.evaluate(() => (document as Document).fonts.ready)
    await new Promise((r) => setTimeout(r, 250))
    const buf = Buffer.from(await page.screenshot({ type: 'png' }))
    await page.close()
    const asset = await client.assets.upload('image', buf, { filename: `${p._id}-cover.png` })
    await client
      .patch(p._id)
      .set({ coverImage: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } } })
      .commit()
    console.log(`✓ ${p.title} (${p.client}) — cover set`)
  }
  await browser.close()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
