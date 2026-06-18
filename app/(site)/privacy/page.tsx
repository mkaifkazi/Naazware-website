import { Metadata } from 'next'
import PageHeader from '@/components/PageHeader'
import { generateMetadata as genMeta } from '@/lib/seo'
import { site } from '@/lib/site'

export const metadata: Metadata = genMeta({
  title: 'Privacy Policy',
  description: 'Privacy policy for the Naazware website and services.',
  path: '/privacy',
})

export default function PrivacyPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy" />
      <section className="pb-24">
        <div className="container-px">
          <article className="prose-dark mx-auto max-w-3xl">
            <p className="text-sm text-paper-faint">Last updated: {new Date().toLocaleDateString()}</p>

            <h2>Information we collect</h2>
            <p>
              When you contact us through our website, we collect your name, email address, company
              name (optional), budget range, and project details. We use this information solely to
              respond to your inquiry and provide quotes.
            </p>

            <h2>How we use your information</h2>
            <p>
              We use your contact information to respond to inquiries, send project estimates, and
              communicate about potential projects. We never sell or share your information with
              third parties for marketing purposes.
            </p>

            <h2>Analytics</h2>
            <p>
              We use analytics tools to understand how visitors use our site. These tools may use
              cookies to collect anonymous usage data. You can disable cookies in your browser
              settings.
            </p>

            <h2>Data security</h2>
            <p>
              We take reasonable precautions to protect your information. All form submissions are
              transmitted over HTTPS. We store contact form data securely and delete it after one
              year if no project relationship develops.
            </p>

            <h2>Your rights</h2>
            <p>
              You can request to view, update, or delete your information at any time by emailing{' '}
              <a href={`mailto:${site.email}`}>{site.email}</a>.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about this privacy policy? Email us at{' '}
              <a href={`mailto:${site.email}`}>{site.email}</a>.
            </p>
          </article>
        </div>
      </section>
    </>
  )
}
