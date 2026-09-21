import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { enquiryInputSchema } from '@/lib/schemas/enquiry'
import { createEnquiry } from '@/lib/enquiries-service'
import { rateLimit } from '@/lib/rate-limit'
import { renderAdminNotification, renderCustomerConfirmation, type EnquiryEmailData } from '@/lib/email-templates'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const NOTIFY_TO = process.env.CONTACT_NOTIFICATION_TO
// Resend sender — the domain (naazware.com) must be Verified in Resend. Override with RESEND_FROM.
const FROM = process.env.RESEND_FROM || 'Naazware <hello@naazware.com>'
// Where a customer's reply to the confirmation email should land (the studio inbox).
const REPLY_TO = process.env.CONTACT_NOTIFICATION_TO || 'hello@naazware.com'

/** Send one email via Resend, inspecting the { error } result (it never throws). */
async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  replyTo?: string
  tag: string
}): Promise<boolean> {
  if (!resend) return false
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      replyTo: opts.replyTo,
      subject: opts.subject,
      html: opts.html,
    })
    if (error) {
      console.error(`[contact] ${opts.tag} rejected:`, JSON.stringify(error))
      return false
    }
    console.info(`[contact] ${opts.tag} sent — id=${data?.id ?? 'unknown'} to=${opts.to}`)
    return true
  } catch (err) {
    console.error(`[contact] ${opts.tag} threw:`, err)
    return false
  }
}

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

    console.info(
      `[contact] received from ${email} — config: resendKey=${!!resend} notifyTo=${NOTIFY_TO ? 'set' : 'MISSING'} from="${FROM}"`
    )

    // 1) Persist to Mongo (primary store — surfaces in the admin inbox).
    let saved = false
    try {
      await createEnquiry(parsed.data)
      saved = true
      console.info('[contact] saved to DB')
    } catch (err) {
      console.error('[contact] DB write failed:', err)
    }

    // 2) Emails via Resend — best effort, brand-styled templates.
    //    (a) internal notification to the studio inbox,
    //    (b) confirmation / auto-reply to the customer.
    const emailData: EnquiryEmailData = {
      name,
      email,
      company,
      budget,
      message,
      prefersCall,
      phone,
      preferredTime,
      createdAt,
    }

    let emailed = false // true once the STUDIO notification lands (the lead reached us)
    if (!resend) {
      console.warn('[contact] email skipped: RESEND_API_KEY not set')
    } else if (!NOTIFY_TO) {
      console.warn('[contact] email skipped: CONTACT_NOTIFICATION_TO not set')
    } else {
      const admin = renderAdminNotification(emailData)
      emailed = await sendEmail({
        to: NOTIFY_TO,
        subject: admin.subject,
        html: admin.html,
        replyTo: email, // reply goes straight to the enquirer
        tag: 'admin-notification',
      })

      // Customer confirmation — independent of the admin send; failure here must
      // not fail the request (the lead is already captured).
      const customer = renderCustomerConfirmation(emailData)
      await sendEmail({
        to: email,
        subject: customer.subject,
        html: customer.html,
        replyTo: REPLY_TO, // customer replies reach the studio inbox
        tag: 'customer-confirmation',
      })
    }

    console.info(`[contact] outcome: saved=${saved} emailed=${emailed}`)

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
