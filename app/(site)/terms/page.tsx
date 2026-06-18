import { Metadata } from 'next'
import PageHeader from '@/components/PageHeader'
import { generateMetadata as genMeta } from '@/lib/seo'
import { site } from '@/lib/site'

export const metadata: Metadata = genMeta({
  title: 'Terms of Service',
  description: 'Terms of service for the Naazware website and services.',
  path: '/terms',
})

export default function TermsPage() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of Service" />
      <section className="pb-24">
        <div className="container-px">
          <article className="prose-dark mx-auto max-w-3xl">
            <p className="text-sm text-paper-faint">Last updated: {new Date().toLocaleDateString()}</p>

            <h2>Use of website</h2>
            <p>
              This website is provided for informational purposes. By using this site, you agree to
              use it lawfully and not to misuse any contact forms or communication channels.
            </p>

            <h2>Services</h2>
            <p>
              Design and development services are provided under separate written agreements. These
              terms cover only the use of this website, not project work.
            </p>

            <h2>Intellectual property</h2>
            <p>
              All content on this website, including text, code examples, and design, is owned by
              Naazware or used with permission. You may not copy or redistribute this content
              without permission.
            </p>

            <h2>Disclaimer</h2>
            <p>
              Case studies and performance metrics are based on real projects but may not reflect
              results for your specific situation. Project timelines and outcomes depend on many
              factors specific to each client.
            </p>

            <h2>Limitation of liability</h2>
            <p>
              We are not liable for any damages arising from the use of this website or reliance on
              its content. Contact us directly for specific advice about your project.
            </p>

            <h2>Changes to terms</h2>
            <p>
              We may update these terms occasionally. Continued use of the site constitutes
              acceptance of updated terms.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about these terms? Email us at{' '}
              <a href={`mailto:${site.email}`}>{site.email}</a>.
            </p>
          </article>
        </div>
      </section>
    </>
  )
}
