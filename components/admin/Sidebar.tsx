'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const groups = [
  { items: [{ href: '/admin', label: 'Dashboard' }] },
  {
    title: 'Content',
    items: [
      { href: '/admin/projects', label: 'Projects' },
      { href: '/admin/testimonials', label: 'Testimonials' },
      { href: '/admin/journal', label: 'Journal' },
    ],
  },
  { title: 'Inbox', items: [{ href: '/admin/inbox', label: 'Enquiries' }] },
  { items: [{ href: '/admin/media', label: 'Media' }] },
  { items: [{ href: '/admin/settings', label: 'Settings' }] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const isActive = (href: string) => (href === '/admin' ? pathname === href : pathname.startsWith(href))
  return (
    <nav className="flex h-full flex-col gap-6 p-5">
      <Link href="/admin" className="px-2 text-lg font-semibold tracking-tight text-paper">
        Naazware
        <span className="ml-1 text-accent-soft">Admin</span>
      </Link>
      <div className="flex flex-col gap-5">
        {groups.map((g, i) => (
          <div key={i} className="flex flex-col gap-1">
            {g.title && (
              <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-paper-faint">{g.title}</p>
            )}
            {g.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive(item.href)
                    ? 'bg-accent/10 text-paper'
                    : 'text-paper-dim hover:bg-ink-700 hover:text-paper'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </nav>
  )
}
