"use client"

import React from 'react'
import { Quote } from 'lucide-react'

export default function ThesisQuote() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold mb-6">Not Just Our Thesis</p>

        <Quote className="h-8 w-8 text-[#B8892B]/60 mx-auto mb-4" fill="currentColor" strokeWidth={0} />

        <blockquote className="font-display text-2xl md:text-3xl font-bold text-brand-ink leading-snug text-balance">
          "The best African SME bank is the cooperative."
        </blockquote>
        <a href="" target='_blank'>
          <p className="text-sm text-brand-ink/50 mt-4 mb-8">- Osaretin Victor Asemota</p>

        </a>
        
        <p className="text-brand-ink/65 leading-relaxed max-w-xl mx-auto">
          It's an argument made well beyond CoopWise. Asemota has spent years writing publicly
          about African cooperatives and DeFi, and his consistent point is that rotating savings
          groups already outperform formal lenders at reaching the businesses banks overlook — and
          that real African DeFi has to be built as a trust bridge between cooperatives and credit
          unions, not abstract crypto speculation. That's the same bet we're making, a few years
          behind him.
        </p>
      </div>
    </section>
  )
}