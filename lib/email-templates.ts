import { site } from './site'

// Brand palette (hard-coded hex — email clients can't read CSS vars / Tailwind).
// Mirrors the site's dark theme: ink background, teal accent, paper text.
const C = {
  bg: '#0B0B0C', // ink-900 page background
  card: '#141416', // ink-800 elevated surface
  border: '#2A2A2E', // ink-600 hairline
  text: '#FAFAFA', // paper
  dim: '#A1A1A5', // paper-dim
  faint: '#6E6E73', // paper-faint
  teal: '#2DD4BF', // accent
  tealSoft: '#5EEAD4',
  onTeal: '#08120F', // near-black text on teal
} as const

export type EnquiryEmailData = {
  name: string
  email: string
  company?: string
  budget: string
  message: string
  prefersCall?: boolean
  phone?: string
  preferredTime?: string
  createdAt: string
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Budget option value -> human label (mirrors components/ContactForm.tsx).
const BUDGET_LABELS: Record<string, string> = {
  'under-25k': 'Under ₹25,000',
  '25k-1L': '₹25,000 - ₹1,00,000',
  '1L-3L': '₹1,00,000 - ₹3,00,000',
  '3L-5L': '₹3,00,000 - ₹5,00,000',
  '5L-10L': '₹5,00,000 - ₹10,00,000',
  'over-10L': 'Over ₹10,00,000',
}
const budgetLabel = (v: string) => BUDGET_LABELS[v] ?? v

const firstName = (full: string) => full.trim().split(/\s+/)[0] || full

// Outer shell: centered 600px card on a dark page, teal-accented wordmark header,
// content slot, muted footer. Table-based + inline styles for email-client support.
function shell(title: string, preheader: string, inner: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:32px 12px;">
<tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;">
    <!-- Header -->
    <tr><td style="padding:8px 8px 20px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:${C.text};letter-spacing:-0.02em;">Naazware</td>
      </tr></table>
      <div style="height:3px;width:44px;background:${C.teal};border-radius:2px;margin-top:8px;"></div>
    </td></tr>
    <!-- Card -->
    <tr><td style="background:${C.card};border:1px solid ${C.border};border-radius:16px;padding:32px;">
      ${inner}
    </td></tr>
    <!-- Footer -->
    <tr><td style="padding:24px 8px 8px;">
      <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${C.faint};">
        <a href="${site.url}" style="color:${C.dim};text-decoration:none;">${site.url.replace(/^https?:\/\//, '')}</a>
        &nbsp;·&nbsp;
        <a href="mailto:${site.email}" style="color:${C.dim};text-decoration:none;">${site.email}</a>
      </p>
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${C.faint};">
        ${esc(site.location)} — Naazware, custom software studio.
      </p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`
}

// Reusable detail rows for the submission summary.
function detailsTable(d: EnquiryEmailData): string {
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.faint};white-space:nowrap;vertical-align:top;width:130px;">${esc(label)}</td>
      <td style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.text};vertical-align:top;">${value}</td>
    </tr>`
  const call = d.prefersCall
    ? row('Prefers a call', 'Yes') +
      row('Phone', esc(d.phone || 'N/A')) +
      row('Preferred time', esc(d.preferredTime || 'Any'))
    : ''
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.border};margin-top:4px;">
    ${row('Name', esc(d.name))}
    ${row('Email', `<a href="mailto:${esc(d.email)}" style="color:${C.tealSoft};text-decoration:none;">${esc(d.email)}</a>`)}
    ${row('Company', esc(d.company || 'N/A'))}
    ${row('Budget', esc(budgetLabel(d.budget)))}
    ${call}
    ${row('Message', esc(d.message).replace(/\n/g, '<br/>'))}
  </table>`
}

const h1 = (t: string) =>
  `<h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.25;font-weight:700;color:${C.text};letter-spacing:-0.01em;">${t}</h1>`
const p = (t: string) =>
  `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${C.dim};">${t}</p>`

/** Internal notification to the studio inbox. */
export function renderAdminNotification(d: EnquiryEmailData): { subject: string; html: string } {
  const inner = `
    ${h1('New project enquiry')}
    ${p(`From <strong style="color:${C.text};">${esc(d.name)}</strong>${d.company ? ` at ${esc(d.company)}` : ''}. Reply to this email to reach them directly.`)}
    ${detailsTable(d)}
    <p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${C.faint};">Received ${esc(d.createdAt)}</p>`
  return { subject: `New project enquiry — ${d.name}`, html: shell('New project enquiry', `${d.name} — ${budgetLabel(d.budget)}`, inner) }
}

/** Confirmation / auto-reply sent to the customer who submitted the form. */
export function renderCustomerConfirmation(d: EnquiryEmailData): { subject: string; html: string } {
  const cta = d.prefersCall
    ? `We’ll call you${d.preferredTime ? ` around <strong style="color:${C.text};">${esc(d.preferredTime)}</strong>` : ''} within <strong style="color:${C.text};">one business day</strong>.`
    : `We’ll get back to you within <strong style="color:${C.text};">one business day</strong>.`
  const inner = `
    ${h1(`Thanks, ${esc(firstName(d.name))} —<br/>we’ve got your message.`)}
    ${p(`Your enquiry just landed with us. ${cta} In the meantime, here’s a copy of what you sent.`)}
    ${detailsTable(d)}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px;"><tr>
      <td style="border-radius:9999px;background:${C.teal};">
        <a href="${site.url}/work" style="display:inline-block;padding:11px 22px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:${C.onTeal};text-decoration:none;border-radius:9999px;">See our work</a>
      </td>
    </tr></table>
    <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:${C.dim};">— The Naazware team</p>`
  return {
    subject: `We’ve received your enquiry — Naazware`,
    html: shell('We’ve received your enquiry', `Thanks ${firstName(d.name)} — we’ll reply within one business day.`, inner),
  }
}
