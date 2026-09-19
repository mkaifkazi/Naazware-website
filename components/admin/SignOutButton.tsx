import { signOut } from '@/auth'

export default function SignOutButton() {
  return (
    <form
      action={async () => {
        'use server'
        await signOut({ redirectTo: '/admin/login' })
      }}
    >
      <button
        type="submit"
        className="rounded-lg px-3 py-2 text-sm text-paper-dim transition-colors hover:bg-ink-700 hover:text-paper"
      >
        Sign out
      </button>
    </form>
  )
}
