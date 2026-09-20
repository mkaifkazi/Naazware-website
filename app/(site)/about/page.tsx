import { Metadata } from 'next'
import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import Reveal from '@/components/Reveal'
import SilkBackground from '@/components/visual/SilkBackground'
import Accents from '@/components/visual/Accents'
import CardGridReveal from '@/components/motion/CardGridReveal'
import CtaReveal from '@/components/motion/CtaReveal'
import ProseReveal from '@/components/motion/ProseReveal'
import { generateMetadata as genMeta } from '@/lib/seo'

export const metadata: Metadata = genMeta({
  title: 'About',
  description:
    'Naazware is a software studio that believes great software should work beautifully — without drama, delays, or technical debt.',
  path: '/about',
})

const values = [
  {
    title: 'Honest timelines',
    body: "We give realistic estimates and stick to them. If something changes, you'll know immediately — not two weeks after the deadline.",
  },
  {
    title: 'Pragmatic engineering',
    body: "We use proven technologies and avoid over-engineering. Your project doesn't need a custom framework — it needs to work, fast.",
  },
  {
    title: 'Clear communication',
    body: 'No jargon, no excuses. We explain decisions in plain language and keep you updated every step of the way.',
  },
  {
    title: 'Quality by default',
    body: "Every detail is considered. Every page is tested. Every deploy is automated. Quality isn't optional — it's how we work.",
  },
  {
    title: 'Long-term thinking',
    body: 'We build for the next five years, not just launch day. Your codebase should be an asset, not a liability.',
  },
  {
    title: 'Client success',
    body: 'We succeed when you succeed. That means understanding your goals and your audience — not just shipping pixels.',
  },
]

const steps = [
  { no: '01', title: 'Discovery', body: 'We start by understanding your goals, audience, and constraints. No project starts without a clear brief.' },
  { no: '02', title: 'Design', body: 'A distinctive, on-brand interface designed in the open — you review real screens and shape the direction with us.' },
  { no: '03', title: 'Build', body: 'Fast, accessible, meticulously engineered. Continuous demos mean you see progress, not just a final reveal.' },
  { no: '04', title: 'Launch', body: 'We handle deployment, performance, and handover — so you go live with confidence, not crossed fingers.' },
]

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden">
      <SilkBackground composition={{ angle: 120, offset: { x: -20, y: 10 }, intensity: 0.6 }} />
      <div className="relative z-10">
      <PageHeader
        eyebrow="About"
        size="lg"
        title={
          <>
            A studio that believes software
            <br className="hidden md:block" /> should <span className="text-gradient">work beautifully.</span>
          </>
        }
        subtitle="Naazware is a small software studio. We design and build custom web, mobile, and desktop applications — without drama, delays, or technical debt."
      />

      {/* Who we are */}
      <section className="py-20 md:py-28">
        <div className="container-px grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal as="h2" className="text-display-sm">
            Who we are
          </Reveal>
          <ProseReveal className="space-y-5 text-lg leading-relaxed text-paper-dim">
            <p>
              Naazware started because we were tired of seeing good projects let down by poor
              planning, unclear timelines, and over-engineered solutions.
            </p>
            <p>
              We build software the way it should be built: sharp design, pragmatic engineering,
              clear communication, and products that work from day one. No buzzwords, no hype — just
              fast, reliable software and realistic timelines.
            </p>
            <p>
              Our clients range from new ventures launching their first product to established
              companies modernising legacy systems. What they share: they want a partner who
              delivers what they promise, when they promise it.
            </p>
          </ProseReveal>
        </div>
      </section>

      {/* Values */}
      <section className="relative overflow-hidden border-y border-ink-600 bg-ink-950 py-20 md:py-28">
        <Accents preset="section" />
        <div className="container-px relative z-10">
          <Reveal as="div" className="mb-14">
            <p className="eyebrow mb-4">What we value</p>
            <h2 className="text-display-md max-w-2xl">Principles that guide how we work.</h2>
          </Reveal>
          <CardGridReveal className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="h-full rounded-3xl border border-ink-600 bg-ink-800/60 p-7">
                <h3 className="text-lg font-semibold text-paper">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-paper-dim">{v.body}</p>
              </div>
            ))}
          </CardGridReveal>
        </div>
      </section>

      {/* How we work */}
      <section className="py-20 md:py-28">
        <div className="container-px">
          <Reveal as="div" className="mb-14">
            <p className="eyebrow mb-4">How we work</p>
            <h2 className="text-display-md max-w-2xl">From brief to launch, in four clear steps.</h2>
          </Reveal>
          <CardGridReveal className="grid gap-px overflow-hidden rounded-4xl border border-ink-600 bg-ink-600 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.no} className="flex h-full flex-col bg-ink-900 p-8">
                <span className="font-display text-5xl font-semibold text-accent/30">{step.no}</span>
                <h3 className="mt-6 text-lg font-semibold text-paper">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-paper-dim">{step.body}</p>
              </div>
            ))}
          </CardGridReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <Accents preset="cta" />
        <div className="container-px relative z-10 text-center">
          <CtaReveal className="mx-auto max-w-2xl">
            <h2 className="text-display-md text-gradient">Want to work with us?</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-paper-dim">
              Tell us about your project and we&apos;ll get back to you within 24 hours.
            </p>
            <div className="mt-9 flex justify-center">
              <Link href="/contact" className="btn-accent">
                Start a conversation
              </Link>
            </div>
          </CtaReveal>
        </div>
      </section>
      </div>
    </div>
  )
}
