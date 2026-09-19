import TestimonialEditor, { emptyValues } from '@/components/admin/TestimonialEditor'

export const dynamic = 'force-dynamic'

export default function NewTestimonialPage() {
  return <TestimonialEditor mode="create" initial={emptyValues} />
}
