"use client"

import React from 'react'
import HowItWorksTimeline from '../how-it-works-timeline'

export default function HowItWorks() {
  return (
    <section className="py-14 md:py-24 bg-brand-paper">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10 md:mb-20 max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold mb-3">The Process</p>
          <h2 className="font-display text-2xl md:text-4xl font-bold text-brand-ink text-balance">
            From Invite to Payout, in Six Steps
          </h2>
        </div>
        <HowItWorksTimeline />
      </div>
    </section>
  )
}