import Link from 'next/link'
import Reveal from './Reveal'

type Crumb = { label: string; href?: string }

type Props = {
  eyebrow?: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  crumbs?: Crumb[]
  children?: React.ReactNode
  size?: 'md' | 'lg'
}

export default function PageHeader({ eyebrow, title, subtitle, crumbs, children, size = 'md' }: Props) {
  return (
    <section className="relative overflow-hidden">
      <div className="grid-bg absolute inset-0" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/4 top-[-30%] h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
        style={{ background: 'radial-gradient(closest-side, #6d5df6, transparent)' }}
      />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-ink-900" aria-hidden="true" />

      <div className="container-px relative pb-16 pt-36 md:pb-20 md:pt-44">
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-paper-faint">
              {crumbs.map((c, i) => (
                <li key={i} className="flex items-center gap-2">
                  {c.href ? (
                    <Link href={c.href} className="transition-colors hover:text-paper">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-paper-dim">{c.label}</span>
                  )}
                  {i < crumbs.length - 1 && <span aria-hidden="true">/</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <Reveal as="div" className="max-w-4xl">
          {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
          <h1 className={size === 'lg' ? 'text-display-lg' : 'text-display-md'}>{title}</h1>
          {subtitle && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-paper-dim">{subtitle}</p>
          )}
          {children && <div className="mt-9">{children}</div>}
        </Reveal>
      </div>
    </section>
  )
}
