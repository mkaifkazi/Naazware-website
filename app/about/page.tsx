import { Metadata } from 'next'
import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import Reveal from '@/components/Reveal'
import { generateMetadata as genMeta } from '@/lib/seo'

export const metadata: Metadata = genMeta({
  title: 'About',
  description:
    'Naazware is a web design & development studio that believes great websites should work beautifully — without drama, delays, or technical debt.',
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
    body: 'We build for the next five years, not just launch day. Your site should be an asset, not a liability.',
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
    <>
      <PageHeader
        eyebrow="About"
        size="lg"
        title={
          <>
            A studio that believes the web
            <br className="hidden md:block" /> should <span className="text-gradient">work beautifully.</span>
          </>
        }
        subtitle="Naazware is a small web design & development studio. We craft premium, fast, distinctive websites — without drama, delays, or technical debt."
      />

      {/* Who we are */}
      <section className="py-20 md:py-28">
        <div className="container-px grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal as="h2" className="text-display-sm">
            Who we are
          </Reveal>
          <Reveal as="div" delay={120} className="space-y-5 text-lg leading-relaxed text-paper-dim">
            <p>
              Naazware started because we were tired of seeing good projects let down by poor
              planning, unclear timelines, and over-engineered solutions.
            </p>
            <p>
              We build websites the way they should be built: sharp design, pragmatic engineering,
              clear communication, and work that performs from day one. No buzzwords, no hype — just
              beautiful, fast sites and realistic timelines.
            </p>
            <p>
              Our clients range from new ventures launching their first product to established brands
              that want to look the part. What they share: they want a partner who delivers what they
              promise, when they promise it.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="border-y border-ink-600 bg-ink-950 py-20 md:py-28">
        <div className="container-px">
          <Reveal as="div" className="mb-14">
            <p className="eyebrow mb-4">What we value</p>
            <h2 className="text-display-md max-w-2xl">Principles that guide how we work.</h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={(i % 3) * 80}>
                <div className="h-full rounded-3xl border border-ink-600 bg-ink-800/60 p-7">
                  <h3 className="text-lg font-semibold text-paper">{v.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-paper-dim">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How we work */}
      <section className="py-20 md:py-28">
        <div className="container-px">
          <Reveal as="div" className="mb-14">
            <p className="eyebrow mb-4">How we work</p>
            <h2 className="text-display-md max-w-2xl">From brief to launch, in four clear steps.</h2>
          </Reveal>
          <div className="grid gap-px overflow-hidden rounded-4xl border border-ink-600 bg-ink-600 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <Reveal key={step.no} delay={i * 80} className="bg-ink-900">
                <div className="flex h-full flex-col p-8">
                  <span className="font-display text-5xl font-semibold text-accent/30">{step.no}</span>
                  <h3 className="mt-6 text-lg font-semibold text-paper">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-paper-dim">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[130px]"
          style={{ background: 'radial-gradient(closest-side, #6d5df6, transparent)' }}
        />
        <div className="container-px relative text-center">
          <Reveal as="div" className="mx-auto max-w-2xl">
            <h2 className="text-display-md text-gradient">Want to work with us?</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-paper-dim">
              Tell us about your project and we&apos;ll get back to you within 24 hours.
            </p>
            <div className="mt-9 flex justify-center">
              <Link href="/contact" className="btn-accent">
                Start a conversation
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
