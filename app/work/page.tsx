import { Metadata } from 'next'
import Link from 'next/link'
import CaseStudyCard from '@/components/CaseStudyCard'
import PageHeader from '@/components/PageHeader'
import Reveal from '@/components/Reveal'
import { caseStudies } from '@/lib/case-studies-data'
import { generateMetadata as genMeta } from '@/lib/seo'

export const metadata: Metadata = genMeta({
  title: 'Work',
  description:
    'Selected projects from Naazware — premium websites and web apps designed and built for brands across industries.',
  keywords: ['portfolio', 'case studies', 'client projects', 'web design portfolio'],
  path: '/work',
})

export default function WorkPage() {
  return (
    <>
      <PageHeader
        eyebrow="Selected work"
        size="lg"
        title={
          <>
            Projects we&apos;re <span className="text-gradient">proud of.</span>
          </>
        }
        subtitle="Real projects with measurable outcomes — from e-commerce to healthcare to logistics."
      />

      <section className="pb-24 md:pb-32">
        <div className="container-px grid gap-6 md:grid-cols-2">
          {caseStudies.map((study, i) => (
            <Reveal key={study.slug} delay={(i % 2) * 100}>
              <CaseStudyCard
                title={study.title}
                client={study.client}
                industry={study.industry}
                excerpt={study.excerpt}
                href={`/work/${study.slug}`}
                metrics={study.metrics}
                index={i}
              />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-ink-600 py-24 md:py-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[130px]"
          style={{ background: 'radial-gradient(closest-side, rgb(var(--accent)), transparent)' }}
        />
        <div className="container-px relative text-center">
          <Reveal as="div" className="mx-auto max-w-2xl">
            <h2 className="text-display-md text-gradient">Want similar results?</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-paper-dim">
              Tell us about your project and we&apos;ll show you how we can help.
            </p>
            <div className="mt-9 flex justify-center">
              <Link href="/contact" className="btn-accent">
                Start your project
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
