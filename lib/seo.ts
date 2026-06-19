import { Metadata } from 'next'
import { site } from './site'

const SITE_URL = site.url
const SITE_NAME = site.name
const SITE_DESCRIPTION = site.description

export function generateMetadata({
  title,
  description,
  keywords,
  path = '',
  image = '/og-image.png',
  type = 'website',
  publishedTime,
  noindex = false,
}: {
  title: string
  description?: string
  keywords?: string[]
  path?: string
  image?: string
  type?: 'website' | 'article'
  publishedTime?: string
  noindex?: boolean
}): Metadata {
  // Don't double up the brand when the caller already included it (e.g. the homepage).
  const metaTitle = title === SITE_NAME || title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
  const metaDescription = description || SITE_DESCRIPTION
  const url = `${SITE_URL}${path}`
  // Image may be an absolute URL (Sanity cover) or a site-relative path.
  const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`

  return {
    metadataBase: new URL(SITE_URL),
    title: metaTitle,
    description: metaDescription,
    keywords: keywords || [
      'custom software development',
      'web application development',
      'mobile app development',
      'desktop app development',
      'software studio',
      'product engineering',
    ],
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    openGraph: {
      type,
      locale: 'en_US',
      url,
      title: metaTitle,
      description: metaDescription,
      siteName: SITE_NAME,
      ...(type === 'article' && publishedTime ? { publishedTime } : {}),
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
      : {}),
    robots: noindex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
  }
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    // ProfessionalService is a LocalBusiness subtype — gives us local-search signals
    // (address, area served) on top of a normal Organization.
    '@type': ['Organization', 'ProfessionalService'],
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    legalName: site.legalName,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    image: `${SITE_URL}/og-image.png`,
    description: SITE_DESCRIPTION,
    slogan: site.tagline,
    email: site.email,
    telephone: site.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Tandalja',
      addressLocality: 'Vadodara',
      addressRegion: 'Gujarat',
      addressCountry: 'IN',
    },
    areaServed: 'Worldwide',
    knowsAbout: [
      'Custom software development',
      'Web application development',
      'Mobile app development',
      'Desktop application development',
      'Product engineering',
      'UI/UX design',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: site.email,
      telephone: site.phone,
      areaServed: 'Worldwide',
      availableLanguage: ['English', 'Hindi', 'Gujarati'],
    },
    sameAs: [site.socials.linkedin, site.socials.twitter, site.socials.github],
  }
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en',
  }
}

export function generateArticleSchema({
  title,
  description,
  path,
  image,
  datePublished,
  author,
}: {
  title: string
  description: string
  path: string
  image?: string | null
  datePublished?: string
  author?: string
}) {
  const url = `${SITE_URL}${path}`
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: image ? (image.startsWith('http') ? image : `${SITE_URL}${image}`) : `${SITE_URL}/og-image.png`,
    ...(datePublished ? { datePublished, dateModified: datePublished } : {}),
    author: { '@type': author ? 'Person' : 'Organization', name: author || SITE_NAME },
    publisher: { '@id': `${SITE_URL}/#organization` },
  }
}

export function generateServiceSchema({
  name,
  description,
  path,
}: {
  name: string
  description: string
  path: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: `${SITE_URL}${path}`,
    serviceType: name,
    provider: { '@id': `${SITE_URL}/#organization` },
    areaServed: 'Worldwide',
  }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  }
}
