"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import useAuthStore from '@/stores/auth-store'
import { ArrowRight, ShieldCheck } from 'lucide-react'

export default function Hero() {
  const { isAuthenticated } = useAuthStore()

  return (
    <section className="relative  overflow-hidden bg-brand-paper/95">
      {/* Tally-mark texture — the way contributions were counted before CoopWise */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'repeating-linear-gradient(120deg, #0B1712 0px, #0B1712 1px, transparent 20px, transparent 22px)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-2 pt-12 md:pt-20 pb-12 md:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div className="space-y-5 md:space-y-7 text-center md:text-left">
            {/* <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/40 bg-brand-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-gold">
              <ShieldCheck className="h-3.5 w-3.5" />
               Ajo · Esusu · Chamas — Digitized
            </div> */}

            <h1 className="font-display text-4xl sm:text-5xl md:text-[3.4rem] font-bold text-brand-ink leading-[1.08] text-balance">
              Your Savings Circle Deserves a Ledger It Can Trust
            </h1>

            <p className="text-base md:text-lg text-brand-ink/70 max-w-lg mx-auto md:mx-0">
              CoopWise brings the discipline of your cooperative online — every contribution logged,
              every payout accounted for, and an AI that keeps the group on schedule instead of on
              WhatsApp screenshots.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 md:pt-4 justify-center md:justify-start">
              <Link href={isAuthenticated ? "/dashboard" : "/signup"} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-primary hover:bg-brand-ink text-white px-6 group">
                  Start Your Circle
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="/how-it-works" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-primary border-primary hover:bg-brand-ink hover:border-brand-ink transition-colors"
                >
                  See How It Works
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-2 justify-center md:justify-start pt-1">
              <div className="tally-divider w-6 text-brand-ink" />
              <p className="text-xs text-brand-ink/50">
                No collateral. No jargon. Fund your wallet the same way you already pay for anything else.
              </p>
            </div>
          </div>

          <div className="flex justify-center md:justify-end w-full">
            <div className="relative w-full max-w-[320px] md:max-w-[500px] h-[280px] sm:h-[320px] md:h-[420px] rounded-2xl overflow-hidden shadow-xl ring-1 ring-brand-ink/10">
              <Image
                src="/images/hero-image.png"
                alt="A CoopWise member reviewing their savings circle"
                fill
                sizes="(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 40vw"
                className="object-cover w-full h-full"
                priority
              />
              {/* Ledger stamp — the trust seal */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-brand-ink/90 backdrop-blur px-3 py-2 shadow-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-gold text-brand-gold text-xs font-bold font-display">
                  ✓
                </span>
                <span className="text-white text-xs font-medium pr-1">Every kobo, on the record</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}