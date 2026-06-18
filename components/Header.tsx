'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { nav, site } from '@/lib/site'
import ThemeToggle from './ThemeToggle'
import BrandMark from './BrandMark'

function Wordmark() {
  return (
    <span className="flex items-center gap-3 font-display text-2xl font-semibold tracking-tight text-paper">
      <BrandMark className="h-11 w-11" />
      Naazware
    </span>
  )
}

export default function Header() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href)

  return (
    <header className="no-print fixed inset-x-0 top-0 z-[100]">
      <div
        className={`transition-all duration-500 ease-out-expo ${
          scrolled
            ? 'border-b border-ink-600 bg-ink-900/80 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <nav className="container-px flex h-[72px] items-center justify-between">
          <Link href="/" aria-label="Naazware home" onClick={() => setOpen(false)}>
            <Wordmark />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 lg:flex">
            {nav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm transition-colors duration-200 ${
                  isActive(link.href)
                    ? 'text-paper'
                    : 'text-paper-dim hover:text-paper'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/contact" className="hidden btn-accent !px-5 !py-2.5 text-sm lg:inline-flex">
              Start a project
            </Link>

            {/* Mobile toggle */}
            <button
              type="button"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full border border-ink-600 text-paper lg:hidden"
            >
              <span className="relative block h-4 w-5">
                <span
                  className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300 ${
                    open ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0'
                  }`}
                />
                <span
                  className={`absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-1/2 bg-current transition-all duration-200 ${
                    open ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300 ${
                    open ? 'bottom-1/2 translate-y-1/2 -rotate-45' : 'bottom-0'
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 top-[72px] z-[90] transform bg-ink-950/98 backdrop-blur-xl transition-all duration-300 lg:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="container-px flex flex-col gap-1 py-8">
          {nav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`border-b border-ink-600 py-4 font-display text-2xl ${
                isActive(link.href) ? 'text-accent-soft' : 'text-paper'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="btn-accent mt-6 w-full"
          >
            Start a project
          </Link>
          <a
            href={`mailto:${site.email}`}
            className="mt-4 text-center text-sm text-paper-dim"
          >
            {site.email}
          </a>
        </div>
      </div>
    </header>
  )
}
