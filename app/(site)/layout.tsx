import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FloatingCTA from '@/components/FloatingCTA'
import SmoothScroll from '@/components/SmoothScroll'
import MagneticCursor from '@/components/MagneticCursor'
import SilkBackground from '@/components/visual/SilkBackground'
import Accents from '@/components/visual/Accents'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-accent focus:px-5 focus:py-2 focus:text-accent-contrast"
      >
        Skip to main content
      </a>
      <SmoothScroll />
      <MagneticCursor />
      {/* One continuous silk backdrop + decorative accents behind ALL site pages
          (fixed, full-viewport). Replaces per-page boxed backdrops that seamed. */}
      <SilkBackground global allowWebGL={false} composition={{ angle: 135, intensity: 0.75 }} />
      <Accents global preset="hero" />
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
      <FloatingCTA />
    </div>
  )
}
