/**
 * One-time migration: pushes existing local content (testimonials, posts,
 * case studies) into Sanity. Safe to re-run — uses deterministic _id values
 * with createOrReplace, so it updates instead of duplicating.
 *
 * Run:  npm run seed   (after filling SANITY_API_WRITE_TOKEN + project id in .env.local)
 */
import { createClient } from '@sanity/client'
import { caseStudies } from '../lib/case-studies-data'
import { blogPosts } from '../lib/blog-posts-data'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !token) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN. Add them to .env.local first.')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion: '2024-06-01', token, useCdn: false })

// crude but adequate key generator (Sanity requires _key on array items)
let k = 0
const key = () => `k${(k++).toString(36)}${Date.now().toString(36)}`

// Minimal markdown -> Portable Text (headings, lists, paragraphs, **bold**, `code`).
function mdToPortableText(md: string) {
  const body = md.replace(/^\s*#\s+.*$/m, '') // drop leading H1 (title shown separately)
  const blocks: unknown[] = []
  const spansFor = (text: string) => {
    const spans: { _type: 'span'; _key: string; text: string; marks: string[] }[] = []
    const re = /(\*\*([^*]+)\*\*|`([^`]+)`)/g
    let last = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      if (m.index > last) spans.push({ _type: 'span', _key: key(), text: text.slice(last, m.index), marks: [] })
      if (m[2] != null) spans.push({ _type: 'span', _key: key(), text: m[2], marks: ['strong'] })
      else if (m[3] != null) spans.push({ _type: 'span', _key: key(), text: m[3], marks: ['code'] })
      last = m.index + m[0].length
    }
    if (last < text.length) spans.push({ _type: 'span', _key: key(), text: text.slice(last), marks: [] })
    return spans.length ? spans : [{ _type: 'span', _key: key(), text, marks: [] }]
  }
  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('## ')) blocks.push({ _type: 'block', _key: key(), style: 'h3', markDefs: [], children: spansFor(line.slice(3)) })
    else if (line.startsWith('# ')) blocks.push({ _type: 'block', _key: key(), style: 'h2', markDefs: [], children: spansFor(line.slice(2)) })
    else if (line.startsWith('- ') || /^\d+\.\s/.test(line))
      blocks.push({ _type: 'block', _key: key(), style: 'normal', listItem: 'bullet', level: 1, markDefs: [], children: spansFor(line.replace(/^(-\s|\d+\.\s)/, '')) })
    else blocks.push({ _type: 'block', _key: key(), style: 'normal', markDefs: [], children: spansFor(line) })
  }
  return blocks
}

async function run() {
  const docs: Record<string, unknown>[] = []

  // Testimonials (the three from the site)
  const testimonials = [
    { quote: 'The new checkout flow paid for itself in the first month. Our customers love how fast and simple it is.', author: 'Sarah Chen', role: 'Director of E-commerce, RetailCo' },
    { quote: 'Security and accessibility were both critical. The team delivered on both without compromise.', author: 'Dr. Michael Torres', role: 'CTO, MediHealth' },
    { quote: "Our drivers actually love using this app. That's never happened before.", author: 'James Park', role: 'Operations Manager, QuickShip' },
  ]
  testimonials.forEach((t, i) =>
    docs.push({ _id: `testimonial-${i}`, _type: 'testimonial', order: i, ...t })
  )

  // Projects / case studies
  caseStudies.forEach((c, i) =>
    docs.push({
      _id: `project-${c.slug}`,
      _type: 'project',
      title: c.title,
      slug: { _type: 'slug', current: c.slug },
      client: c.client,
      industry: c.industry,
      excerpt: c.excerpt,
      challenge: c.challenge,
      solution: c.solution,
      outcome: c.outcome,
      metrics: c.metrics.map((m) => ({ _key: key(), ...m })),
      technologies: c.technologies,
      testimonial: c.testimonial,
      featured: c.featured,
      order: i,
    })
  )

  // Journal posts
  blogPosts.forEach((p) =>
    docs.push({
      _id: `post-${p.slug}`,
      _type: 'post',
      title: p.title,
      slug: { _type: 'slug', current: p.slug },
      excerpt: p.excerpt,
      author: p.author,
      date: p.date,
      readTime: p.readTime,
      tags: p.tags,
      body: mdToPortableText(p.content),
      published: p.published,
    })
  )

  const tx = client.transaction()
  docs.forEach((d) => tx.createOrReplace(d as never))
  await tx.commit()
  console.log(`Seeded ${docs.length} documents (${testimonials.length} testimonials, ${caseStudies.length} projects, ${blogPosts.length} posts).`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
