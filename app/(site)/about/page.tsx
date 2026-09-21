import { Metadata } from 'next'
import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import Reveal from '@/components/Reveal'
import CardGridReveal from '@/components/motion/CardGridReveal'
import CtaReveal from '@/components/motion/CtaReveal'
import ProseReveal from '@/components/motion/ProseReveal'
import StatCountUp from '@/components/home/StatCountUp'
import GlassCard from '@/components/GlassCard'
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

// NOTE: `Projects shipped` value is a PLACEHOLDER — set the real figure.
const facts = [
  { value: '2024', label: 'Established' },
  { value: '10+', label: 'Projects shipped' },
  { value: '1-day', label: 'Business-day reply' },
  { value: '3', label: 'Platforms built' },
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
        <div className="container-px grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* Left — heading + narrative */}
          <div className="space-y-8">
            <Reveal as="h2" className="text-display-sm">
              Who we are
            </Reveal>
            <ProseReveal className="space-y-6 text-lg leading-relaxed text-paper-dim">
              <p className="text-xl leading-relaxed text-paper md:text-2xl">
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

          {/* Right — glass stat anchor */}
          <div className="lg:sticky lg:top-[16vh]">
            <Reveal>
              <div className="glass-panel p-6 md:p-8">
                <CardGridReveal className="grid grid-cols-2 gap-4">
                  {facts.map((f) => (
                    <div
                      key={f.label}
                      className="group relative overflow-hidden rounded-2xl border border-accent/15 bg-accent/[0.04] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/45 hover:bg-accent/[0.07] hover:shadow-[0_10px_34px_-14px_rgb(var(--accent)/0.45)]"
                    >
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/25 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                      />
                      <StatCountUp
                        value={f.value}
                        className="relative block font-display text-3xl font-semibold text-accent-soft transition-colors duration-300 group-hover:text-accent md:text-4xl"
                      />
                      <div className="relative mt-1.5 text-xs uppercase tracking-[0.14em] text-paper-faint">
                        {f.label}
                      </div>
                    </div>
                  ))}
                </CardGridReveal>

                <div className="mt-6 border-t border-ink-600/70 pt-6">
                  <div className="flex flex-wrap gap-2">
                    {['Web', 'Mobile', 'Desktop'].map((d) => (
                      <span
                        key={d}
                        className="rounded-full border border-accent/25 bg-accent/5 px-3.5 py-1.5 text-sm text-accent-soft transition-colors duration-300 hover:border-accent/50 hover:bg-accent/10"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 flex items-center gap-2 text-sm text-paper-dim">
                    <svg className="h-4 w-4 shrink-0 text-accent-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M12 21s-7-5.686-7-11a7 7 0 1 1 14 0c0 5.314-7 11-7 11Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                    Vadodara, India — working with clients worldwide.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative overflow-hidden border-y border-ink-600 bg-ink-950/70 py-20 md:py-28">
        <div className="container-px relative z-10">
          <Reveal as="div" className="mb-14">
            <p className="eyebrow mb-4">What we value</p>
            <h2 className="text-display-md max-w-2xl">Principles that guide how we work.</h2>
          </Reveal>
          <CardGridReveal className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => (
              <GlassCard key={v.title} className="group h-full p-7">
                <h3 className="text-lg font-semibold text-paper transition-colors duration-300 group-hover:text-accent-soft">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-paper-dim">{v.body}</p>
              </GlassCard>
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
              <div key={step.no} className="group flex h-full flex-col bg-ink-900 p-8 transition-colors duration-300 hover:bg-ink-800">
                <span className="font-display text-5xl font-semibold text-accent/30 transition-all duration-300 group-hover:text-accent/70 group-hover:drop-shadow-[0_0_16px_rgb(var(--accent)/0.5)]">{step.no}</span>
                <h3 className="mt-6 text-lg font-semibold text-paper">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-paper-dim">{step.body}</p>
              </div>
            ))}
          </CardGridReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-24 md:py-32">
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
