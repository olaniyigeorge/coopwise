"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function CTA() {
  return (
    <section className="py-16 md:py-20 bg-primary">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Ready to Start Your Savings Journey?
        </h2>
        <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
          Join CoopWise today and discover how easy it is to save money with the support of your community.
        </p>
        <div className="flex items-center space-x-4 justify-center">
          <Link href="/auth/signup">
            <Button
              variant="secondary"
              className="bg-white text-primary hover:bg-gray-100 px-6 py-3 transition-colors duration-200"
            >
              Get Started Free
            </Button>
          </Link>
          <Link href="/contact">
            <Button
              variant="secondary"
              className="bg-white text-primary hover:bg-gray-100 px-6 py-3 transition-colors duration-200"
            >
              Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
