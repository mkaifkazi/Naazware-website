import Link from 'next/link'
import { Metadata } from 'next'
import PageHeader from '@/components/PageHeader'
import Reveal from '@/components/Reveal'
import ServiceIcon from '@/components/ServiceIcon'
import { services } from '@/lib/services-data'
import { generateMetadata as genMeta } from '@/lib/seo'

export const metadata: Metadata = genMeta({
  title: 'Services',
  description:
    'Web and app design & development, hosting, QA, and ongoing maintenance — end-to-end, from planning through deployment and support.',
  keywords: ['web design services', 'web development', 'app development', 'hosting', 'QA testing'],
  path: '/services',
})

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        size="lg"
        title={
          <>
            Everything your website needs, <span className="text-gradient">under one roof.</span>
          </>
        }
        subtitle="End-to-end design & development — from planning through deployment and support."
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
                    <span className="grid h-12 w-12 place-items-center rounded-xl border border-ink-600 text-accent">
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
                        <svg className="mt-1.5 h-4 w-4 shrink-0 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
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

      <section className="relative overflow-hidden py-24 md:py-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[130px]"
          style={{ background: 'radial-gradient(closest-side, #6d5df6, transparent)' }}
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
