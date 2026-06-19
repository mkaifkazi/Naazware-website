import Link from 'next/link'
import { Metadata } from 'next'
import PageHeader from '@/components/PageHeader'
import Reveal from '@/components/Reveal'
import ServiceIcon from '@/components/ServiceIcon'
import { services } from '@/lib/services-data'
import { generateMetadata as genMeta, generateFaqSchema } from '@/lib/seo'

export const metadata: Metadata = genMeta({
  title: 'Services',
  description:
    'Web and app design & development, hosting, QA, and ongoing maintenance — end-to-end, from planning through deployment and support.',
  keywords: ['web design services', 'web development', 'app development', 'hosting', 'QA testing'],
  path: '/services',
})

const faqs = [
  {
    q: 'What kind of software does Naazware build?',
    a: 'We build custom web applications, mobile apps (iOS and Android), and desktop applications. From early-stage MVPs to production platforms — we handle design, engineering, deployment, and ongoing support.',
  },
  {
    q: 'How much does a custom software project cost?',
    a: 'It depends on scope. A simple app or internal tool typically starts around 5–15 lakh INR (roughly 6,000–18,000 USD), while a full product platform runs higher. We give a grounded estimate after understanding your goals — no surprises.',
  },
  {
    q: 'How long does it take to build an app?',
    a: 'A focused MVP usually takes 4–10 weeks; larger platforms run 3–6 months or more. We work in short cycles with regular demos so you see progress continuously rather than waiting for one big reveal.',
  },
  {
    q: 'Do you work with clients outside India?',
    a: 'Yes. We are based in Vadodara, India and work with clients worldwide. Most collaboration happens over async updates and scheduled calls, so time zones are rarely an issue.',
  },
  {
    q: 'What technologies do you use?',
    a: 'We choose the right tool per project, but our core stack includes Next.js and React for web, React Native and Flutter for mobile, and modern, secure cloud hosting. We prioritise performance, security, and maintainability.',
  },
  {
    q: 'Do you provide support and maintenance after launch?',
    a: 'Yes. We offer ongoing maintenance, hosting, monitoring, and iterative improvements so your software stays fast, secure, and up to date long after launch.',
  },
]

export default function ServicesPage() {
  const faqSchema = generateFaqSchema(faqs)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <PageHeader
        eyebrow="Services"
        size="lg"
        title={
          <>
            Everything you need to ship, <span className="text-gradient">under one roof.</span>
          </>
        }
        subtitle="End-to-end software development — web, mobile, and desktop — from planning through deployment and support."
      />

      <section className="pb-12">
        <div className="container-px space-y-6">
          {services.map((service) => (
            <Reveal key={service.slug}>
              <div
                id={service.slug}
                className="grid scroll-mt-28 gap-8 rounded-4xl border border-ink-600 bg-ink-800/50 p-8 md:grid-cols-2 md:p-12"
              >
                <div>
                  <div className="mb-6 flex items-center gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-xl border border-ink-600 text-accent-soft">
                      <ServiceIcon name={service.icon} className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-medium uppercase tracking-wider text-paper-dim">
                      {service.title}
                    </span>
                  </div>
                  <p className="text-xl leading-relaxed text-paper">{service.fullDescription}</p>
                  <ul className="mt-6 space-y-3">
                    {service.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-paper-dim">
                        <svg className="mt-1.5 h-4 w-4 shrink-0 text-accent-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/services/${service.slug}`} className="btn-accent mt-8 !px-6 !py-3 text-sm">
                    Learn more
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                <div className="rounded-3xl border border-ink-600 bg-ink-900/50 p-8">
                  <h3 className="text-sm font-medium uppercase tracking-wider text-paper-dim">
                    Technologies
                  </h3>
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    {service.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-ink-600 bg-ink-800 px-3.5 py-1.5 text-sm text-paper-dim"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-ink-600 py-20 md:py-28">
        <div className="container-px">
          <Reveal>
            <h2 className="text-display-sm text-paper">Frequently asked questions</h2>
          </Reveal>
          <div className="mt-10 grid gap-px overflow-hidden rounded-4xl border border-ink-600 bg-ink-600">
            {faqs.map((faq) => (
              <details key={faq.q} className="group bg-ink-900/60 p-6 md:p-8">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-lg font-medium text-paper marker:content-['']">
                  {faq.q}
                  <svg
                    className="h-5 w-5 shrink-0 text-accent-soft transition-transform duration-300 group-open:rotate-45"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p className="mt-4 leading-relaxed text-paper-dim">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-24 md:py-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[130px]"
          style={{ background: 'radial-gradient(closest-side, rgb(var(--accent)), transparent)' }}
        />
        <div className="container-px relative text-center">
          <Reveal as="div" className="mx-auto max-w-2xl">
            <h2 className="text-display-md text-gradient">Not sure which service you need?</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-paper-dim">
              Let&apos;s talk about your project. We&apos;ll recommend the right approach.
            </p>
            <div className="mt-9 flex justify-center">
              <Link href="/contact" className="btn-accent">
                Schedule a consultation
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
