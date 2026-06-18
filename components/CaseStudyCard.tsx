import Link from 'next/link'

interface CaseStudyCardProps {
  title: string
  client: string
  industry: string
  excerpt: string
  href: string
  metrics?: { label: string; value: string }[]
  index?: number
}

// Deterministic cover gradients so each card feels distinct without real imagery yet.
const covers = [
  'linear-gradient(135deg, #2a2150 0%, #6d5df6 100%)',
  'linear-gradient(135deg, #102a3c 0%, #2f80a8 100%)',
  'linear-gradient(135deg, #311d3f 0%, #b5589a 100%)',
  'linear-gradient(135deg, #14302a 0%, #2f9e74 100%)',
  'linear-gradient(135deg, #3a2410 0%, #d08a3e 100%)',
]

export default function CaseStudyCard({
  title,
  client,
  industry,
  excerpt,
  href,
  metrics,
  index = 0,
}: CaseStudyCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-4xl border border-ink-600 bg-ink-800/50 transition-all duration-500 ease-out-expo hover:-translate-y-1.5 hover:border-accent/40"
    >
      {/* Cover */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <div
          className="absolute inset-0 transition-transform duration-700 ease-out-expo group-hover:scale-105"
          style={{ background: covers[index % covers.length] }}
        />
        <div className="grid-bg absolute inset-0 opacity-40" aria-hidden="true" />
        <span className="absolute left-6 top-6 rounded-full border border-white/20 bg-black/20 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/90 backdrop-blur-sm">
          {industry}
        </span>
        <span className="absolute bottom-5 left-6 font-display text-3xl font-semibold text-white/95 drop-shadow">
          {client}
        </span>
        <span className="absolute bottom-5 right-6 grid h-10 w-10 translate-y-2 place-items-center rounded-full bg-white/95 text-ink-900 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M7 17 17 7M17 7H9M17 7v8" />
          </svg>
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-7">
        <h3 className="text-xl font-semibold text-paper transition-colors group-hover:text-accent-soft">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-paper-dim">{excerpt}</p>

        {metrics && metrics.length > 0 && (
          <div className="mt-auto grid grid-cols-3 gap-3 pt-7">
            {metrics.slice(0, 3).map((m) => (
              <div key={m.label} className="rounded-2xl border border-ink-600 bg-ink-900/40 p-3 text-center">
                <div className="font-display text-lg font-semibold text-accent-soft">{m.value}</div>
                <div className="mt-1 text-[11px] leading-tight text-paper-faint">{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
