import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { auth } from '@/auth'
import Sidebar from '@/components/admin/Sidebar'
import SignOutButton from '@/components/admin/SignOutButton'

export const metadata: Metadata = {
  title: 'Naazware Admin',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth()

  // Unauthed (e.g. /admin/login). Middleware guards everything except the login page,
  // so reaching here without a session means we're on the login screen — render it bare.
  if (!session) {
    return (
      <div className="min-h-screen bg-ink-900 text-paper" data-theme="dark">
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-900 text-paper" data-theme="dark">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-600 bg-ink-950/60 backdrop-blur md:flex">
          <div className="flex-1">
            <Sidebar />
          </div>
          <div className="border-t border-ink-600 p-3">
            <div className="px-2 pb-2 text-xs text-paper-faint">{session.user?.email}</div>
            <SignOutButton />
          </div>
        </aside>
        <main className="flex-1 px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  )
}
