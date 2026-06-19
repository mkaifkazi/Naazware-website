/**
 * Builds on-brand HTML/CSS UI mockups for each case study, screenshots them at
 * 16:9, and uploads as the project's coverImage in Sanity. Re-runnable.
 * Run: npx tsx --env-file=.env.local scripts/seed-mockup-covers.ts
 */
import { createClient } from '@sanity/client'
import { writeFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const PREVIEW = process.env.PREVIEW === '1'
const PREVIEW_DIR =
  'C:/Users/MOHAMM~1.KAZ/AppData/Local/Temp/claude/C--dev-P-projects/f8450edd-1299-4b57-b106-77867825cebb/scratchpad/mockups'

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN
if (!projectId || !token) {
  console.error('Missing project id / write token in .env.local')
  process.exit(1)
}
const client = createClient({ projectId, dataset, apiVersion: '2024-06-01', token, useCdn: false })

const BASE = `
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0B0B0C;--surface:#141416;--surface2:#1B1B1F;--line:rgba(255,255,255,.08);--ink:#FAFAFA;--dim:#A1A1A5;--faint:#6B6B70;--accent:#2DD4BF;--accent2:#5EEAD4}
body{width:1600px;height:900px;background:var(--bg);font-family:'Inter',sans-serif;color:var(--ink);overflow:hidden}
.stage{position:relative;width:1600px;height:900px;display:flex;align-items:center;justify-content:center}
.grid{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,.04) 1px,transparent 1px);background-size:64px 64px}
.glow{position:absolute;width:1000px;height:1000px;border-radius:50%;background:radial-gradient(closest-side,var(--accent),transparent);opacity:.16;filter:blur(30px)}
h1,h2,h3,.disp{font-family:'Space Grotesk',sans-serif;letter-spacing:-.02em}
.mono{font-family:'JetBrains Mono',monospace}
/* Browser frame */
.browser{position:relative;width:1380px;height:812px;background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 60px 120px rgba(0,0,0,.6)}
.bbar{height:46px;display:flex;align-items:center;gap:8px;padding:0 18px;background:#0F0F11;border-bottom:1px solid var(--line)}
.dot{width:12px;height:12px;border-radius:50%}
.url{margin-left:18px;flex:1;height:28px;background:#08080a;border:1px solid var(--line);border-radius:8px;display:flex;align-items:center;padding:0 14px;color:var(--faint);font-size:13px}
.bbody{padding:34px 40px;height:766px}
/* Phone frame */
.phone{position:relative;width:382px;height:792px;background:#0E0E10;border:2px solid #26262b;border-radius:46px;padding:14px;box-shadow:0 60px 120px rgba(0,0,0,.6)}
.screen{position:relative;width:100%;height:100%;background:var(--bg);border-radius:34px;overflow:hidden}
.notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:150px;height:26px;background:#0E0E10;border-bottom-left-radius:16px;border-bottom-right-radius:16px;z-index:5}
.status{display:flex;justify-content:space-between;align-items:center;padding:14px 26px 6px;font-size:13px;color:var(--ink)}
.pbody{padding:8px 18px 0}
/* Shared UI bits */
.app-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.brand{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:20px;display:flex;align-items:center;gap:9px}
.bdot{width:11px;height:11px;border-radius:50%;background:var(--accent)}
.nav{display:flex;gap:26px;color:var(--dim);font-size:15px}
.nav .on{color:var(--ink)}
.btn{background:var(--accent);color:#08100f;font-weight:600;border-radius:9px;padding:9px 16px;font-size:14px;display:inline-flex;align-items:center;gap:8px}
.btn.ghost{background:transparent;border:1px solid var(--line);color:var(--ink)}
.avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#2563eb);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:15px;color:#06121a}
.card{background:var(--surface2);border:1px solid var(--line);border-radius:16px;padding:18px}
.chip{border:1px solid var(--line);border-radius:999px;padding:6px 13px;font-size:13px;color:var(--dim)}
.stat{font-family:'Space Grotesk',sans-serif;font-weight:600}
.photo{border-radius:12px;background:linear-gradient(135deg,rgba(45,212,191,.32),rgba(37,99,235,.22));display:flex;align-items:center;justify-content:center;font-size:30px}
.tabbar{position:absolute;bottom:0;left:0;right:0;height:74px;background:#0F0F12;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-around;padding-bottom:10px}
.tab{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:11px;color:var(--faint)}
.tab.on{color:var(--accent)}
.tab .ic{font-size:18px}
`

function page(inner: string, glowPos = 'top:-300px;right:-200px') {
  return `<!doctype html><html><head><meta charset="utf8">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
  <style>${BASE}</style></head>
  <body><div class="stage"><div class="grid"></div><div class="glow" style="${glowPos}"></div>${inner}</div></body></html>`
}

const browser = (url: string, body: string) => `
<div class="browser">
  <div class="bbar"><span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span><span class="dot" style="background:#28c840"></span>
    <div class="url">🔒 ${url}</div></div>
  <div class="bbody">${body}</div>
</div>`

const phone = (body: string) => `
<div class="phone"><div class="screen"><div class="notch"></div>
  <div class="status"><span class="mono">9:41</span><span>5G ▪ ▪ 84%</span></div>
  <div class="pbody">${body}</div>
</div></div>`

// ---------- Per-project content ----------
const screens: Record<string, string> = {
  // WEB — Bloom Dental booking
  'bloom-dental-booking': page(browser('bloomdental.in/appointments', `
    <div class="app-head">
      <div class="brand"><span class="bdot"></span>Bloom Dental Studio</div>
      <div class="nav"><span class="on">Appointments</span><span>Patients</span><span>Calendar</span><span class="btn">+ New booking</span></div>
    </div>
    <div style="display:flex;gap:14px;margin-bottom:22px">
      <div class="card" style="flex:1"><div style="color:var(--dim);font-size:13px">Today</div><div class="stat" style="font-size:30px">12 visits</div></div>
      <div class="card" style="flex:1"><div style="color:var(--dim);font-size:13px">This week</div><div class="stat" style="font-size:30px">64</div></div>
      <div class="card" style="flex:1"><div style="color:var(--dim);font-size:13px">No-shows</div><div class="stat" style="font-size:30px;color:var(--accent)">3%</div></div>
    </div>
    <div style="display:flex;gap:22px">
      <div class="card" style="flex:2">
        <h3 style="font-size:17px;margin-bottom:16px">This week · 18–23 June</h3>
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;text-align:center;color:var(--dim);font-size:13px;margin-bottom:12px">
          <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div></div>
        ${['9:00','10:30','12:00','2:00','4:30'].map(t=>`<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:10px">${[0,1,2,3,4,5].map(i=>{const booked=(i+t.length)%3===0;return `<div style="border:1px solid var(--line);border-radius:9px;padding:9px 0;text-align:center;font-size:13px;${booked?'background:#1f1f23;color:var(--faint)':'background:rgba(45,212,191,.12);color:var(--accent2)'}">${booked?'Booked':t}</div>`}).join('')}</div>`).join('')}
      </div>
      <div class="card" style="flex:1">
        <div style="color:var(--dim);font-size:13px;margin-bottom:6px">Next appointment</div>
        <h3 style="font-size:19px">Riya Shah</h3>
        <div style="color:var(--dim);margin:8px 0 16px;font-size:14px">Today · 10:30 AM · Scaling & polishing</div>
        <div class="chip" style="display:inline-block;margin-bottom:8px">Reminder sent ✓</div>
        <div style="margin-top:18px;display:flex;gap:10px"><span class="btn">Check in</span><span class="btn ghost">Reschedule</span></div>
      </div>
    </div>`)),

  // WEB — Saffron & Sage cafe
  'saffron-sage-cafe': page(browser('saffronandsage.cafe', `
    <div class="app-head">
      <div class="brand"><span class="bdot" style="background:#f0a93b"></span>Saffron &amp; Sage</div>
      <div class="nav"><span class="on">Menu</span><span>Order</span><span>About</span><span class="btn" style="background:#f0a93b;color:#1a1206">🛒 2 · ₹180</span></div>
    </div>
    <h1 style="font-size:34px;margin:6px 0 4px">Freshly brewed, all day.</h1>
    <div style="color:var(--dim);margin-bottom:22px;font-size:15px">Order ahead for pickup — ready in 10 minutes.</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
      ${[['Masala Chai','₹60','☕'],['Filter Coffee','₹70','🍵'],['Veg Sandwich','₹120','🥪'],['Banana Bread','₹90','🍰']].map(([n,p,e])=>`
      <div class="card" style="padding:0;overflow:hidden">
        <div class="photo" style="height:120px;border-radius:0">${e}</div>
        <div style="padding:14px"><div style="font-weight:600">${n}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><span class="mono" style="color:var(--accent2)">${p}</span><span class="btn" style="padding:6px 12px;font-size:13px">Add</span></div></div>
      </div>`).join('')}
    </div>
    <div class="card" style="margin-top:20px;display:flex;justify-content:space-between;align-items:center">
      <span style="color:var(--dim)">2 items in cart · Masala Chai, Veg Sandwich</span>
      <span class="btn" style="background:#f0a93b;color:#1a1206">Checkout · ₹180</span>
    </div>`)),

  // WEB — Threadhouse store
  'threadhouse-boutique-store': page(browser('threadhouse.store', `
    <div class="app-head">
      <div class="brand"><span class="bdot"></span>Threadhouse</div>
      <div class="nav"><span class="on">Shop</span><span>New In</span><span>Sale</span><span class="chip">🛒 Cart · 2</span></div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
      <h2 style="font-size:24px">New arrivals</h2>
      <div style="display:flex;gap:8px"><span class="chip">All</span><span class="chip" style="border-color:var(--accent);color:var(--accent2)">Women</span><span class="chip">Men</span><span class="chip">Accessories</span></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:18px">
      ${[['Linen Kurta','₹1,499','🧥'],['Cotton Dress','₹1,899','👗'],['Silk Scarf','₹799','🧣'],['Denim Jacket','₹2,499','🧥']].map(([n,p,e])=>`
      <div class="card" style="padding:0;overflow:hidden">
        <div class="photo" style="height:200px;border-radius:0">${e}</div>
        <div style="padding:14px"><div style="font-weight:600">${n}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><span class="mono" style="color:var(--accent2)">${p}</span><span class="btn" style="padding:6px 12px;font-size:13px">Add to cart</span></div></div>
      </div>`).join('')}
    </div>`)),

  // MOBILE — Ripple
  'ripple-preschool-app': page(phone(`
    <div style="display:flex;align-items:center;justify-content:space-between;margin:6px 4px 16px">
      <div><div style="color:var(--dim);font-size:13px">Good morning</div><div class="disp" style="font-weight:600;font-size:21px">Aarohi's day</div></div>
      <div class="avatar">A</div>
    </div>
    <div class="chip" style="display:inline-block;margin-bottom:14px;border-color:var(--accent);color:var(--accent2)">🟢 Present · Sunshine Class</div>
    <div class="card" style="padding:0;overflow:hidden;margin-bottom:12px">
      <div class="photo" style="height:120px;border-radius:0">🎨</div>
      <div style="padding:14px"><div style="font-weight:600">Circle Time &amp; Story</div><div style="color:var(--dim);font-size:13px;margin-top:4px">9:30 AM · Ms. Kavya</div></div>
    </div>
    <div class="card" style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><span style="font-size:22px">🍎</span><div><div style="font-weight:600">Lunch</div><div style="color:var(--dim);font-size:13px">Finished most of it</div></div></div>
    <div class="card" style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><span style="font-size:22px">😴</span><div><div style="font-weight:600">Nap</div><div style="color:var(--dim);font-size:13px">1h 15m · slept well</div></div></div>
    <div class="card" style="display:flex;align-items:center;gap:12px"><span style="font-size:22px">😊</span><div><div style="font-weight:600">Mood</div><div style="color:var(--dim);font-size:13px">Happy &amp; playful</div></div></div>
    <div class="tabbar"><div class="tab on"><span class="ic">🏠</span>Today</div><div class="tab"><span class="ic">📅</span>Calendar</div><div class="tab"><span class="ic">💳</span>Fees</div><div class="tab"><span class="ic">👤</span>Profile</div></div>
  `), 'top:-300px;left:-200px'),

  // MOBILE — FitNest
  'fitnest-gym-app': page(phone(`
    <div style="display:flex;align-items:center;justify-content:space-between;margin:6px 4px 16px">
      <div><div style="color:var(--dim);font-size:13px">Welcome back</div><div class="disp" style="font-weight:600;font-size:21px">FitNest</div></div>
      <div class="avatar">R</div>
    </div>
    <div class="card" style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
      <div style="width:64px;height:64px;border-radius:50%;border:5px solid var(--accent);border-right-color:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center" class="stat">68%</div>
      <div><div style="font-weight:600">Weekly goal</div><div style="color:var(--dim);font-size:13px">3 of 5 classes done</div></div>
    </div>
    <div style="font-weight:600;margin:4px 4px 12px">Today's classes</div>
    ${[['HIIT Blast','7:00 AM','4 spots left',true],['Power Yoga','6:00 PM','Booked',false],['Spin','8:00 PM','6 spots',true]].map(([n,t,s,open])=>`
    <div class="card" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div><div style="font-weight:600">${n}</div><div style="color:var(--dim);font-size:13px">${t} · ${s}</div></div>
      <span class="btn" style="${open?'':'background:#1f1f23;color:var(--faint)'};padding:8px 16px">${open?'Book':'Booked'}</span>
    </div>`).join('')}
    <div class="tabbar"><div class="tab on"><span class="ic">🏠</span>Home</div><div class="tab"><span class="ic">📋</span>Classes</div><div class="tab"><span class="ic">💪</span>Plan</div><div class="tab"><span class="ic">👤</span>Profile</div></div>
  `)),

  // MOBILE — Vidya Tuitions
  'vidya-tuitions-app': page(phone(`
    <div style="display:flex;align-items:center;justify-content:space-between;margin:6px 4px 16px">
      <div><div style="color:var(--dim);font-size:13px">Batch X-A · 18 Jun</div><div class="disp" style="font-weight:600;font-size:21px">Attendance</div></div>
      <div class="avatar">V</div>
    </div>
    <div class="card" style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;color:var(--dim);font-size:13px;margin-bottom:10px"><span>Class average</span><span class="stat" style="color:var(--accent2)">78%</span></div>
      <div style="display:flex;align-items:flex-end;gap:8px;height:64px">${[60,75,52,88,70,80].map(h=>`<div style="flex:1;height:${h}%;background:linear-gradient(to top,var(--accent),var(--accent2));border-radius:4px"></div>`).join('')}</div>
    </div>
    ${[['Aarav Patel','Present',true],['Diya Shah','Present',true],['Karan Mehta','Absent',false],['Isha Rao','Present',true]].map(([n,s,p])=>`
    <div class="card" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding:13px 16px">
      <span style="font-weight:500">${n}</span>
      <span class="chip" style="${p?'border-color:var(--accent);color:var(--accent2)':'border-color:#f87171;color:#f87171'}">${s}</span>
    </div>`).join('')}
    <div class="btn" style="width:100%;justify-content:center;margin-top:6px">Send parent update</div>
    <div class="tabbar"><div class="tab"><span class="ic">🏠</span>Home</div><div class="tab on"><span class="ic">✅</span>Attendance</div><div class="tab"><span class="ic">📝</span>Tests</div><div class="tab"><span class="ic">💳</span>Fees</div></div>
  `), 'top:-300px;left:-200px'),
}

async function run() {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
  for (const [slug, html] of Object.entries(screens)) {
    const page = await b.newPage()
    await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 2 })
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.evaluate(() => (document as Document).fonts.ready)
    await new Promise((r) => setTimeout(r, 300))
    const buf = Buffer.from(await page.screenshot({ type: 'png' }))
    await page.close()
    if (PREVIEW) {
      writeFileSync(`${PREVIEW_DIR}/${slug}.png`, buf)
      console.log(`✓ ${slug} — preview saved`)
      continue
    }
    const asset = await client.assets.upload('image', buf, { filename: `${slug}-cover.png` })
    await client
      .patch(`project-${slug}`)
      .set({ coverImage: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } } })
      .commit()
    console.log(`✓ ${slug} — cover set`)
  }
  await b.close()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
