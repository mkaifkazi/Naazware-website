// Central brand + contact configuration. Single source of truth for the studio.
export const site = {
  name: 'Naazware',
  legalName: 'Naazware',
  tagline: 'Custom software studio',
  description:
    'Naazware is a software studio. We design and build custom web, mobile, and desktop applications — engineered to perform and built to last.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://naazware.com',
  email: 'naazware@gmail.com',
  phone: '+91 9327356760',
  phoneHref: 'tel:+919327356760',
  location: 'Tandalja, Vadodara, Gujarat',
  socials: {
    linkedin: 'https://www.linkedin.com/in/mohammedkaifkazi/',
    twitter: 'https://x.com/KaifKazi10',
    github: 'https://github.com/Mkaifkazi',
  },
} as const

export const nav = [
  { href: '/work', label: 'Work' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Journal' },
  { href: '/contact', label: 'Contact' },
] as const
