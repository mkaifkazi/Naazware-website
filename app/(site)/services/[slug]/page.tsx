import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import Reveal from '@/components/Reveal'
import { getService, getAllServiceSlugs } from '@/lib/services-data'
import { generateMetadata as genMeta, generateBreadcrumbSchema } from '@/lib/seo'

export async function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const service = getService(params.slug)
  if (!service) return genMeta({ title: 'Service Not Found' })
  return genMeta({
    title: service.title,
    description: service.fullDescription,
    keywords: service.keywords,
    path: `/services/${service.slug}`,
  })
}

export default function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = getService(params.slug)
  if (!service) notFound()

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
    { name: service.title, url: `/services/${service.slug}` },
  ])

  const blocks = [
    { label: 'The challenge', body: service.challenge },
    { label: 'Our approach', body: service.approach },
    { label: 'Expected results', body: service.result },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <PageHeader
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Services', href: '/services' }, { label: service.title }]}
        title={service.title}
        subtitle={service.fullDescription}
      >
        <Link href="/contact" className="btn-accent">
          Start your project
        </Link>
      </PageHeader>

      <section className="pb-8">
        <div className="container-px space-y-6">
          {blocks.map((b) => (
            <Reveal key={b.label}>
              <div className="grid gap-6 rounded-4xl border border-ink-600 bg-ink-800/50 p-8 md:grid-cols-[0.5fr_1fr] md:p-12">
                <h2 className="text-display-sm">{b.label}</h2>
                <p className="text-lg leading-relaxed text-paper-dim">{b.body}</p>
              </div>
            </Reveal>
          ))}

          <Reveal>
            <div className="rounded-4xl border border-ink-600 bg-ink-800/50 p-8 md:p-12">
              <h2 className="text-display-sm mb-6">Key features</h2>
              <ul className="grid gap-4 md:grid-cols-2">
                {service.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 text-paper-dim">
                    <svg className="mt-1.5 h-4 w-4 shrink-0 text-accent-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {bullet}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-2.5 border-t border-ink-600 pt-8">
                {service.technologies.map((tech) => (
                  <span key={tech} className="rounded-full border border-ink-600 bg-ink-900 px-3.5 py-1.5 text-sm text-paper-dim">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
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
            <h2 className="text-display-md text-gradient">Ready to get started?</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-paper-dim">
              Tell us about your project and we&apos;ll send you a detailed estimate within 24 hours.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="btn-accent">Get a free estimate</Link>
              <Link href="/work" className="btn-ghost">See similar projects</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
