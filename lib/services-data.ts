export interface Service {
  slug: string
  title: string
  shortDescription: string
  bullets: string[]
  icon: string
  fullDescription: string
  challenge: string
  approach: string
  result: string
  technologies: string[]
  keywords: string[]
}

export const services: Service[] = [
  {
    slug: 'web-development',
    title: 'Web Application Development',
    shortDescription: 'A fast, modern website or web app that turns visitors into enquiries — and makes your business look established and easy to deal with.',
    bullets: [
      'More enquiries from a site that loads instantly',
      'Looks sharp on every phone, tablet, and screen',
      'Easy to update — no developer needed for small changes',
    ],
    icon: 'web',
    fullDescription:
      'We build fast, reliable web applications that solve real problems. From single-page apps to complex dashboards, we focus on clean code and user experience.',
    challenge:
      'Most web apps fail because they prioritize features over performance and maintainability. Users expect instant load times and smooth interactions.',
    approach:
      'We use modern frameworks like Next.js and React with server-side rendering where it matters. Every component is tested, every API call is optimized, and every deployment is automated.',
    result:
      'Typical projects launch in 8–12 weeks with 90+ Lighthouse performance scores. Our clients see 60% faster load times and 40% higher conversion rates.',
    technologies: ['Next.js', 'React.js', 'TypeScript', 'Redux Toolkit', 'Material UI', 'Tailwind CSS'],
    keywords: [
      'web application development',
      'single page application',
      'progressive web app',
      'React development',
      'Next.js development',
    ],
  },
  {
    slug: 'mobile-development',
    title: 'Mobile App Development',
    shortDescription: 'A mobile app your customers actually keep and use — putting your business in their pocket on both iPhone and Android.',
    bullets: [
      'One app that reaches every customer, iPhone and Android',
      'We handle App Store and Play Store, launch to live',
      'Works even offline, so it never leaves them stuck',
    ],
    icon: 'mobile',
    fullDescription:
      'Build mobile apps that users love. We handle everything from design to deployment, whether you need native iOS/Android or cross-platform solutions.',
    challenge:
      'Mobile users expect apps to work instantly, even offline. Poor performance or buggy releases damage trust permanently.',
    approach:
      'We use React Native for cross-platform speed or native Swift/Kotlin when performance is critical. Every app includes offline support, crash reporting, and analytics from day one.',
    result:
      'Apps typically launch in 10–14 weeks with 4.5+ star ratings. Our optimization process reduces app size by 40% and improves startup time by 50%.',
    technologies: ['React Native', 'TypeScript', 'Redux Toolkit', 'React Query', 'Jest'],
    keywords: [
      'mobile app development',
      'iOS development',
      'Android development',
      'React Native',
      'cross-platform mobile',
    ],
  },
  {
    slug: 'desktop-development',
    title: 'Desktop App Development',
    shortDescription: 'A desktop tool your team relies on every day — fast, dependable software that fits how your business actually works.',
    bullets: [
      'Runs on Windows, macOS, and Linux — one build for all',
      'Keeps working offline, with your data stored locally',
      'Fits into the tools and systems you already use',
    ],
    icon: 'desktop',
    fullDescription:
      'Desktop apps for serious work. We build tools that professionals rely on every day, with native performance and deep system integration.',
    challenge:
      'Desktop users demand reliability and native feel. Web-wrapped apps feel sluggish and lack proper keyboard shortcuts or system integration.',
    approach:
      'We build with Electron for cross-platform reach or native technologies when performance is critical. Every app includes proper installer, auto-updates, and crash reporting.',
    result:
      'Desktop apps ship in 10–16 weeks depending on complexity. Our apps use 50% less memory than typical Electron apps and feel truly native.',
    technologies: ['Electron', 'React.js', 'TypeScript', 'Redux Toolkit', 'Styled Components'],
    keywords: [
      'desktop app development',
      'Electron development',
      'cross-platform desktop',
      'Windows app',
      'macOS app',
    ],
  },
  {
    slug: 'domain-hosting',
    title: 'Domain & Hosting',
    shortDescription: 'Your site online, fast, and secure — without you ever thinking about servers, domains, or the "not secure" warning.',
    bullets: [
      'Loads fast for customers wherever they are',
      'Locked-down and secure, with the padlock, automatically',
      'Stays online — we handle domains, hosting, and updates',
    ],
    icon: 'server',
    fullDescription:
      'Reliable hosting that just works. We handle domains, SSL, CDN, and deployments so you can focus on your business.',
    challenge:
      'Most hosting setups are overcomplicated or unreliable. Manual deployments lead to errors and downtime costs money.',
    approach:
      'We use modern platforms like Vercel, Netlify, or AWS with automated deployments from Git. Every commit is tested and deployed automatically with zero downtime.',
    result:
      '99.9% uptime guaranteed. Deployments happen in under 2 minutes. Global CDN ensures fast load times worldwide.',
    technologies: ['AWS (S3, EC2)', 'Microsoft Azure', 'Docker', 'GitHub Actions', 'Bitbucket Pipelines'],
    keywords: [
      'web hosting',
      'domain registration',
      'managed hosting',
      'CDN',
      'SSL certificate',
      'CI/CD',
    ],
  },
  {
    slug: 'qa-testing',
    title: 'QA & Testing',
    shortDescription: 'Software your customers can trust — we find the bugs before they do, so launches are smooth and your reputation stays intact.',
    bullets: [
      'Fewer bugs reaching your customers',
      'Tested on real phones and devices, not just in theory',
      'Checked for speed and security before every release',
    ],
    icon: 'test',
    fullDescription:
      'Catch bugs before your users do. We build comprehensive test coverage and run real-world QA on every release.',
    challenge:
      "Most bugs reach production because testing is manual and inconsistent. Security vulnerabilities go unnoticed until it's too late.",
    approach:
      'We write automated tests alongside code — unit, integration, and end-to-end. Manual QA happens on real devices with real scenarios. Security audits run on every build.',
    result:
      'Our clients see 80% fewer production bugs and 99% CI pass rates. Security audits catch vulnerabilities before they ship.',
    technologies: ['Jest', 'React Testing Library', 'Cypress', 'Lighthouse', 'WCAG'],
    keywords: [
      'QA testing',
      'automated testing',
      'software testing',
      'quality assurance',
      'security testing',
      'performance testing',
    ],
  },
  {
    slug: 'website-maintenance',
    title: 'Website Maintenance',
    shortDescription: 'Peace of mind that your website stays fast, safe, and current — whether we built it or someone else did.',
    bullets: [
      'Stays secure and up to date, no nasty surprises',
      'We watch performance and keep it loading fast',
      'Quick edits and new features whenever you need them',
    ],
    icon: 'web',
    fullDescription:
      'Ongoing website maintenance to keep your site secure, fast, and up-to-date. We maintain sites we built and take over existing projects seamlessly.',
    challenge:
      'Websites require constant updates for security patches, framework upgrades, and performance optimization. Neglected sites become vulnerable and slow, damaging user trust.',
    approach:
      'We provide monthly maintenance packages including security updates, performance monitoring, backup management, and feature enhancements. For existing sites, we audit the codebase first, then implement improvements systematically.',
    result:
      'Maintained sites stay secure with 99.9% uptime. Regular updates prevent security breaches and performance degradation. Clients see 30% faster load times after optimization.',
    technologies: ['Git', 'GitHub Actions', 'Docker', 'Lighthouse', 'OWASP'],
    keywords: [
      'website maintenance',
      'website support',
      'security updates',
      'performance optimization',
      'content management',
      'technical support',
    ],
  },
]

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug)
}

export function getAllServiceSlugs(): string[] {
  return services.map((s) => s.slug)
}
