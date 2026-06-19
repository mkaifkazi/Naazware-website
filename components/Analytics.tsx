import Script from 'next/script'

/**
 * Google Analytics 4. Renders nothing until NEXT_PUBLIC_GA_ID (a "G-XXXXXXX"
 * measurement id) is set in the environment, so it stays dormant otherwise.
 */
export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  if (!gaId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
      </Script>
    </>
  )
}
