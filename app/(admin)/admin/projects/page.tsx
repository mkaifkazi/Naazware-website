import Link from 'next/link'
import { listProjects } from '@/lib/projects-service'
import ProjectsTable, { type ProjectRow } from '@/components/admin/ProjectsTable'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const rows = await listProjects()
  const initial: ProjectRow[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    client: r.client,
    status: r.status,
    featured: r.featured,
    order: r.order,
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : '',
  }))
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-paper">Projects</h1>
          <p className="mt-1 text-sm text-paper-dim">Manage case studies shown on the site.</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-contrast hover:opacity-90"
        >
          New project
        </Link>
      </div>
      <div className="mt-8">
        <ProjectsTable initial={initial} />
      </div>
    </div>
  )
}
