import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import PageHeader from '@/components/PageHeader'
import Reveal from '@/components/Reveal'
import { getPost, getPostSlugs } from '@/lib/content'
import { urlForImage } from '@/sanity/lib/image'
import { generateMetadata as genMeta, generateBreadcrumbSchema } from '@/lib/seo'

export async function generateStaticParams() {
  return (await getPostSlugs()).map((slug) => ({ slug }))
}

export const revalidate = 60 // ISR
export const dynamicParams = true

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return genMeta({ title: 'Post Not Found' })
  return genMeta({ title: post.title, description: post.excerpt, path: `/blog/${post.slug}` })
}

// Renderers for Sanity rich text (styled by .prose-dark wrapper).
const ptComponents: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      const url = urlForImage(value, 1400)
      if (!url) return null
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={url} alt={value?.alt || ''} className="my-8 w-full rounded-2xl border border-ink-600" />
    },
  },
}

// Minimal markdown → HTML for local fallback posts (headings, lists, paragraphs, inline code).
function renderMarkdown(md: string): string {
  const body = md.replace(/^\s*#\s+.*$/m, '')
  const lines = body.split('\n')
  const out: string[] = []
  let inList = false
  const closeList = () => {
    if (inList) {
      out.push('</ul>')
      inList = false
    }
  }
  const inline = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  for (const raw of lines) {
    const line = raw.trim()
    if (line.startsWith('# ')) {
      closeList()
      out.push(`<h2>${inline(line.slice(2))}</h2>`)
    } else if (line.startsWith('## ')) {
      closeList()
      out.push(`<h3>${inline(line.slice(3))}</h3>`)
    } else if (/^\d+\.\s/.test(line)) {
      if (!inList) {
        out.push('<ul>')
        inList = true
      }
      out.push(`<li>${inline(line.replace(/^\d+\.\s/, ''))}</li>`)
    } else if (line.startsWith('- ')) {
      if (!inList) {
        out.push('<ul>')
        inList = true
      }
      out.push(`<li>${inline(line.slice(2))}</li>`)
    } else if (line === '') {
      closeList()
    } else {
      closeList()
      out.push(`<p>${inline(line)}</p>`)
    }
  }
  closeList()
  return out.join('')
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Journal', url: '/blog' },
    { name: post.title, url: `/blog/${post.slug}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <PageHeader
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Journal', href: '/blog' }, { label: post.title }]}
        title={post.title}
      >
        <div className="flex flex-wrap items-center gap-3 text-sm text-paper-faint">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
          <span aria-hidden="true">·</span>
          <span>{post.readTime} read</span>
          <span aria-hidden="true">·</span>
          <span>By {post.author}</span>
        </div>
      </PageHeader>

      {post.coverUrl && (
        <section className="pb-12">
          <div className="container-px">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverUrl} alt={post.title} className="mx-auto aspect-[16/9] w-full max-w-3xl rounded-4xl border border-ink-600 object-cover" />
          </div>
        </section>
      )}

      <section className="pb-24">
        <div className="container-px">
          <Reveal as="article" className="prose-dark mx-auto max-w-3xl">
            {post.body ? (
              <PortableText value={post.body} components={ptComponents} />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content ?? '') }} />
            )}
          </Reveal>

          <div className="mx-auto mt-12 flex max-w-3xl flex-wrap gap-2 border-t border-ink-600 pt-8">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-ink-600 bg-ink-900 px-3 py-1 text-xs text-paper-dim">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-ink-600 py-24">
        <div className="container-px text-center">
          <Reveal as="div" className="mx-auto max-w-2xl">
            <h2 className="text-display-md text-gradient">Need help with your project?</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-paper-dim">
              We can help you build software that performs like the examples in this post.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="btn-accent">Get in touch</Link>
              <Link href="/blog" className="btn-ghost">Read more articles</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
