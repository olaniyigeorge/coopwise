"use client"

import React from 'react'
import { ShieldCheck } from 'lucide-react'

export default function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-brand-paper/90">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'repeating-linear-gradient(120deg, #0B1712 0px, #0B1712 2px, transparent 20px, transparent 22px)',
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 pt-16 md:pt-24 pb-14 md:pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#B8892B]/40 bg-[#B8892B]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-gold mb-6">
          <ShieldCheck className="h-3.5 w-3.5" />
          About CoopWise
        </div>

        <p className="font-display text-lg md:text-xl font-semibold text-brand-ink/60 mb-2">
          We're Not Reinventing Cooperative Savings.
        </p>

        <h1 className="font-display text-4xl sm:text-5xl md:text-[3.2rem] font-bold text-brand-ink leading-[1.1] text-balance">
          We're Building Trust Infrastructure for People Without Collateral or Credit History.
        </h1>

        <p className="text-base md:text-lg text-brand-ink/70 max-w-2xl mx-auto mt-6">
          Ajo, esusu, chamas — rotating savings groups have moved money across Africa for
          generations, on trust and word of mouth alone. CoopWise keeps what already works,
          and engineers that trust to work beyond the group.
        </p>
      </div>
    </section>
  )
}