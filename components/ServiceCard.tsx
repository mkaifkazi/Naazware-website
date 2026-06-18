import Link from 'next/link'
import ServiceIcon from './ServiceIcon'

interface ServiceCardProps {
  title: string
  description: string
  bullets?: string[]
  href: string
  icon: string
}

export default function ServiceCard({ title, description, bullets = [], href, icon }: ServiceCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink-600 bg-ink-800/60 p-7 transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:border-accent/50 hover:bg-ink-700/60"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
      />
      <div className="relative mb-6 grid h-12 w-12 place-items-center rounded-xl border border-ink-600 text-accent-soft transition-colors duration-300 group-hover:border-accent/40">
        <ServiceIcon name={icon} className="h-6 w-6" />
      </div>

      <h3 className="text-xl font-semibold text-paper">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-paper-dim">{description}</p>

      {bullets.length > 0 && (
        <ul className="mt-5 space-y-2">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-paper-dim">
              <svg className="mt-1 h-3.5 w-3.5 shrink-0 text-accent-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {b}
            </li>
          ))}
        </ul>
      )}

      <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-medium text-paper">
        Learn more
        <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  )
}
