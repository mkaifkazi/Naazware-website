import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { enquiryInputSchema } from '@/lib/schemas/enquiry'
import { createEnquiry } from '@/lib/enquiries-service'
import { rateLimit } from '@/lib/rate-limit'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const NOTIFY_TO = process.env.CONTACT_NOTIFICATION_TO
// Verified Resend sender (mail.naazware.com subdomain). Override per-env with RESEND_FROM.
const FROM = process.env.RESEND_FROM || 'Naazware <hello@mail.naazware.com>'

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!rateLimit(`contact:${ip}`, 5, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()

    // Honeypot: real users never fill this hidden field. Pretend success for bots.
    if (body.website) return NextResponse.json({ success: true }, { status: 200 })

    const parsed = enquiryInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
    }
    const { name, email, company, budget, message, prefersCall, phone, preferredTime } = parsed.data
    const createdAt = new Date().toISOString()

    // 1) Persist to Mongo (primary store — surfaces in the admin inbox).
    let saved = false
    try {
      await createEnquiry(parsed.data)
      saved = true
    } catch (err) {
      console.error('Enquiry DB write failed:', err)
    }

    // 2) Email notification via Resend — best effort.
    let emailed = false
    if (resend && NOTIFY_TO) {
      try {
        await resend.emails.send({
          from: FROM,
          to: NOTIFY_TO,
          replyTo: email,
          subject: `New project enquiry — ${name}`,
          html: `
            <h2>New contact submission</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Company:</strong> ${escapeHtml(company || 'N/A')}</p>
            <p><strong>Budget:</strong> ${escapeHtml(budget)}</p>
            ${
              prefersCall
                ? `<p><strong>Prefers a call:</strong> Yes</p>
            <p><strong>Phone:</strong> ${escapeHtml(phone || 'N/A')}</p>
            <p><strong>Preferred time:</strong> ${escapeHtml(preferredTime || 'Any')}</p>`
                : ''
            }
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
            <hr/><p style="color:#888">Received ${createdAt}</p>
          `,
        })
        emailed = true
      } catch (err) {
        console.error('Resend email failed:', err)
      }
    }

    // Never silently lose a lead: if it was neither stored nor emailed, tell the visitor.
    if (!saved && !emailed) {
      return NextResponse.json({ error: 'Could not send your message. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
