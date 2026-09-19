import PostEditor, { emptyValues } from '@/components/admin/PostEditor'

export const dynamic = 'force-dynamic'

export default function NewPostPage() {
  return <PostEditor mode="create" initial={emptyValues} />
}
