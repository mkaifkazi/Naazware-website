import { notFound } from 'next/navigation'
import { getProjectById } from '@/lib/projects-service'
import { getMediaByIds } from '@/lib/media'
import ProjectEditor, { emptyValues, type EditorValues } from '@/components/admin/ProjectEditor'

export const dynamic = 'force-dynamic'

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const doc = await getProjectById(params.id)
  if (!doc) notFound()

  const coverId = doc.coverMedia ? String(doc.coverMedia) : ''
  const galleryIds = (doc.gallery ?? []).map((g) => String(g))
  const wanted = [coverId, ...galleryIds].filter(Boolean)
  const resolved = await getMediaByIds(wanted)
  const urlById = new Map(resolved.map((m) => [m.id, m.url]))

  const initial: EditorValues = {
    ...emptyValues,
    title: doc.title ?? '',
    slug: doc.slug ?? '',
    client: doc.client ?? '',
    industry: doc.industry ?? '',
    shortDescription: doc.shortDescription ?? '',
    fullDescription: doc.fullDescription ?? '',
    challenge: doc.challenge ?? '',
    solution: doc.solution ?? '',
    outcome: doc.outcome ?? '',
    services: doc.services ?? [],
    technologies: doc.technologies ?? [],
    metrics: (doc.metrics ?? []).map((m) => ({ label: m.label ?? '', value: m.value ?? '' })),
    cover: coverId && urlById.has(coverId) ? { id: coverId, url: urlById.get(coverId) as string } : null,
    gallery: galleryIds
      .filter((id) => urlById.has(id))
      .map((id) => ({ id, url: urlById.get(id) as string })),
    videoUrl: doc.videoUrl ?? '',
    externalUrl: doc.externalUrl ?? '',
    testimonial: {
      quote: doc.testimonial?.quote ?? '',
      author: doc.testimonial?.author ?? '',
      role: doc.testimonial?.role ?? '',
    },
    featured: Boolean(doc.featured),
    status: (doc.status as 'draft' | 'published') ?? 'draft',
    seo: {
      title: doc.seo?.title ?? '',
      description: doc.seo?.description ?? '',
      ogImage: doc.seo?.ogImage ? { id: '', url: doc.seo.ogImage } : null,
    },
  }

  return <ProjectEditor mode="edit" id={params.id} initial={initial} />
}
