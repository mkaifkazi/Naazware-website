/**
 * Seeds 11 illustrative case studies + curated testimonials into Sanity.
 * All names, clients, and metrics are fictional/representative.
 * Re-runnable (deterministic _id + createOrReplace).
 * Run: npx tsx --env-file=.env.local scripts/seed-work.ts
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
    slug: 'dhaanya-crop-health-ai',
    title: 'AI crop-health diagnosis in nine languages',
    client: 'Dhaanya AgriTech',
    industry: 'AgriTech',
    excerpt:
      'An offline-first mobile app that diagnoses crop disease from a single photo and delivers vernacular advisory to 120,000 smallholder farmers.',
    challenge:
      'Smallholder farmers across India lose a fifth of their yield to crop disease that goes undiagnosed — agronomists are scarce, advice arrives too late, and rural connectivity is unreliable. Dhaanya needed something that would work in a field with no signal and in a language the farmer actually speaks.',
    solution:
      'We built an offline-first Android app with an on-device vision model that identifies 60+ crop diseases from a single leaf photo in under two seconds, paired with a vernacular advisory engine in nine languages. Diagnoses and treatment plans sync to a web dashboard when connectivity returns, giving Dhaanya’s agronomists oversight and a feedback loop to improve the model.',
    outcome:
      'Within fourteen months the app reached 120,000 farmers, who saw an average 38% reduction in crop loss. The vernacular, offline-first approach drove adoption far beyond projections in regions earlier ag-tech tools never reached.',
    metrics: [
      { value: '120K+', label: 'Farmers onboarded' },
      { value: '38%', label: 'Crop-loss reduction' },
      { value: '9', label: 'Languages supported' },
      { value: '<2s', label: 'Offline diagnosis' },
    ],
    technologies: ['React Native', 'TensorFlow Lite', 'Node.js', 'PostgreSQL', 'AWS'],
    testimonial: {
      quote:
        'They built something our farmers actually trust. Diagnoses work offline, in their own language, in seconds — adoption went further than we ever projected.',
      author: 'Ravi Deshmukh',
      role: 'Founder & CEO, Dhaanya AgriTech',
    },
    featured: true,
  },
  {
    slug: 'veramont-wealth-cockpit',
    title: 'A real-time portfolio cockpit for private wealth',
    client: 'Veramont Capital Partners',
    industry: 'FinTech',
    excerpt:
      'A web platform giving relationship managers a real-time, compliant view across $2.4B in private client portfolios.',
    challenge:
      'Veramont’s relationship managers were stitching together custodian statements in spreadsheets, so clients saw their positions days late and compliance reporting was a manual scramble. Scaling the book under that model was impossible.',
    solution:
      'We delivered a real-time analytics platform that aggregates live custodian and market feeds across asset classes, with scenario modelling, automated compliance and audit trails, and granular role-based access. Every figure a manager quotes is current and traceable.',
    outcome:
      'The platform now tracks $2.4B in assets under management, cut reporting time by 90%, and let each relationship manager handle a materially larger book without adding risk.',
    metrics: [
      { value: '$2.4B', label: 'Assets tracked' },
      { value: '-90%', label: 'Reporting time' },
      { value: '3.2×', label: 'RM productivity' },
      { value: '99.98%', label: 'Uptime' },
    ],
    technologies: ['Next.js', 'TypeScript', 'Python', 'PostgreSQL', 'Redis', 'Azure'],
    testimonial: {
      quote:
        'Our managers went from chasing spreadsheets to advising clients in real time. The platform paid for itself within two quarters.',
      author: 'Charlotte Tan',
      role: 'Chief Product Officer, Veramont Capital Partners',
    },
    featured: true,
  },
  {
    slug: 'arogya-tele-icu',
    title: 'Tele-ICU that brings specialists to tier-3 hospitals',
    client: 'Arogya Health Networks',
    industry: 'HealthTech',
    excerpt:
      'A remote patient-monitoring app connecting 40 small-town ICUs to city-based intensivists in real time.',
    challenge:
      'Small-town hospitals rarely have intensivists on staff, so critical patients are transferred hours away — time many of them don’t have. Arogya wanted to put a specialist at every bedside without physically moving the doctor.',
    solution:
      'We built a mobile and tablet app that streams live vitals from bedside monitors, supports secure low-bandwidth video consults, pushes deterioration alerts, and handles e-prescriptions — all resilient on the patchy bandwidth of a district hospital.',
    outcome:
      'Forty ICUs are now connected, with specialists responding in an average of four minutes. Across 60,000+ monitored patients, partner hospitals reported a 22% reduction in ICU mortality.',
    metrics: [
      { value: '40', label: 'ICUs connected' },
      { value: '4 min', label: 'Avg. specialist response' },
      { value: '60K+', label: 'Patients monitored' },
      { value: '22%', label: 'Mortality reduction' },
    ],
    technologies: ['Flutter', 'WebRTC', 'Go', 'FHIR', 'Google Cloud'],
    testimonial: {
      quote:
        'For the first time, a patient in a small-town ICU gets a specialist in minutes, not hours. The engineering here is genuinely life-saving.',
      author: 'Dr. Neha Iyer',
      role: 'Chief Medical Officer, Arogya Health Networks',
    },
    featured: true,
  },
  {
    slug: 'voltway-charging-platform',
    title: 'Charge-network operations and a driver app, unified',
    client: 'Voltway Mobility GmbH',
    industry: 'Mobility',
    excerpt:
      'An operations platform and consumer app for a 5,000-point EV charging network across Europe.',
    challenge:
      'Voltway’s chargers reported telemetry in fragmented formats, so the ops team learned about downtime from angry drivers — who in turn couldn’t tell which chargers actually worked before driving to them.',
    solution:
      'We built a real-time operations dashboard ingesting OCPP telemetry from every charger, plus a driver app with live availability, route planning around charging stops, and tap-to-charge payments. One source of truth for the team and the driver.',
    outcome:
      'Across 5,000 charge points, unplanned downtime fell 46% and the network now handles 380,000 sessions a month, with the driver app holding a 4.7-star rating.',
    metrics: [
      { value: '5,000', label: 'Charge points' },
      { value: '-46%', label: 'Charger downtime' },
      { value: '380K', label: 'Monthly sessions' },
      { value: '4.7★', label: 'App rating' },
    ],
    technologies: ['Next.js', 'React Native', 'OCPP', 'Kafka', 'Stripe', 'AWS'],
    testimonial: {
      quote:
        'They understood OCPP and the messy reality of hardware in the field. Charger downtime dropped almost in half after launch.',
      author: 'Lukas Brandt',
      role: 'VP Engineering, Voltway Mobility',
    },
    featured: true,
  },
  {
    slug: 'bharat-freight-routing',
    title: 'Mid-mile freight routing that fills empty trucks',
    client: 'Bharat Freight Solutions',
    industry: 'Logistics',
    excerpt:
      'A load-matching and route-optimization platform that cut empty-miles across a 2,200-truck network.',
    challenge:
      'A third of Bharat Freight’s trucks were running empty on return legs, burning fuel and margin. Dispatchers matched loads by phone and memory, leaving capacity and money on the table every day.',
    solution:
      'We built a routing and load-matching platform that optimizes multi-stop routes and back-hauls in real time using a constraint solver, surfacing the best load for every truck and lane to dispatchers in seconds.',
    outcome:
      'Empty-miles dropped 31% across the 2,200-truck network, saving an estimated ₹14 crore in fuel a year while matching 3,400 loads a day.',
    metrics: [
      { value: '2,200', label: 'Trucks in network' },
      { value: '-31%', label: 'Empty-miles' },
      { value: '₹14 Cr', label: 'Annual fuel saved' },
      { value: '3,400', label: 'Loads matched/day' },
    ],
    technologies: ['React', 'Node.js', 'Python (OR-Tools)', 'PostgreSQL', 'Mapbox'],
    testimonial: {
      quote:
        'Our dispatchers used to match loads from memory. Now the system fills trucks we’d have sent back empty — it changed our unit economics.',
      author: 'Arjun Malhotra',
      role: 'COO, Bharat Freight Solutions',
    },
    featured: false,
  },
  {
    slug: 'lumen-royalty-splits',
    title: 'Royalty splits and fan subscriptions for indie artists',
    client: 'Lumen Sound Inc.',
    industry: 'Media & Entertainment',
    excerpt:
      'A mobile app that automates royalty splits and powers fan subscriptions for 18,000 independent musicians.',
    challenge:
      'Independent artists fought constantly over who gets paid what, and manual royalty splits created disputes and support tickets that didn’t scale. Lumen wanted payments to simply disappear into the background.',
    solution:
      'We built a mobile app on a payments backbone that encodes each track’s collaborators and split percentages, then routes earnings automatically — including fan-subscription revenue — with transparent statements every artist can audit.',
    outcome:
      'The app now serves 18,000 artists, has paid out $9.6M with an average payout time of 48 hours, and drives $310K in recurring subscriber revenue every month.',
    metrics: [
      { value: '18K', label: 'Artists' },
      { value: '$9.6M', label: 'Paid out' },
      { value: '48h', label: 'Avg. payout time' },
      { value: '$310K', label: 'Subscriber MRR' },
    ],
    technologies: ['React Native', 'TypeScript', 'Node.js', 'Stripe Connect', 'PostgreSQL'],
    testimonial: {
      quote:
        'Payments and splits used to be our biggest support nightmare. Now it’s invisible — artists just get paid. That’s the whole game.',
      author: 'Maya Robinson',
      role: 'Head of Product, Lumen Sound',
    },
    featured: false,
  },
  {
    slug: 'nordic-marine-emissions',
    title: 'Fuel and emissions intelligence for a shipping fleet',
    client: 'Nordic Marine Systems AS',
    industry: 'Maritime',
    excerpt:
      'An IoT dashboard tracking fuel burn and CO₂ across 64 vessels to meet new EU emissions rules.',
    challenge:
      'Nordic Marine faced a hard EU emissions-reporting deadline with vessel data scattered across onboard systems and no fleet-wide view of fuel efficiency. Non-compliance meant fines; inefficiency meant losses.',
    solution:
      'We built an IoT platform that ingests engine and sensor telemetry from every vessel over satellite, models fuel efficiency per route and captain, and produces audit-ready EU MRV emissions reports from a single dashboard.',
    outcome:
      'Across 64 vessels processing 11 million data points a day, fuel costs fell 12% and the fleet sailed into the new regulation fully MRV-compliant.',
    metrics: [
      { value: '64', label: 'Vessels' },
      { value: '-12%', label: 'Fuel cost' },
      { value: 'EU MRV', label: 'Compliance-ready' },
      { value: '11M', label: 'Data points/day' },
    ],
    technologies: ['Next.js', 'TimescaleDB', 'Python', 'MQTT', 'Azure IoT'],
    testimonial: {
      quote:
        'We had a hard compliance deadline and complex vessel data. They delivered a dashboard our captains and our auditors both rely on.',
      author: 'Henrik Solberg',
      role: 'CTO, Nordic Marine Systems',
    },
    featured: true,
  },
  {
    slug: 'sukoon-mental-wellness',
    title: 'Vernacular mental wellness, judged by no one',
    client: 'Sukoon Wellness',
    industry: 'HealthTech',
    excerpt:
      'A stigma-free mental wellness app offering vernacular self-help and anonymous therapist sessions.',
    challenge:
      'Stigma and language kept millions from seeking mental-health support in India. Sukoon needed an experience that felt private, non-clinical, and available in the languages people think and feel in.',
    solution:
      'We built a mobile app with anonymous, encrypted therapist sessions, vernacular self-help journeys in six languages, mood tracking, and crisis safeguards — designed end to end to feel calm, private, and free of judgement.',
    outcome:
      'Sukoon reached 450,000 active users with 600+ therapists on the platform and an 89% session-completion rate — evidence that the right experience overcomes the stigma barrier.',
    metrics: [
      { value: '450K', label: 'Active users' },
      { value: '600+', label: 'Therapists' },
      { value: '6', label: 'Languages' },
      { value: '89%', label: 'Session completion' },
    ],
    technologies: ['Flutter', 'Node.js', 'WebRTC', 'MongoDB', 'Google Cloud'],
    testimonial: {
      quote:
        'They designed for trust first. People open up in the app because it feels private and speaks their language — that’s why it works.',
      author: 'Priya Nair',
      role: 'Co-founder, Sukoon Wellness',
    },
    featured: false,
  },
  {
    slug: 'forgeline-predictive-maintenance',
    title: 'Predictive maintenance for a smart factory floor',
    client: 'Forgeline Manufacturing Co.',
    industry: 'Manufacturing',
    excerpt:
      'An OEE and predictive-maintenance dashboard that cut unplanned downtime across nine production lines.',
    challenge:
      'Forgeline’s lines stopped without warning, and the team only learned why after the fact. Without a live view of equipment health, every breakdown was a costly surprise.',
    solution:
      'We instrumented nine lines with 2,800 sensors feeding a real-time OEE dashboard and a predictive model that flags machines drifting toward failure days in advance, so maintenance happens on a schedule instead of in a panic.',
    outcome:
      'Unplanned downtime dropped 37% and overall equipment effectiveness rose 14 points — turning the maintenance team from firefighters into planners.',
    metrics: [
      { value: '9', label: 'Production lines' },
      { value: '-37%', label: 'Unplanned downtime' },
      { value: '+14 pts', label: 'OEE gain' },
      { value: '2,800', label: 'Sensors' },
    ],
    technologies: ['React', 'Python', 'TensorFlow', 'TimescaleDB', 'Azure IoT'],
    testimonial: {
      quote:
        'We used to find out why a line stopped after it stopped. Now we see it coming days ahead. The downtime numbers speak for themselves.',
      author: 'David Whitaker',
      role: 'Director of Operations, Forgeline Manufacturing',
    },
    featured: false,
  },
  {
    slug: 'reserva-hospitality-suite',
    title: 'Revenue management and a guest app for boutique hotels',
    client: 'Reserva Hospitality Group',
    industry: 'Hospitality',
    excerpt:
      'A dynamic pricing engine and white-label guest app rolled out across 28 boutique properties.',
    challenge:
      'Reserva’s boutique hotels priced rooms on gut feel and depended on OTAs that ate their margins, while guests had no direct digital relationship with the brand.',
    solution:
      'We built a dynamic pricing engine that sets rates from demand, events, and competitor signals, plus a white-label guest app for direct booking, mobile check-in, and on-property services — shifting bookings away from the OTAs.',
    outcome:
      'Across 28 properties, revenue per available room rose 19%, direct bookings jumped 44%, and 72% of guests adopted the app.',
    metrics: [
      { value: '28', label: 'Properties' },
      { value: '+19%', label: 'RevPAR uplift' },
      { value: '+44%', label: 'Direct bookings' },
      { value: '72%', label: 'Guest app adoption' },
    ],
    technologies: ['Next.js', 'React Native', 'Python', 'PostgreSQL', 'Stripe'],
    testimonial: {
      quote:
        'We finally own our guest relationship instead of renting it from the OTAs. Direct bookings are up and our margins came back.',
      author: 'Sofia Marchetti',
      role: 'Chief Commercial Officer, Reserva Hospitality Group',
    },
    featured: false,
  },
  {
    slug: 'gyaan-adaptive-tutor',
    title: 'An adaptive AI tutor for JEE and NEET aspirants',
    client: 'Gyaan Labs',
    industry: 'EdTech',
    excerpt:
      'A mobile learning app whose AI tutor adapts practice to each student preparing for India’s toughest exams.',
    challenge:
      'Exam prep apps drowned students in identical question banks, ignoring what each learner actually struggled with. Gyaan wanted genuinely personalised practice at the scale of hundreds of thousands of aspirants.',
    solution:
      'We built a mobile app with an AI tutor that models each student’s weak concepts and adapts the next question accordingly, plus instant doubt-resolution grounded in the syllabus using retrieval-augmented generation so answers stay accurate.',
    outcome:
      'Across 260,000 students, average mock-test scores rose 23%, the tutor resolved 1.2 million doubts, and 78,000 students use it daily.',
    metrics: [
      { value: '260K', label: 'Students' },
      { value: '+23%', label: 'Avg. score lift' },
      { value: '1.2M', label: 'Doubts resolved' },
      { value: '78K', label: 'Daily active users' },
    ],
    technologies: ['React Native', 'Python', 'LLM (RAG)', 'PostgreSQL', 'AWS'],
    testimonial: {
      quote:
        'The AI tutor doesn’t feel bolted on — it adapts to each student. The score improvements convinced even our most skeptical parents.',
      author: 'Karthik Reddy',
      role: 'CEO, Gyaan Labs',
    },
    featured: true,
  },
]

// Curated testimonials for the homepage section (subset of the above).
const testimonialAuthors = [
  'Ravi Deshmukh',
  'Charlotte Tan',
  'Dr. Neha Iyer',
  'Lukas Brandt',
  'Maya Robinson',
  'Henrik Solberg',
  'Karthik Reddy',
]

async function run() {
  const tx = client.transaction()

  projects.forEach((p, i) =>
    tx.createOrReplace({
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

  // Replace homepage testimonials with ones drawn from the new case studies.
  const byAuthor = new Map(projects.map((p) => [p.testimonial.author, p.testimonial]))
  testimonialAuthors.forEach((author, i) => {
    const t = byAuthor.get(author)!
    tx.createOrReplace({
      _id: `testimonial-${i}`,
      _type: 'testimonial',
      quote: t.quote,
      author: t.author,
      role: t.role,
      order: i,
    } as never)
  })

  await tx.commit()
  console.log(`Seeded ${projects.length} case studies + ${testimonialAuthors.length} testimonials.`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
