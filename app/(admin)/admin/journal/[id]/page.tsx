import { notFound } from 'next/navigation'
import type { JSONContent } from '@tiptap/react'
import { getPostById } from '@/lib/posts-service'
import { getMediaByIds } from '@/lib/media'
import PostEditor, { emptyValues, type EditorValues } from '@/components/admin/PostEditor'

export const dynamic = 'force-dynamic'

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const doc = await getPostById(params.id)
  if (!doc) notFound()

  const coverId = doc.coverMedia ? String(doc.coverMedia) : ''
  const resolved = coverId ? await getMediaByIds([coverId]) : []
  const coverUrl = resolved[0]?.url

  const initial: EditorValues = {
    ...emptyValues,
    title: doc.title ?? '',
    slug: doc.slug ?? '',
    excerpt: doc.excerpt ?? '',
    cover: coverId && coverUrl ? { id: coverId, url: coverUrl } : null,
    content: (doc.content as JSONContent | undefined) ?? null,
    author: doc.author ?? '',
    category: doc.category ?? '',
    tags: doc.tags ?? [],
    status: (doc.status as 'draft' | 'published') ?? 'draft',
    publishDate: doc.publishDate ? new Date(doc.publishDate).toISOString().slice(0, 10) : '',
    readTime: doc.readTime ?? '',
    seoTitle: doc.seoTitle ?? '',
    seoDescription: doc.seoDescription ?? '',
    ogImage: doc.ogImage ? { id: '', url: doc.ogImage } : null,
  }

  return <PostEditor mode="edit" id={params.id} initial={initial} />
}
