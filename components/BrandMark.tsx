/**
 * Theme-aware brand icon. Renders both logo variants; CSS (.logo-on-dark /
 * .logo-on-light in globals.css) shows the correct one per data-theme.
 * Decorative — pair it with the "Naazware" wordmark text for the accessible name.
 */
export default function BrandMark({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-on-dark.svg" alt="" aria-hidden="true" className={`logo-on-dark ${className}`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-on-light.svg" alt="" aria-hidden="true" className={`logo-on-light ${className}`} />
    </>
  )
}
