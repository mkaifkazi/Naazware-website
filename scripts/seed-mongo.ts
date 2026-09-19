/**
 * Reseed illustrative content into MongoDB. Idempotent: upserts by slug (projects/posts)
 * and by name+order (testimonials), so re-running updates instead of duplicating.
 *
 * Run:  npm run seed:mongo   (requires MONGODB_URI in .env.local)
 */
import { connectDb } from '../lib/db'
import { Project } from '../lib/models/Project'
import { Post } from '../lib/models/Post'
import { Testimonial } from '../lib/models/Testimonial'
import { caseStudies } from '../lib/case-studies-data'
import { blogPosts } from '../lib/blog-posts-data'
import { testimonialsData } from '../lib/testimonials-data'
import mongoose from 'mongoose'

async function main() {
  await connectDb()

  for (const c of caseStudies) {
    await Project.updateOne(
      { slug: c.slug },
      {
        $set: {
          title: c.title,
          slug: c.slug,
          client: c.client,
          industry: c.industry,
          shortDescription: c.excerpt,
          challenge: c.challenge,
          solution: c.solution,
          outcome: c.outcome,
          metrics: c.metrics,
          technologies: c.technologies,
          testimonial: c.testimonial,
          featured: c.featured,
          status: 'published',
        },
      },
      { upsert: true }
    )
  }
  console.log(`Seeded ${caseStudies.length} projects`)

  for (const p of blogPosts) {
    await Post.updateOne(
      { slug: p.slug },
      {
        $set: {
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          author: p.author,
          publishDate: new Date(p.date),
          readTime: p.readTime,
          tags: p.tags,
          contentMarkdown: p.content,
          status: p.published ? 'published' : 'draft',
        },
      },
      { upsert: true }
    )
  }
  console.log(`Seeded ${blogPosts.length} posts`)

  for (const t of testimonialsData) {
    await Testimonial.updateOne(
      { name: t.name, order: t.order },
      { $set: { name: t.name, role: t.role, company: t.company, quote: t.quote, order: t.order, published: true } },
      { upsert: true }
    )
  }
  console.log(`Seeded ${testimonialsData.length} testimonials`)

  await mongoose.disconnect()
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
