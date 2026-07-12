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
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <div id="coming-soon">
        <ComingSoon />
      </div>
      <HowItWorks />
      <Testimonials />
      <Footer />
      <ScrollToTop />
    </div>
  )
}