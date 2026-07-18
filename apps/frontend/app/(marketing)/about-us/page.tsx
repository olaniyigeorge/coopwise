"use client"

import Navbar from '@/components/homepage/navbar'
import AboutHero from '@/components/about/about-hero'
import Mission from '@/components/about/mission'
import Values from '@/components/about/values'
import Roadmap from '@/components/about/roadmap'
import ThesisQuote from '@/components/about/thesis-quote'
import Builders from '@/components/about/builders'
import AboutCta from '@/components/about/about-cta'
import Footer from '@/components/homepage/footer'
import ScrollToTop from '@/components/homepage/scroll-to-top'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />  
      <AboutHero />
      <Mission />
      <Values />
      <Roadmap />
      <ThesisQuote />
      <Builders />
      <AboutCta />
      <Footer />
      <ScrollToTop />
    </div>
  )
}