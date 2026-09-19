'use client'
import { useState } from 'react'
import { useEditor, EditorContent, type JSONContent, type Editor } from '@tiptap/react'
import { tiptapExtensions } from '@/lib/tiptap-extensions'
import MediaPicker from './MediaPicker'

function ToolbarButton({
  active, onClick, children,
}: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 text-sm transition-colors ${
        active ? 'bg-accent/20 text-accent-soft' : 'text-paper-dim hover:bg-ink-700 hover:text-paper'
      }`}
    >
      {children}
    </button>
  )
}

function Toolbar({ editor, onPickImage }: { editor: Editor; onPickImage: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-ink-600 p-2">
      <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></ToolbarButton>
      <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></ToolbarButton>
      <span className="mx-1 h-5 w-px bg-ink-600" />
      <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
      <ToolbarButton active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarButton>
      <span className="mx-1 h-5 w-px bg-ink-600" />
      <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</ToolbarButton>
      <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</ToolbarButton>
      <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>&ldquo; Quote</ToolbarButton>
      <ToolbarButton active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>&lt;/&gt;</ToolbarButton>
      <span className="mx-1 h-5 w-px bg-ink-600" />
      <ToolbarButton active={editor.isActive('link')} onClick={() => {
        const prev = editor.getAttributes('link').href as string | undefined
        const url = window.prompt('Link URL', prev || 'https://')
        if (url === null) return
        if (url === '') editor.chain().focus().extendMarkRange('link').unsetLink().run()
        else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
      }}>Link</ToolbarButton>
      <ToolbarButton onClick={onPickImage}>Image</ToolbarButton>
    </div>
  )
}

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: JSONContent | null
  onChange: (json: JSONContent) => void
}) {
  const [picking, setPicking] = useState(false)
  const editor = useEditor({
    extensions: tiptapExtensions,
    content: value ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: {
      attributes: {
        class: 'prose-dark min-h-[16rem] max-w-none px-4 py-3 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    immediatelyRender: false,
  })

  if (!editor) return null

  return (
    <div className="overflow-hidden rounded-lg border border-ink-600 bg-ink-900">
      <Toolbar editor={editor} onPickImage={() => setPicking(true)} />
      <EditorContent editor={editor} />
      {picking && (
        <MediaPicker
          folder="journal"
          onClose={() => setPicking(false)}
          onSelect={(m) => {
            editor.chain().focus().setImage({ src: m.url }).run()
            setPicking(false)
          }}
        />
      )}
    </div>
  )
}
