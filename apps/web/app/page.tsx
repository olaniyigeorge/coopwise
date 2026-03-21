"use client"

import React from 'react'
import Navbar from '@/components/navbar'
import Hero from '@/components/hero'
import Features from '@/components/features'
import HowItWorks from '@/components/how-it-works'
import Testimonials from '@/components/testimonials'
import Footer from '@/components/footer'
import ScrollToTop from '@/components/scroll-to-top'
import { useAuth } from '@crossmint/client-sdk-react-ui'

export default function HomePage() {
  const { user, status } = useAuth();
  const authenticated = status === "logged-in";
  const loading = status === "initializing";

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {authenticated
        ? <div className="h-[2px] bg-green-600 font-medium" />
        : !loading && <div className="h-[2px] bg-red-600" />
      }
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Footer />
      <ScrollToTop />
    </div>
  )
}