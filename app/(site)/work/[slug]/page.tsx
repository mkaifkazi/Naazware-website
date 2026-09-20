import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import Reveal from '@/components/Reveal'
import SilkBackground from '@/components/visual/SilkBackground'
import Accents from '@/components/visual/Accents'
import CardGridReveal from '@/components/motion/CardGridReveal'
import CtaReveal from '@/components/motion/CtaReveal'
import MediaReveal from '@/components/motion/MediaReveal'
import { getProject, getProjectSlugs } from '@/lib/content'
import { generateMetadata as genMeta, generateBreadcrumbSchema } from '@/lib/seo'

export async function generateStaticParams() {
  return (await getProjectSlugs()).map((slug) => ({ slug }))
}

export const revalidate = 60 // ISR
export const dynamicParams = true

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const caseStudy = await getProject(params.slug)
  if (!caseStudy) return genMeta({ title: 'Case Study Not Found', noindex: true })
  return genMeta({
    title: `${caseStudy.title} — ${caseStudy.client}`,
    description: caseStudy.excerpt,
    path: `/work/${caseStudy.slug}`,
    image: caseStudy.coverUrl || undefined,
  })
}

export default async function CaseStudyPage({ params }: { params: { slug: string } }) {
  const caseStudy = await getProject(params.slug)
  if (!caseStudy) notFound()

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Work', url: '/work' },
    { name: caseStudy.title, url: `/work/${caseStudy.slug}` },
  ])

  const blocks = [
    { label: 'The challenge', body: caseStudy.challenge },
    { label: 'Our solution', body: caseStudy.solution },
    { label: 'The outcome', body: caseStudy.outcome },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="relative overflow-hidden">
      <SilkBackground composition={{ angle: 160, intensity: 0.5 }} />
      <div className="relative z-10">

      <PageHeader
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Work', href: '/work' }, { label: caseStudy.title }]}
        eyebrow={caseStudy.industry}
        title={caseStudy.title}
        subtitle={`${caseStudy.client} · ${caseStudy.excerpt}`}
      />

      {caseStudy.coverUrl && (
        <section className="pb-12">
          <div className="container-px">
            <MediaReveal className="overflow-hidden rounded-4xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={caseStudy.coverUrl}
                alt={`${caseStudy.title} — ${caseStudy.client}`}
                className="aspect-[16/9] w-full rounded-4xl border border-ink-600 object-cover"
              />
            </MediaReveal>
          </div>
        </section>
      )}

      <section className="pb-8">
        <div className="container-px">
          {/* Metrics */}
          <Reveal as="div" className="grid gap-px overflow-hidden rounded-4xl border border-ink-600 bg-ink-600 sm:grid-cols-3">
            {caseStudy.metrics.map((m) => (
              <div key={m.label} className="bg-ink-900 p-8 text-center">
                <div className="font-display text-4xl font-semibold text-accent-soft">{m.value}</div>
                <div className="mt-2 text-sm text-paper-dim">{m.label}</div>
              </div>
            ))}
          </Reveal>

          {/* Narrative */}
          <CardGridReveal className="mt-6 space-y-6">
            {blocks.map((b) => (
                <div key={b.label} className="grid gap-6 rounded-4xl border border-ink-600 bg-ink-800/50 p-8 md:grid-cols-[0.5fr_1fr] md:p-12">
                  <h2 className="text-display-sm">{b.label}</h2>
                  <p className="text-lg leading-relaxed text-paper-dim">{b.body}</p>
                </div>
            ))}

              <div className="rounded-4xl border border-ink-600 bg-ink-800/50 p-8 md:p-12">
                <h2 className="text-sm font-medium uppercase tracking-wider text-paper-dim">Technology stack</h2>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {caseStudy.technologies.map((tech) => (
                    <span key={tech} className="rounded-full border border-ink-600 bg-ink-900 px-3.5 py-1.5 text-sm text-paper-dim">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

            {caseStudy.testimonial && (
                <figure className="rounded-4xl border border-ink-600 bg-ink-800/50 p-8 md:p-12">
                  <svg className="h-8 w-8 text-accent/50" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M9.5 5C6.5 6.5 5 9 5 12.5V19h6v-6H8c0-2 1-3.5 3-4.5L9.5 5Zm10 0C16.5 6.5 15 9 15 12.5V19h6v-6h-3c0-2 1-3.5 3-4.5L19.5 5Z" />
                  </svg>
                  <blockquote className="mt-6 text-2xl leading-relaxed text-paper">
                    &ldquo;{caseStudy.testimonial.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6">
                    <div className="font-medium text-paper">{caseStudy.testimonial.author}</div>
                    <div className="text-sm text-paper-dim">{caseStudy.testimonial.role}</div>
                  </figcaption>
                </figure>
            )}
          </CardGridReveal>
        </div>
      </section>

      <section className="relative overflow-hidden py-24 md:py-32">
        <Accents preset="cta" />
        <div className="container-px relative z-10 text-center">
          <CtaReveal className="mx-auto max-w-2xl">
            <h2 className="text-display-md text-gradient">Need similar help?</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-paper-dim">
              Tell us about your project and we&apos;ll send you a detailed proposal.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="btn-accent">Start your project</Link>
              <Link href="/work" className="btn-ghost">See more case studies</Link>
            </div>
          </CtaReveal>
        </div>
      </section>
      </div>
      </div>
    </>
  )
}
