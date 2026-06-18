import { Metadata } from 'next'
import Link from 'next/link'
import PageHeader from '@/components/PageHeader'
import Reveal from '@/components/Reveal'
import { getPublishedPosts } from '@/lib/blog-posts-data'
import { generateMetadata as genMeta } from '@/lib/seo'

export const metadata: Metadata = genMeta({
  title: 'Journal',
  description:
    'Notes on design, performance, and building better websites — no fluff, just useful insight.',
  path: '/blog',
})

export default function BlogPage() {
  const posts = getPublishedPosts()

  return (
    <>
      <PageHeader
        eyebrow="Journal"
        size="lg"
        title={
          <>
            Notes from <span className="text-gradient">the studio.</span>
          </>
        }
        subtitle="Insights and practical guides on design, performance, and building better websites."
      />

      <section className="pb-24 md:pb-32">
        <div className="container-px grid gap-6 md:grid-cols-2">
          {posts.map((post, i) => (
            <Reveal key={post.slug} delay={(i % 2) * 100}>
              <article className="group relative flex h-full flex-col rounded-4xl border border-ink-600 bg-ink-800/50 p-8 transition-all duration-500 ease-out-expo hover:-translate-y-1 hover:border-accent/40">
                <div className="flex items-center gap-3 text-sm text-paper-faint">
                  <time dateTime={post.date}>
                    {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span>{post.readTime} read</span>
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-paper transition-colors group-hover:text-accent-soft">
                  <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-3 flex-1 leading-relaxed text-paper-dim">{post.excerpt}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-ink-600 bg-ink-900 px-3 py-1 text-xs text-paper-dim">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  )
}
