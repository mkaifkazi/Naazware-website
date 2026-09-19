import Link from 'next/link'
import { listPosts } from '@/lib/posts-service'
import PostsTable, { type PostRow } from '@/components/admin/PostsTable'

export const dynamic = 'force-dynamic'

export default async function JournalPage() {
  const rows = await listPosts()
  const initial: PostRow[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    status: r.status,
    category: r.category,
    publishDate: r.publishDate ? new Date(r.publishDate).toISOString() : '',
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : '',
  }))
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-paper">Journal</h1>
          <p className="mt-1 text-sm text-paper-dim">Write and manage blog posts.</p>
        </div>
        <Link
          href="/admin/journal/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-contrast hover:opacity-90"
        >
          New post
        </Link>
      </div>
      <div className="mt-8">
        <PostsTable initial={initial} />
      </div>
    </div>
  )
}
