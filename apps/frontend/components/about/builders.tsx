"use client"

import React from 'react'
import { Code2 } from 'lucide-react'

export default function Builders() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-6">
          <Code2 className="h-6 w-6 text-primary" strokeWidth={1.75} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold mb-3">Who's Building This</p>
        <h2 className="font-display text-2xl md:text-3xl font-bold text-brand-ink mb-5 text-balance">
          A Small Team, Building in the Open
        </h2>
        <p className="text-brand-ink/70 leading-relaxed">
          CoopWise wasn't built by outsiders studying cooperative finance from a distance — 
          it was built by engineers who grew up inside it. Call us LAPO babies: we know the 
          rhythm of rotating contributions, the quiet math of who's owed what, and exactly 
          where the system tends to break. That proximity is the edge. We've watched firsthand 
          how Africa's already-decentralized approach to finance can be organized and managed 
          to operate at scale — without stripping out the trust that makes it work in the first
          place. We're based in Nigeria, building the product in public, one phase of the roadmap 
          at a time, with the codebase open for anyone who wants to look under the hood.

        </p>
      </div>
    </section>
  )
}