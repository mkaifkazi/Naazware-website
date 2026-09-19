import { notFound } from 'next/navigation'
import { getTestimonialById } from '@/lib/testimonials-service'
import { getMediaByIds } from '@/lib/media'
import TestimonialEditor, { emptyValues, type EditorValues } from '@/components/admin/TestimonialEditor'

export const dynamic = 'force-dynamic'

export default async function EditTestimonialPage({ params }: { params: { id: string } }) {
  const doc = await getTestimonialById(params.id)
  if (!doc) notFound()

  const imageId = doc.image ? String(doc.image) : ''
  const logoId = doc.companyLogo ? String(doc.companyLogo) : ''
  const wanted = [imageId, logoId].filter(Boolean)
  const resolved = await getMediaByIds(wanted)
  const urlById = new Map(resolved.map((m) => [m.id, m.url]))

  const initial: EditorValues = {
    ...emptyValues,
    name: doc.name ?? '',
    role: doc.role ?? '',
    company: doc.company ?? '',
    quote: doc.quote ?? '',
    image: imageId && urlById.has(imageId) ? { id: imageId, url: urlById.get(imageId) as string } : null,
    companyLogo: logoId && urlById.has(logoId) ? { id: logoId, url: urlById.get(logoId) as string } : null,
    featured: Boolean(doc.featured),
    published: Boolean(doc.published),
  }

  return <TestimonialEditor mode="edit" id={params.id} initial={initial} />
}
