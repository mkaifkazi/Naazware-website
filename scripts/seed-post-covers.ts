/**
 * Generates an on-brand cover image for each journal post and uploads it to
 * Sanity, setting it as the post's coverImage. Re-runnable (replaces cover).
 * Run: npx tsx --env-file=.env.local scripts/seed-post-covers.ts
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

// Accent per topic family (stays within the brand teal/sky/indigo range).
const tagAccent: [string[], string][] = [
  [['AI', 'LLM', 'RAG', 'Data'], '#6366F1'],
  [['Security', 'OWASP', 'Privacy', 'Compliance', 'Risk', 'DPDP', 'GDPR', 'Authentication', 'HTTPS'], '#38BDF8'],
  [['Cloud', 'Hosting', 'Serverless', 'Edge', 'DevOps', 'Optimization'], '#2DD4BF'],
  [['Mobile', 'React Native', 'Flutter', 'Offline', 'UX'], '#14B8A6'],
  [['Next.js', 'Web', 'Web Development', 'Performance', 'Core Web Vitals', 'SEO', 'CMS', 'PWA'], '#22D3EE'],
  [['Pricing', 'MVP', 'Startups', 'Budgeting', 'Hiring', 'Outsourcing', 'Strategy', 'Product Strategy', 'Contracts'], '#5EEAD4'],
]
function accentFor(tags: string[]): string {
  for (const [keys, color] of tagAccent) if (tags.some((t) => keys.includes(t))) return color
  return '#2DD4BF'
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function coverHtml(title: string, eyebrow: string, accent: string) {
  return `<!doctype html><html><head><meta charset="utf8">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:1600px;height:840px;background:#0B0B0C;position:relative;overflow:hidden;font-family:'Space Grotesk',sans-serif;color:#FAFAFA}
    .grid{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.045) 1px,transparent 1px);background-size:80px 80px}
    .glow{position:absolute;top:-260px;right:-180px;width:820px;height:820px;border-radius:50%;background:radial-gradient(closest-side, ${accent}, transparent);opacity:.22;filter:blur(40px)}
    .wrap{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:96px}
    .tag{font-family:'JetBrains Mono',monospace;font-size:26px;letter-spacing:.16em;text-transform:uppercase;color:${accent};display:flex;align-items:center;gap:14px}
    .dot{width:14px;height:14px;border-radius:50%;background:${accent}}
    h1{font-size:90px;line-height:1.0;font-weight:600;letter-spacing:-0.035em;max-width:1320px}
    .brand{font-family:'JetBrains Mono',monospace;font-size:28px;color:#A1A1A5;letter-spacing:.04em}
  </style></head>
  <body>
    <div class="grid"></div><div class="glow"></div>
    <div class="wrap">
      <div class="tag"><span class="dot"></span>${esc(eyebrow)}</div>
      <div><h1>${esc(title)}</h1></div>
      <div class="brand">naazware.com</div>
    </div>
  </body></html>`
}

async function run() {
  const posts = await client.fetch<{ _id: string; title: string; tags: string[] }[]>(
    `*[_type=="post"]{_id, title, tags}`
  )
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
  for (const p of posts) {
    const tags = p.tags || []
    const page = await browser.newPage()
    await page.setViewport({ width: 1600, height: 840, deviceScaleFactor: 1 })
    await page.setContent(coverHtml(p.title, tags[0] || 'Journal', accentFor(tags)), { waitUntil: 'networkidle0' })
    await page.evaluate(() => (document as Document).fonts.ready)
    await new Promise((r) => setTimeout(r, 250))
    const buf = Buffer.from(await page.screenshot({ type: 'png' }))
    await page.close()
    const asset = await client.assets.upload('image', buf, { filename: `${p._id}-cover.png` })
    await client
      .patch(p._id)
      .set({ coverImage: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } } })
      .commit()
    console.log(`✓ ${p.title} — cover set`)
  }
  await browser.close()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
