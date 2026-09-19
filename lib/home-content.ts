// Home page copy + section data. SMB / local-business voice, plain English,
// outcome-led. Draft — the user edits. Keep proof CMS-driven (no fabricated claims).

export const HOME_SECTION_ORDER = [
  'hero',
  'problem',
  'services',
  'proof',
  'process',
  'cta',
] as const

export type SectionHead = {
  eyebrow: string
  heading: string
  ctaLabel?: string
  ctaHref?: string
}

export const hero = {
  eyebrow: 'Digital studio for growing businesses',
  headline: 'Websites & software that win you customers.',
  sub: 'We design, build, and run the digital side of your business — so you get more enquiries, look the part, and stay ahead of your local competition.',
  primaryCta: { label: 'Get a free quote', href: '/contact' },
  secondaryCta: { label: 'See our work', href: '/work' },
  capabilities: ['Websites', 'Web & mobile apps', 'Branding', 'Care & hosting'],
}

export const problem = {
  eyebrow: 'The problem',
  heading: 'Your website should be your best salesperson.',
  intro:
    'Most business websites quietly cost their owners customers every day. If any of this sounds familiar, you are leaving money on the table.',
  points: [
    {
      title: 'It looks dated',
      body: 'A slow, cluttered, or DIY-builder site makes a great business look small — and sends buyers straight to a competitor.',
    },
    {
      title: 'It brings no enquiries',
      body: 'Pretty is not the point. If your site is not turning visitors into calls and messages, it is just an expensive brochure.',
    },
    {
      title: 'It is a headache to run',
      body: 'You should not need a developer to change a price or add a photo. Most owners are stuck waiting — or paying — for tiny edits.',
    },
  ],
}

export const sections: Record<'services' | 'proof' | 'process' | 'testimonials', SectionHead> = {
  services: {
    eyebrow: 'What we do',
    heading: 'Everything you need to grow online, under one roof.',
    ctaLabel: 'All services',
    ctaHref: '/services',
  },
  proof: {
    eyebrow: 'Proof',
    heading: 'Real work. Real results.',
    ctaLabel: 'All projects',
    ctaHref: '/work',
  },
  process: {
    eyebrow: 'How it works',
    heading: 'A simple path from first chat to launch.',
  },
  testimonials: {
    eyebrow: 'Kind words',
    heading: 'Businesses that would work with us again.',
  },
}

export const process = [
  {
    no: '01',
    title: 'Talk',
    body: 'A free, no-jargon chat about your business, your goals, and what a better website or app could do for you.',
  },
  {
    no: '02',
    title: 'Plan',
    body: 'We map out exactly what you get, what it costs, and when it launches — in plain English, before any work starts.',
  },
  {
    no: '03',
    title: 'Build',
    body: 'We design and build in the open, showing you real screens as we go, so there are no surprises at the end.',
  },
  {
    no: '04',
    title: 'Launch & grow',
    body: 'We go live, keep it fast and secure, and are here whenever you need a change or want to do more.',
  },
]

export const cta = {
  heading: 'Ready to grow your business online?',
  body: 'Tell us what you need. We reply within 1 business day with honest advice, a clear plan, and a price — no pressure.',
  primary: { label: 'Get a free quote', href: '/contact' },
}
