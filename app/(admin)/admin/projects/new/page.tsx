import ProjectEditor, { emptyValues } from '@/components/admin/ProjectEditor'

export const dynamic = 'force-dynamic'

export default function NewProjectPage() {
  return <ProjectEditor mode="create" initial={emptyValues} />
}
