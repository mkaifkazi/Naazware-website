import { Metadata } from 'next'
import ContactForm from '@/components/ContactForm'
import PageHeader from '@/components/PageHeader'
import Reveal from '@/components/Reveal'
import { generateMetadata as genMeta } from '@/lib/seo'
import { site } from '@/lib/site'

export const metadata: Metadata = genMeta({
  title: 'Contact',
  description:
    'Get in touch to discuss your project. We reply within 24 hours with honest thoughts, a timeline, and an estimate.',
  path: '/contact',
})

const expectations = [
  'Reply within 24 hours (usually faster)',
  'Honest assessment of timeline and budget',
  'Clear next steps if we’re a good fit',
  'No sales pressure or pushy follow-ups',
]

const faqs = [
  {
    q: 'How long does a typical project take?',
    a: 'Most projects take 8–12 weeks from kickoff to launch. Complex projects can take longer. We’ll give you a detailed timeline after understanding your requirements.',
  },
  {
    q: 'What’s your pricing model?',
    a: 'We quote fixed-price for well-defined projects or time-and-materials for ongoing work. We’ll provide a detailed breakdown before starting.',
  },
  {
    q: 'Do you work with new ventures?',
    a: 'Yes. About half our clients are launching their first product. We’re good at helping you scope an MVP that ships fast without cutting corners on quality.',
  },
  {
    q: 'Do you provide ongoing support?',
    a: 'Yes. We offer monthly retainers for maintenance, fixes, and new features. Most clients stay with us after launch.',
  },
]

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        size="lg"
        title={
          <>
            Let&apos;s build <span className="text-gradient">something great.</span>
          </>
        }
        subtitle="Tell us about your project. We’ll reply within 24 hours with an estimate and timeline."
      />

      <section className="pb-24">
        <div className="container-px grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Form */}
          <Reveal>
            <div className="rounded-4xl border border-ink-600 bg-ink-800/50 p-8 md:p-10">
              <h2 className="mb-6 text-display-sm">Start your project</h2>
              <ContactForm />
            </div>
          </Reveal>

          {/* Info */}
          <Reveal delay={120} className="space-y-10">
            <div>
              <p className="eyebrow mb-4">Email us</p>
              <a href={`mailto:${site.email}`} className="text-lg text-accent-soft transition-colors hover:text-accent-soft">
                {site.email}
              </a>
              <p className="mt-2 text-sm text-paper-faint">We reply within 24 hours.</p>
            </div>

            <div>
              <p className="eyebrow mb-4">What to expect</p>
              <ul className="space-y-3">
                {expectations.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-paper-dim">
                    <svg className="mt-1 h-4 w-4 shrink-0 text-accent-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-ink-600 bg-ink-800/50 p-6">
              <h3 className="font-medium text-paper">Prefer to talk first?</h3>
              <p className="mt-2 text-sm text-paper-dim">
                Email{' '}
                <a href={`mailto:${site.email}`} className="text-accent-soft hover:text-accent-soft">
                  {site.email}
                </a>{' '}
                or call{' '}
                <a href={site.phoneHref} className="text-accent-soft hover:text-accent-soft">
                  {site.phone}
                </a>{' '}
                and we&apos;ll schedule a call. We work with clients worldwide across all time zones.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-ink-600 bg-ink-950 py-20 md:py-28">
        <div className="container-px max-w-3xl">
          <Reveal as="h2" className="text-display-md mb-10 text-center">
            Common questions
          </Reveal>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={faq.q} delay={i * 60}>
                <details className="group rounded-2xl border border-ink-600 bg-ink-800/50 px-6 open:bg-ink-800/80">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium text-paper marker:hidden">
                    {faq.q}
                    <svg className="h-5 w-5 shrink-0 text-paper-dim transition-transform duration-300 group-open:rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </summary>
                  <p className="pb-5 leading-relaxed text-paper-dim">{faq.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
