import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import Reveal from '@/components/Reveal'
import SilkBackground from '@/components/visual/SilkBackground'
import Accents from '@/components/visual/Accents'
import CardGridReveal from '@/components/motion/CardGridReveal'
import CtaReveal from '@/components/motion/CtaReveal'
import MediaReveal from '@/components/motion/MediaReveal'
import { getPost, getPostSlugs, getRelatedPosts } from '@/lib/content'
import { generateMetadata as genMeta, generateBreadcrumbSchema, generateArticleSchema } from '@/lib/seo'

export async function generateStaticParams() {
  return (await getPostSlugs()).map((slug) => ({ slug }))
}

export const revalidate = 60 // ISR
export const dynamicParams = true

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return genMeta({ title: 'Post Not Found', noindex: true })
  return genMeta({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    type: 'article',
    publishedTime: post.date,
    image: post.coverUrl || undefined,
  })
}

// Minimal markdown → HTML for post bodies (headings, lists, paragraphs, inline code).
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

  const related = await getRelatedPosts(post.slug, post.tags)

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Journal', url: '/blog' },
    { name: post.title, url: `/blog/${post.slug}` },
  ])

  const articleSchema = generateArticleSchema({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.coverUrl,
    datePublished: post.date,
    author: post.author,
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <div className="relative overflow-hidden">
      <SilkBackground composition={{ angle: 120, intensity: 0.45 }} />
      <div className="relative z-10">

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
            <MediaReveal className="mx-auto max-w-3xl overflow-hidden rounded-4xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.coverUrl} alt={post.title} className="aspect-[16/9] w-full rounded-4xl border border-ink-600 object-cover" />
            </MediaReveal>
          </div>
        </section>
      )}

      <section className="pb-24">
        <div className="container-px">
          <Reveal as="article" className="prose-dark mx-auto max-w-3xl">
            <div dangerouslySetInnerHTML={{ __html: post.contentHtml || renderMarkdown(post.content ?? '') }} />
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

      {related.length > 0 && (
        <section className="border-t border-ink-600 py-20">
          <div className="container-px">
            <h2 className="text-sm font-medium uppercase tracking-wider text-paper-dim">Related reading</h2>
            <CardGridReveal className="mt-8 grid gap-6 md:grid-cols-3">
              {related.map((r) => (
                <article
                  key={r.slug}
                  className="group relative flex h-full flex-col rounded-3xl border border-ink-600 bg-ink-800/50 p-6 transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:border-accent/40"
                >
                  <div className="flex flex-wrap gap-2">
                    {r.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-full border border-ink-600 bg-ink-900 px-2.5 py-0.5 text-xs text-paper-dim">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold leading-snug text-paper transition-colors group-hover:text-accent-soft">
                    <Link href={`/blog/${r.slug}`} className="after:absolute after:inset-0">
                      {r.title}
                    </Link>
                  </h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-paper-dim">{r.excerpt}</p>
                  <span className="mt-4 text-sm text-paper-faint">{r.readTime} read</span>
                </article>
              ))}
            </CardGridReveal>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden border-t border-ink-600 py-24">
        <Accents preset="cta" />
        <div className="container-px relative z-10 text-center">
          <CtaReveal className="mx-auto max-w-2xl">
            <h2 className="text-display-md text-gradient">Need help with your project?</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-paper-dim">
              We can help you build software that performs like the examples in this post.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="btn-accent">Get in touch</Link>
              <Link href="/blog" className="btn-ghost">Read more articles</Link>
            </div>
          </CtaReveal>
        </div>
      </section>
      </div>
      </div>
    </>
  )
}
