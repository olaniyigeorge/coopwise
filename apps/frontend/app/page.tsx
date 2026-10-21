"use client"

import Navbar from '@/components/homepage/navbar'
import Hero from '@/components/homepage/hero'
import Features from '@/components/homepage/features'
import ComingSoon from '@/components/homepage/coming-soon'
import HowItWorks from '@/components/homepage/how-it-works'
import Testimonials from '@/components/homepage/testimonials'
import Footer from '@/components/homepage/footer'
import ScrollToTop from '@/components/homepage/scroll-to-top'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-paper">
      {/* The hero paints its own background to the top of the page, so the
          header floats over it instead of leaving a bare strip above it. */}
      <Navbar reserveSpace={false} />
      <Hero />
      <Features />
      <div id="coming-soon" className="scroll-mt-24">
        <ComingSoon />
      </div>
      <HowItWorks />
      <Testimonials />
      <Footer />
      <ScrollToTop />
    </div>
  )
}