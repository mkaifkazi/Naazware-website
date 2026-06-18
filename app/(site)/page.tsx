import Link from 'next/link'
import ServiceCard from '@/components/ServiceCard'
import CaseStudyCard from '@/components/CaseStudyCard'
import Reveal from '@/components/Reveal'
import { services } from '@/lib/services-data'
import { getFeaturedProjects, getTestimonials } from '@/lib/content'

export const revalidate = 60

const process = [
  {
    no: '01',
    title: 'Discovery',
    body: 'We start with your goals, audience, and constraints — and define exactly what success looks like before a single pixel moves.',
  },
  {
    no: '02',
    title: 'Design',
    body: 'A distinctive, on-brand interface designed in the open. You review real screens, not vague mockups, and shape the direction with us.',
  },
  {
    no: '03',
    title: 'Build',
    body: 'Fast, accessible, and meticulously engineered. Clean code, optimised assets, and continuous demos so there are no surprises.',
  },
  {
    no: '04',
    title: 'Launch',
    body: 'We handle deployment, performance tuning, and handover — so you go live with confidence, not crossed fingers.',
  },
]

export default async function HomePage() {
  const [featured, testimonials] = await Promise.all([getFeaturedProjects(), getTestimonials()])

  return (
    <>
      {/* ───────────── Hero ───────────── */}
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
        <div className="grid-bg absolute inset-0" aria-hidden="true" />
        {/* restrained acid glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-1/4 left-1/2 h-[55vh] w-[55vh] -translate-x-1/2 rounded-full opacity-[0.12] blur-[150px]"
          style={{ background: 'radial-gradient(closest-side, rgb(var(--accent)), transparent)' }}
        />

        <div className="container-px relative flex flex-1 flex-col pt-28">
          {/* top mono row */}
          <Reveal as="div" className="flex items-center justify-between border-b border-ink-600 pb-5">
            <span className="mono-label normal-case">
              <span className="relative mr-1 flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              Available for new projects
            </span>
            <span className="mono-label hidden sm:inline-flex">Vadodara, IN — Est. 2024</span>
          </Reveal>

          {/* headline */}
          <div className="flex flex-1 flex-col justify-center py-14">
            <Reveal as="h1" className="text-display-xl max-w-[16ch] font-medium">
              Custom software that sets you apart.
            </Reveal>
            <Reveal
              as="div"
              delay={120}
              className="mt-12 flex flex-col gap-10 md:flex-row md:items-end md:justify-between"
            >
              <p className="max-w-md text-lg leading-relaxed text-paper-dim">
                Naazware is a software studio. We design and build web, mobile, and desktop
                applications — engineered to perform and built to last.
              </p>
              <div className="flex shrink-0 flex-wrap items-center gap-5">
                <Link href="/contact" className="btn-accent">
                  Start a project
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/work"
                  className="group inline-flex items-center gap-2 font-mono text-sm uppercase tracking-wider text-paper underline-offset-8 hover:underline"
                >
                  View work
                  <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                    ↗
                  </span>
                </Link>
              </div>
            </Reveal>
          </div>

          {/* capabilities strip */}
          <Reveal as="div" delay={200} className="grid grid-cols-2 border-t border-ink-600 md:grid-cols-4">
            {['Web apps', 'Mobile apps', 'Desktop apps', 'QA & hosting'].map((c, i) => (
              <div
                key={c}
                className={`flex items-baseline gap-3 py-6 ${i > 0 ? 'md:border-l md:border-ink-600 md:pl-6' : ''}`}
              >
                <span className="font-mono text-xs text-accent-soft">{`0${i + 1}`}</span>
                <span className="text-sm text-paper">{c}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ───────────── Services ───────────── */}
      <section className="relative py-24 md:py-32">
        <div className="container-px">
          <Reveal as="div" className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow mb-4">What we do</p>
              <h2 className="text-display-md max-w-2xl">
                From idea to shipped product, under one roof.
              </h2>
            </div>
            <Link href="/services" className="btn-ghost shrink-0">
              All services
            </Link>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <Reveal key={service.slug} delay={(i % 3) * 80}>
                <ServiceCard
                  title={service.title}
                  description={service.shortDescription}
                  bullets={service.bullets}
                  href={`/services/${service.slug}`}
                  icon={service.icon}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Selected work ───────────── */}
      <section className="relative border-y border-ink-600 bg-ink-950 py-24 md:py-32">
        <div className="container-px">
          <Reveal as="div" className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow mb-4">Selected work</p>
              <h2 className="text-display-md max-w-2xl">Recent projects, real outcomes.</h2>
            </div>
            <Link href="/work" className="btn-ghost shrink-0">
              All projects
            </Link>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2">
            {featured.map((study, i) => (
              <Reveal key={study.slug} delay={(i % 2) * 100}>
                <CaseStudyCard
                  title={study.title}
                  client={study.client}
                  industry={study.industry}
                  excerpt={study.excerpt}
                  href={`/work/${study.slug}`}
                  metrics={study.metrics}
                  index={i}
                  coverUrl={study.coverUrl}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Process ───────────── */}
      <section className="relative py-24 md:py-32">
        <div className="container-px">
          <Reveal as="div" className="mb-14">
            <p className="eyebrow mb-4">How we work</p>
            <h2 className="text-display-md max-w-2xl">
              A calm, transparent process from brief to launch.
            </h2>
          </Reveal>

          <div className="grid gap-px overflow-hidden rounded-4xl border border-ink-600 bg-ink-600 md:grid-cols-2 lg:grid-cols-4">
            {process.map((step, i) => (
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

      {/* ───────────── Testimonials ───────────── */}
      <section className="relative border-t border-ink-600 bg-ink-950 py-24 md:py-32">
        <div className="container-px">
          <Reveal as="div" className="mb-14">
            <p className="eyebrow mb-4">Kind words</p>
            <h2 className="text-display-md max-w-2xl">Clients who&apos;d work with us again.</h2>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.author} delay={(i % 3) * 80}>
                <figure className="flex h-full flex-col rounded-3xl border border-ink-600 bg-ink-800/60 p-8">
                  <svg className="h-8 w-8 text-accent/50" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M9.5 5C6.5 6.5 5 9 5 12.5V19h6v-6H8c0-2 1-3.5 3-4.5L9.5 5Zm10 0C16.5 6.5 15 9 15 12.5V19h6v-6h-3c0-2 1-3.5 3-4.5L19.5 5Z" />
                  </svg>
                  <blockquote className="mt-6 flex-1 text-lg leading-relaxed text-paper">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-8">
                    <div className="font-medium text-paper">{t.author}</div>
                    <div className="text-sm text-paper-dim">{t.role}</div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Final CTA ───────────── */}
      <section className="relative overflow-hidden py-28 md:py-36">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[130px]"
          style={{ background: 'radial-gradient(closest-side, rgb(var(--accent)), transparent)' }}
        />
        <div className="container-px relative text-center">
          <Reveal as="div" className="mx-auto max-w-3xl">
            <h2 className="text-display-lg text-gradient">Ready to build something great?</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-paper-dim">
              Tell us what you&apos;re building. We&apos;ll reply within 24 hours with honest
              thoughts, a timeline, and an estimate.
            </p>
            <div className="mt-10 flex justify-center">
              <Link href="/contact" className="btn-accent">
                Start a project
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
