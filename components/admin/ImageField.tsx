'use client'
import { useState } from 'react'
import { Button, Field } from './ui'
import MediaPicker from './MediaPicker'

export type ImageValue = { id: string; url: string } | null

export default function ImageField({
  label,
  value,
  onChange,
  folder = 'uploads',
  hint,
}: {
  label: string
  value: ImageValue
  onChange: (v: ImageValue) => void
  folder?: string
  hint?: string
}) {
  const [picking, setPicking] = useState(false)
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink-600 bg-ink-900">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-paper-faint">None</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={() => setPicking(true)}>
            {value ? 'Change' : 'Choose'}
          </Button>
          {value && (
            <Button type="button" variant="ghost" onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
        </div>
      </div>
      {picking && (
        <MediaPicker
          folder={folder}
          onClose={() => setPicking(false)}
          onSelect={(m) => {
            onChange(m)
            setPicking(false)
          }}
        />
      )}
    </Field>
  )
}
