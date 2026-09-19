import Link from 'next/link'
import { listTestimonials } from '@/lib/testimonials-service'
import TestimonialsTable, { type TestimonialRow } from '@/components/admin/TestimonialsTable'

export const dynamic = 'force-dynamic'

export default async function TestimonialsPage() {
  const rows = await listTestimonials()
  const initial: TestimonialRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    company: r.company,
    quote: r.quote,
    featured: r.featured,
    published: r.published,
    order: r.order,
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : '',
  }))
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-paper">Testimonials</h1>
          <p className="mt-1 text-sm text-paper-dim">Manage client quotes shown on the site.</p>
        </div>
        <Link
          href="/admin/testimonials/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-contrast hover:opacity-90"
        >
          New testimonial
        </Link>
      </div>
      <div className="mt-8">
        <TestimonialsTable initial={initial} />
      </div>
    </div>
  )
}
