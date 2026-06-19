import { MetadataRoute } from 'next'
import { site } from '@/lib/site'

const SITE_URL = site.url

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep the CMS, API routes, and Next internals out of the index.
      disallow: ['/api/', '/studio', '/admin/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
