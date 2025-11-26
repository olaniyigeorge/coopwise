"use client"

import React from 'react'
import Navbar from '@/components/navbar'
import Hero from '@/components/hero'
import Features from '@/components/features'
import HowItWorks from '@/components/how-it-works'
import Testimonials from '@/components/testimonials'
import Footer from '@/components/footer'
import ScrollToTop from '@/components/scroll-to-top'
import { useAuth, useAuthState } from '@campnetwork/origin/react'

export default function HomePage() {
  const { authenticated, loading } = useAuthState();
  const auth = useAuth();



  console.log('Home Page - Authenticated:', authenticated);
  console.log('Home Page - Loading:', loading); 
  console.log('Home Page - Auth Object:', auth);
 
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {
        authenticated
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