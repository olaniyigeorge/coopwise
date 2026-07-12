"use client"

import React from 'react'

export default function Mission() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-10 md:gap-16 items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold mb-3">Why We Built This</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-brand-ink leading-tight text-balance">
              The System Was Never Broken. The Bookkeeping Was.
            </h2>
          </div>

          <div className="space-y-5 text-brand-ink/70 text-base leading-relaxed">
            <p>
              Rotating savings groups are one of the oldest working financial products on the
              continent — a self-governing model that survives for one reason: it delivers value
              its members can feel, cycle after cycle. No cooperative outlasts its usefulness to
              the people in it.
            </p>
            <p>
              This isn't a niche behavior. Across Africa, savings cooperatives support more small
              businesses than almost any formal institution — arguably the closest thing the
              continent has to an SME bank. Where microfinance has struggled to reach the bottom
              of the pyramid, informal cooperatives have quietly done the job for generations,
              running on nothing more than trust between members.
            </p>
            <p>
              It's also worth being precise about what this is. A savings circle isn't a loan
              product, and CoopWise is built to respect that distinction — this is discipline and
              delayed gratification, not credit. What breaks these groups isn't the model; it's the
              bookkeeping. Someone forgets who paid. A payout order gets disputed because nobody
              wrote it down. A treasurer moves cities and takes the records along.
            </p>
            <p>
              CoopWise exists to fix that layer, not replace the tradition underneath it. Every
              contribution logged. Every payout traceable. And longer-term, we're building toward
              something the DeFi world has talked about for years but rarely delivered in a real
              <span className="bg-brand-gold/15 text-brand-gold px-1 rounded">African context: a trust layer that lets value built inside one cooperative move into
              others — without asking a single member to understand what a blockchain is to
              benefit from it.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}