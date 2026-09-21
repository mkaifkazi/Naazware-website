import Reveal from '@/components/Reveal'
import GlassCard from '@/components/GlassCard'
import { problem } from '@/lib/home-content'

export default function ProblemSection() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="container-px">
        <Reveal as="div" className="mb-14 max-w-2xl">
          <p className="eyebrow mb-4">{problem.eyebrow}</p>
          <h2 className="text-display-md">{problem.heading}</h2>
          <p className="mt-6 text-lg leading-relaxed text-paper-dim">{problem.intro}</p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {problem.points.map((point, i) => (
            <Reveal key={point.title} delay={(i % 3) * 80}>
              <GlassCard className="group flex h-full flex-col p-8">
                <span className="font-mono text-xs text-accent-soft transition-all duration-300 group-hover:text-accent group-hover:drop-shadow-[0_0_10px_rgb(var(--accent)/0.6)]">{`0${i + 1}`}</span>
                <h3 className="mt-4 text-lg font-semibold text-paper">{point.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-paper-dim">{point.body}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
