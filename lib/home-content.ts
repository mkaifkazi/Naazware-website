// Home page copy + section data. Plain English, craft/quality-led — we sell
// custom, well-built software (not customer/sales-increase promises). Draft — the
// user edits. Keep proof CMS-driven (no fabricated claims).

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
  eyebrow: 'Custom software studio',
  headline: 'Custom software, crafted to fit.',
  sub: 'We design and build websites, web, and mobile apps tailored to how you actually work — engineered for quality, reliability, and the long run.',
  primaryCta: { label: 'Start a project', href: '/contact' },
  secondaryCta: { label: 'See our work', href: '/work' },
  capabilities: ['Websites', 'Web & mobile apps', 'Branding', 'Care & hosting'],
}

export const problem = {
  eyebrow: 'Why custom',
  heading: 'Off-the-shelf rarely fits.',
  intro:
    'Templates and quick builds get you something that looks fine — until it fights how your business actually runs. Well-built, tailored software should feel the opposite.',
  points: [
    {
      title: 'Built to a template, not to you',
      body: 'Generic builders force your business into someone else’s mould. Custom software is shaped around your workflow, your data, and your users.',
    },
    {
      title: 'Corners cut, debt later',
      body: 'Cheap-and-fast leaves you with brittle code that breaks and slows down. We build it properly the first time — tested, maintainable, made to last.',
    },
    {
      title: 'Hard to change or own',
      body: 'You shouldn’t be locked out of your own product. We build clean, documented software you can grow, hand over, or extend whenever you need.',
    },
  ],
}

export const sections: Record<'services' | 'proof' | 'process' | 'testimonials', SectionHead> = {
  services: {
    eyebrow: 'What we do',
    heading: 'Custom-built, end to end, done well.',
    ctaLabel: 'All services',
    ctaHref: '/services',
  },
  proof: {
    eyebrow: 'Proof',
    heading: 'Work we’re proud of.',
    ctaLabel: 'All projects',
    ctaHref: '/work',
  },
  process: {
    eyebrow: 'How it works',
    heading: 'A clear path from first chat to launch.',
  },
  testimonials: {
    eyebrow: 'Kind words',
    heading: 'Clients who’d work with us again.',
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
  heading: 'Ready to build something great?',
  body: 'Tell us what you need. We’ll reply within 1 business day with honest advice, a clear plan, and a fair price — no pressure.',
  primary: { label: 'Start a project', href: '/contact' },
}
