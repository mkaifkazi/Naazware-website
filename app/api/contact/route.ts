import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { writeClient } from '@/sanity/lib/writeClient'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const NOTIFY_TO = process.env.CONTACT_NOTIFICATION_TO
const FROM = process.env.RESEND_FROM || 'Naazware <onboarding@resend.dev>'

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, company, budget, message, consent, website } = body

    // Honeypot: real users never fill this hidden field. Pretend success for bots.
    if (website) return NextResponse.json({ success: true }, { status: 200 })

    // Server-side validation (defence in depth alongside the client zod schema)
    if (!name || !email || !budget || !message || consent !== true) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    if (String(message).length > 5000 || String(name).length > 200) {
      return NextResponse.json({ error: 'Input too long' }, { status: 400 })
    }

    const createdAt = new Date().toISOString()

    // 1) Persist to Sanity (visible in the /studio inbox) — non-fatal if unconfigured/fails.
    if (writeClient) {
      try {
        await writeClient.create({
          _type: 'submission',
          name,
          email,
          company: company || '',
          budget,
          message,
          createdAt,
        })
      } catch (err) {
        console.error('Sanity submission write failed:', err)
      }
    }

    // 2) Email notification via Resend — non-fatal if unconfigured/fails.
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
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
            <hr/><p style="color:#888">Received ${createdAt}</p>
          `,
        })
      } catch (err) {
        console.error('Resend email failed:', err)
      }
    }

    if (!writeClient && !resend) {
      // Local dev with nothing configured yet — log so it's not silently lost.
      console.log('Contact submission (no backend configured):', { name, email, budget })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
