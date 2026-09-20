import { Metadata } from 'next'
import Link from 'next/link'
import CaseStudyCard from '@/components/CaseStudyCard'
import PageHeader from '@/components/PageHeader'
import SilkBackground from '@/components/visual/SilkBackground'
import Accents from '@/components/visual/Accents'
import CardGridReveal from '@/components/motion/CardGridReveal'
import CtaReveal from '@/components/motion/CtaReveal'
import { getProjects } from '@/lib/content'
import { generateMetadata as genMeta } from '@/lib/seo'

export const revalidate = 60

export const metadata: Metadata = genMeta({
  title: 'Work',
  description:
    'Selected projects from Naazware — custom web, mobile, and desktop applications built for brands across industries.',
  keywords: ['portfolio', 'case studies', 'client projects', 'software development'],
  path: '/work',
})

export default async function WorkPage() {
  const caseStudies = await getProjects()
  return (
    <>
      <div className="relative overflow-hidden">
      <SilkBackground composition={{ angle: 200, offset: { x: -15, y: 0 }, intensity: 0.55 }} />
      <div className="relative z-10">

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
        <CardGridReveal className="container-px grid gap-6 md:grid-cols-2">
          {caseStudies.map((study, i) => (
              <CaseStudyCard
                key={study.slug}
                title={study.title}
                client={study.client}
                industry={study.industry}
                excerpt={study.excerpt}
                href={`/work/${study.slug}`}
                metrics={study.metrics}
                index={i}
                coverUrl={study.coverUrl}
              />
          ))}
        </CardGridReveal>
      </section>

      <section className="relative overflow-hidden border-t border-ink-600 py-24 md:py-32">
        <Accents preset="cta" />
        <div className="container-px relative z-10 text-center">
          <CtaReveal className="mx-auto max-w-2xl">
            <h2 className="text-display-md text-gradient">Want similar results?</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-paper-dim">
              Tell us about your project and we&apos;ll show you how we can help.
            </p>
            <div className="mt-9 flex justify-center">
              <Link href="/contact" className="btn-accent">
                Start your project
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
