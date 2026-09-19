'use client'
import { forwardRef, useState, type ReactNode } from 'react'

// ── Button ──────────────────────────────────────────────
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
}
export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:pointer-events-none'
  const styles = {
    primary: 'bg-accent text-accent-contrast hover:opacity-90',
    ghost: 'border border-ink-600 text-paper-dim hover:bg-ink-700 hover:text-paper',
    danger: 'border border-red-500/40 text-red-400 hover:bg-red-500/10',
  }[variant]
  return <button className={`${base} ${styles} ${className}`} {...props} />
}

// ── Field wrapper ───────────────────────────────────────
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-paper-dim">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-paper-faint">{hint}</span>}
    </label>
  )
}

const inputCls =
  'w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-paper outline-none transition-colors focus:border-accent placeholder:text-paper-faint'

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = '', ...props }, ref) {
    return <input ref={ref} className={`${inputCls} ${className}`} {...props} />
  }
)

export const TextArea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className = '', rows = 4, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={`${inputCls} resize-y ${className}`} {...props} />
  }
)

export function Select({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${inputCls} ${className}`} {...props}>
      {children}
    </select>
  )
}

// ── Toggle ──────────────────────────────────────────────
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2"
      aria-pressed={checked}
    >
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-ink-600'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </span>
      {label && <span className="text-sm text-paper-dim">{label}</span>}
    </button>
  )
}

// ── TagInput ────────────────────────────────────────────
export function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const t = draft.trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setDraft('')
  }
  return (
    <div className="rounded-lg border border-ink-600 bg-ink-900 p-2">
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-ink-700 px-2 py-1 text-xs text-paper">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} className="text-paper-faint hover:text-paper">
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add()
            }
          }}
          onBlur={add}
          placeholder={placeholder || 'Add…'}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm text-paper outline-none placeholder:text-paper-faint"
        />
      </div>
    </div>
  )
}
