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
    shortDescription: 'A fast, reliable web app built around your exact workflow — clean code, thoughtful UX, and no template compromises.',
    bullets: [
      'Built to fit your process, not a template',
      'Fast, accessible, and tested throughout',
      'Clean code you can own and extend',
    ],
    icon: 'web',
    fullDescription:
      'We build fast, reliable web applications that solve real problems. From single-page apps to complex dashboards, we focus on clean code and user experience.',
    challenge:
      'Most web apps fail because they prioritize features over performance and maintainability. Users expect instant load times and smooth interactions.',
    approach:
      'We use modern frameworks like Next.js and React with server-side rendering where it matters. Every component is tested, every API call is optimized, and every deployment is automated.',
    result:
      'Typical projects launch in 8–12 weeks with 90+ Lighthouse scores — fast, accessible, and engineered to stay maintainable as they grow.',
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
    shortDescription: 'A well-crafted iOS and Android app your users trust — native-quality performance, offline-ready, and built to last.',
    bullets: [
      'One well-built app for iPhone and Android',
      'Smooth, native-quality performance',
      'Handled end to end: build to store launch',
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
    shortDescription: 'A dependable desktop tool tailored to how your team works — fast, robust, and built for daily use.',
    bullets: [
      'Runs on Windows, macOS, and Linux — one build for all',
      'Reliable offline, with your data stored locally',
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
    shortDescription: 'Secure, well-configured hosting and deployment — set up properly so your software stays fast, safe, and online.',
    bullets: [
      'Fast, correctly configured delivery',
      'Secure by default — SSL, backups, monitoring',
      'Automated deployments, handled for you',
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
    shortDescription: 'Thorough testing and QA so your software ships solid — fewer bugs, better performance, and confidence at launch.',
    bullets: [
      'Automated tests across the codebase',
      'Checked on real devices and real scenarios',
      'Performance and security verified before release',
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
    shortDescription: 'Ongoing care that keeps your software fast, secure, and current — whether we built it or inherited it.',
    bullets: [
      'Kept secure and up to date, no nasty surprises',
      'Performance watched and tuned',
      'Quick edits and new features on request',
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
