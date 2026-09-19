import { auth } from '@/auth'
import { getDashboardStats } from '@/lib/admin-stats'

export const dynamic = 'force-dynamic'

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-ink-600 bg-ink-800/60 p-5 backdrop-blur">
      <div className="text-3xl font-semibold text-paper">{value}</div>
      <div className="mt-1 text-sm text-paper-dim">{label}</div>
    </div>
  )
}

export default async function AdminDashboard() {
  const session = await auth()
  const stats = await getDashboardStats()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  return (
    <div>
      <h1 className="text-2xl font-semibold text-paper">{greeting} 👋</h1>
      <p className="mt-1 text-sm text-paper-dim">{session?.user?.email}</p>
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="New enquiries" value={stats.enquiries} />
        <StatCard label="Projects" value={stats.projects} />
        <StatCard label="Published projects" value={stats.publishedProjects} />
        <StatCard label="Journal posts" value={stats.posts} />
        <StatCard label="Draft posts" value={stats.draftPosts} />
        <StatCard label="Testimonials" value={stats.testimonials} />
      </div>
    </div>
  )
}
