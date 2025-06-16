"use client"

import React from 'react'
import Navbar from '@/components/navbar'
import Hero from '@/components/hero'
import Features from '@/components/features'
import HowItWorks from '@/components/how-it-works'
import Testimonials from '@/components/testimonials'
import Footer from '@/components/footer'
import ScrollToTop from '@/components/scroll-to-top'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Footer />
      <ScrollToTop />
    </div>
  )
}