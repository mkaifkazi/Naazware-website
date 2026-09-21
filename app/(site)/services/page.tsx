import Link from 'next/link'
import { Metadata } from 'next'
import PageHeader from '@/components/PageHeader'
import Reveal from '@/components/Reveal'
import CtaReveal from '@/components/motion/CtaReveal'
import AccordionReveal from '@/components/motion/AccordionReveal'
import ServicesStory from '@/components/services/ServicesStory'
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

      <div className="relative overflow-hidden">
      <div className="relative z-10">

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

      <ServicesStory services={services} />

      <section className="border-t border-ink-600 py-20 md:py-28">
        <div className="container-px">
          <Reveal>
            <h2 className="text-display-sm text-paper">Frequently asked questions</h2>
          </Reveal>
          <AccordionReveal className="mt-10 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="glass-panel group px-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium text-paper marker:hidden">
                  {faq.q}
                  <svg
                    className="h-5 w-5 shrink-0 text-accent-soft transition-transform duration-300 group-open:rotate-45"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p className="pb-5 leading-relaxed text-paper-dim">{faq.a}</p>
              </details>
            ))}
          </AccordionReveal>
        </div>
      </section>

      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="container-px relative z-10 text-center">
          <CtaReveal className="mx-auto max-w-2xl">
            <h2 className="text-display-md text-gradient">Not sure which service you need?</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-paper-dim">
              Let&apos;s talk about your project. We&apos;ll recommend the right approach.
            </p>
            <div className="mt-9 flex justify-center">
              <Link href="/contact" className="btn-accent">
                Schedule a consultation
              </Link>
            </div>
          </CtaReveal>
        </div>
      </section>
      </div>
      </div>
    </>
  )
}
