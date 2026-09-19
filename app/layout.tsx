import type { Metadata } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import {
  generateMetadata as genMeta,
  generateOrganizationSchema,
  generateWebSiteSchema,
} from '@/lib/seo'
import { site } from '@/lib/site'
import { getSettings } from '@/lib/settings-service'
import Analytics from '@/components/Analytics'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = genMeta({
  title: `${site.name} — Custom Software Development Studio`,
  description:
    'Naazware is a custom software studio building high-performance web, mobile, and desktop applications. From idea to launch — engineered to perform and built to last.',
  keywords: [
    'custom software development',
    'software development company',
    'web application development',
    'mobile app development company',
    'desktop application development',
    'software studio',
    'product engineering',
    'software development Vadodara',
    'software development India',
  ],
})

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSettings()
  const organizationSchema = generateOrganizationSchema(settings)
  const webSiteSchema = generateWebSiteSchema(settings)

  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Set theme before paint. Mirrors lib/theme.ts resolveInitialTheme:
            stored choice wins; otherwise light (light-first default). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t='light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#fafaf7" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
      <body className="bg-ink-900 text-paper">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
