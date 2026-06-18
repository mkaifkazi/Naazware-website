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
}: {
  title: string
  description?: string
  keywords?: string[]
  path?: string
  image?: string
}): Metadata {
  const metaTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`
  const metaDescription = description || SITE_DESCRIPTION
  const url = `${SITE_URL}${path}`

  return {
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
      type: 'website',
      locale: 'en_US',
      url,
      title: metaTitle,
      description: metaDescription,
      siteName: SITE_NAME,
      images: [
        {
          url: `${SITE_URL}${image}`,
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
      images: [`${SITE_URL}${image}`],
    },
    alternates: {
      canonical: url,
    },
    robots: {
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
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description: SITE_DESCRIPTION,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: site.email,
    },
    sameAs: [site.socials.linkedin, site.socials.twitter, site.socials.github],
  }
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
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
