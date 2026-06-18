import Link from 'next/link'
import { nav, site } from '@/lib/site'

const LinkedInIcon = () => (
  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)
const XIcon = () => (
  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)
const GitHubIcon = () => (
  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.5 11.5 0 0 1 3-.405c1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
)

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="no-print relative overflow-hidden border-t border-ink-600 bg-ink-950">
      {/* accent glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[120%] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, #6d5df6, transparent)' }}
      />
      <div className="container-px relative py-16 md:py-24">
        {/* Big CTA line */}
        <div className="mb-16 max-w-4xl">
          <p className="eyebrow mb-5">Let&apos;s build something</p>
          <h2 className="text-display-md">
            Have a project in mind?{' '}
            <Link href="/contact" className="text-gradient underline-offset-8 hover:underline">
              Start the conversation.
            </Link>
          </h2>
        </div>

        <div className="grid gap-12 border-t border-ink-600 pt-12 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <span className="font-display text-2xl font-semibold text-paper">Naazware</span>
            <p className="mt-4 max-w-xs text-paper-dim">
              A web design &amp; development studio crafting premium, fast, and distinctive
              websites for brands that mean it.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { href: site.socials.linkedin, label: 'LinkedIn', icon: <LinkedInIcon /> },
                { href: site.socials.twitter, label: 'X (Twitter)', icon: <XIcon /> },
                { href: site.socials.github, label: 'GitHub', icon: <GitHubIcon /> },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-ink-600 text-paper-dim transition-colors hover:border-accent hover:text-accent"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div>
            <p className="eyebrow mb-5">Sitemap</p>
            <ul className="space-y-3">
              {nav.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-paper-dim transition-colors hover:text-paper">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="eyebrow mb-5">Get in touch</p>
            <ul className="space-y-3 text-paper-dim">
              <li>
                <a href={`mailto:${site.email}`} className="transition-colors hover:text-paper">
                  {site.email}
                </a>
              </li>
              <li>
                <a href={site.phoneHref} className="transition-colors hover:text-paper">
                  {site.phone}
                </a>
              </li>
              <li>{site.location}</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-ink-600 pt-8 text-sm text-paper-faint md:flex-row">
          <p>© {year} Naazware. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition-colors hover:text-paper">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-paper">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
