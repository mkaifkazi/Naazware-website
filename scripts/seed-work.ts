/**
 * Resets Work + Testimonials in Sanity to a small, believable portfolio.
 * Deletes ALL existing project/testimonial docs, then creates the curated set.
 * Re-runnable. Run: npx tsx --env-file=.env.local scripts/seed-work.ts
 *
 * Note: Ripple / Shritica Joshi is a real client used with consent; the rest
 * are illustrative/fictional small-business projects.
 */
import { createClient } from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN
if (!projectId || !token) {
  console.error('Missing project id / write token in .env.local')
  process.exit(1)
}
const client = createClient({ projectId, dataset, apiVersion: '2024-06-01', token, useCdn: false })

let k = 0
const key = () => `k${(k++).toString(36)}`

type M = { value: string; label: string }
type Project = {
  slug: string
  title: string
  client: string
  industry: string
  excerpt: string
  challenge: string
  solution: string
  outcome: string
  metrics: M[]
  technologies: string[]
  testimonial: { quote: string; author: string; role: string }
  featured: boolean
}

const projects: Project[] = [
  {
    slug: 'ripple-preschool-app',
    title: 'Ripple — a pre-school app for parents and teachers',
    client: 'Shritica Joshi',
    industry: 'Education',
    excerpt:
      'A simple mobile app where pre-school teachers share daily activities, photos, and attendance — so parents always know how their child’s day went.',
    challenge:
      'Updates to parents were scattered across WhatsApp groups and paper diaries, and fee reminders went out by hand. Shritica wanted one calm, friendly place where parents could follow their child’s day and the team could stop juggling messages.',
    solution:
      'We built a clean mobile app with a daily activity feed (photos, meals, nap and mood notes), one-tap attendance for teachers, announcements, and gentle automated fee reminders. The whole experience was designed to feel warm and effortless for non-technical parents and busy staff.',
    outcome:
      'Parents now get a daily update they genuinely look forward to, and the team saves hours a week on admin and follow-ups. Onboarding new families takes minutes instead of a folder of forms.',
    metrics: [
      { value: '120+', label: 'Families connected' },
      { value: '4.8★', label: 'Parent rating' },
      { value: '6 hrs/wk', label: 'Admin time saved' },
    ],
    technologies: ['React Native', 'Firebase', 'Node.js'],
    testimonial: {
      quote:
        'Had a really great experience working with Naazware and the team. They understood exactly what our parents needed and built it without any fuss — and the parents absolutely love it.',
      author: 'Shritica Joshi',
      role: 'Founder, Ripple Pre-School',
    },
    featured: true,
  },
  {
    slug: 'bloom-dental-booking',
    title: 'A booking website that ended the phone-tag',
    client: 'Bloom Dental Studio',
    industry: 'Healthcare',
    excerpt:
      'A clean website with online appointment booking and automatic reminders for a busy neighbourhood dental clinic.',
    challenge:
      'The clinic ran entirely on phone calls — missed calls meant missed patients, and no-shows were a daily frustration. They needed patients to be able to book and reschedule themselves, around the clock.',
    solution:
      'We built a fast, modern website with real-time slot booking, automatic SMS and email reminders, and a simple admin view the front desk actually enjoys using. No app to install — it just works in the browser.',
    outcome:
      'Patients now book at any hour, the front desk spends far less time on the phone, and missed appointments dropped noticeably within the first month.',
    metrics: [
      { value: '+60%', label: 'Online bookings' },
      { value: '-40%', label: 'No-shows' },
      { value: '2 weeks', label: 'To launch' },
    ],
    technologies: ['Next.js', 'Node.js', 'PostgreSQL'],
    testimonial: {
      quote:
        'Smooth process from start to finish. Our booking site just works, and the team was super responsive whenever I needed a change.',
      author: 'Dr. Aarav Mehta',
      role: 'Owner, Bloom Dental Studio',
    },
    featured: false,
  },
  {
    slug: 'saffron-sage-cafe',
    title: 'A cafe website with menu and online orders',
    client: 'Saffron & Sage',
    industry: 'Food & Beverage',
    excerpt:
      'A warm, fast website with a live menu and online ordering for a popular neighbourhood cafe.',
    challenge:
      'The cafe relied on third-party delivery apps that ate into margins, and had no website of its own to show off the space, menu, or take direct orders.',
    solution:
      'We designed and built a beautiful, quick-loading website with an easy-to-update menu, photo gallery, and direct online ordering for pickup — giving the cafe a home of its own that the owner can update herself.',
    outcome:
      'Direct orders climbed steadily as regulars switched away from the delivery apps, and the cafe finally has an online presence that matches the room.',
    metrics: [
      { value: '3×', label: 'Direct orders' },
      { value: '+35%', label: 'Repeat customers' },
      { value: '<1.5s', label: 'Page load' },
    ],
    technologies: ['Next.js', 'Tailwind CSS', 'Sanity', 'Stripe'],
    testimonial: {
      quote:
        'Naazware built exactly what we imagined for the cafe. Friendly team, no jargon, and they delivered on time. We finally have a site we’re proud of.',
      author: 'Meera Kulkarni',
      role: 'Owner, Saffron & Sage',
    },
    featured: true,
  },
  {
    slug: 'fitnest-gym-app',
    title: 'A member app for a boutique gym',
    client: 'FitNest Studio',
    industry: 'Fitness',
    excerpt:
      'A simple mobile app for class booking, attendance, and workout plans at a boutique fitness studio.',
    challenge:
      'Class spots were booked over phone and DMs, leading to double-bookings and no-shows, and members had nowhere to see their schedule or plans.',
    solution:
      'We built an easy mobile app where members book and cancel classes, check in with a tap, and follow their assigned workout plans — plus a lightweight dashboard for trainers to manage the timetable.',
    outcome:
      'Class management runs itself now, members show up more reliably, and the studio looks a step more professional to anyone who walks in.',
    metrics: [
      { value: '800+', label: 'Active members' },
      { value: '4.7★', label: 'App rating' },
      { value: '+25%', label: 'Class attendance' },
    ],
    technologies: ['Flutter', 'Firebase'],
    testimonial: {
      quote:
        'Genuinely good to work with. The app is clean, our members find it easy, and support has been great even after launch.',
      author: 'Rohan Patel',
      role: 'Founder, FitNest Studio',
    },
    featured: true,
  },
  {
    slug: 'threadhouse-boutique-store',
    title: 'An online store for a clothing boutique',
    client: 'Threadhouse',
    industry: 'Retail',
    excerpt:
      'A clean, mobile-friendly online store with simple inventory and checkout for an independent fashion boutique.',
    challenge:
      'The boutique sold only in-store and over Instagram DMs, which didn’t scale and made checkout clumsy for customers who wanted to buy from home.',
    solution:
      'We built a tidy, fast online store with easy product management, secure checkout, and a look that matches the brand — so the owner can add products and run the shop without any technical help.',
    outcome:
      'Online sales now run alongside the store, customers can buy in a couple of taps, and the boutique reaches shoppers well beyond its neighbourhood.',
    metrics: [
      { value: '+48%', label: 'Online sales' },
      { value: '320', label: 'Products listed' },
      { value: '2 taps', label: 'To checkout' },
    ],
    technologies: ['Next.js', 'Sanity', 'Stripe'],
    testimonial: {
      quote:
        'Loved working with the team. They were patient with all my ideas and the store looks beautiful. Sales have picked up since we launched.',
      author: 'Ananya Sharma',
      role: 'Founder, Threadhouse',
    },
    featured: false,
  },
  {
    slug: 'vidya-tuitions-app',
    title: 'An app to run a local tuition centre',
    client: 'Vidya Tuitions',
    industry: 'Education',
    excerpt:
      'A simple app for attendance, test scores, and parent updates at a growing local coaching centre.',
    challenge:
      'Attendance, fees, and test results were tracked in registers, and keeping parents informed meant endless individual messages. It didn’t scale as the centre grew.',
    solution:
      'We built a straightforward app where teachers mark attendance and enter test scores, fees are tracked automatically, and parents get regular progress updates — all in one place.',
    outcome:
      'The centre runs on far less paperwork, parents feel more involved, and the director can see how every batch is doing at a glance.',
    metrics: [
      { value: '500+', label: 'Students' },
      { value: '15', label: 'Batches managed' },
      { value: '4 hrs/wk', label: 'Admin saved' },
    ],
    technologies: ['React Native', 'Firebase'],
    testimonial: {
      quote:
        'Very happy with the work. They simplified everything for us and the parents really appreciate the regular updates.',
      author: 'Sandeep Verma',
      role: 'Director, Vidya Tuitions',
    },
    featured: false,
  },
]

async function run() {
  // Clean slate: remove any previously-seeded work + testimonials.
  await client.delete({ query: '*[_type == "project"]' })
  await client.delete({ query: '*[_type == "testimonial"]' })

  const tx = client.transaction()

  projects.forEach((p, i) =>
    tx.create({
      _id: `project-${p.slug}`,
      _type: 'project',
      title: p.title,
      slug: { _type: 'slug', current: p.slug },
      client: p.client,
      industry: p.industry,
      excerpt: p.excerpt,
      challenge: p.challenge,
      solution: p.solution,
      outcome: p.outcome,
      metrics: p.metrics.map((m) => ({ _key: key(), ...m })),
      technologies: p.technologies,
      testimonial: p.testimonial,
      featured: p.featured,
      order: i,
    } as never)
  )

  projects.forEach((p, i) =>
    tx.create({
      _id: `testimonial-${i}`,
      _type: 'testimonial',
      quote: p.testimonial.quote,
      author: p.testimonial.author,
      role: p.testimonial.role,
      order: i,
    } as never)
  )

  await tx.commit()
  console.log(`Reset Work: ${projects.length} case studies + ${projects.length} testimonials.`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
