import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import type { Extensions } from '@tiptap/core'

// Single source of truth for the editor schema. Imported by both the client
// editor (RichTextEditor) and the server serializer (posts-service), so what
// the admin edits and what the public renders can never drift.
export const tiptapExtensions: Extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
  }),
  Link.configure({ openOnClick: false, autolink: true }),
  Image,
]
