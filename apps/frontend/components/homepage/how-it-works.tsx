"use client"

import React from 'react'
import HowItWorksTimeline from '../how-it-works-timeline'

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-white py-14 md:py-24">
      {/* Soft warm wash behind the heading */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(50%_100%_at_50%_0%,rgba(232,188,99,0.10),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-20">
          <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8C661E]">
            <span className="h-1 w-1 rounded-full bg-brand-gold" />
            The Process
          </p>
          <h2 className="font-display text-2xl font-bold leading-[1.1] text-brand-ink text-balance md:text-[2.6rem]">
            From Invite to Payout, in Six Steps
          </h2>
        </div>
        <HowItWorksTimeline />
      </div>
    </section>
  )
}
