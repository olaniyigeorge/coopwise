"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#0B1712] py-12 text-white/80 md:py-16">
      {/* Gold hairline + warm glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(232,188,99,0.08),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06]">
                <Image
                  src="/images/coopwise-logo.svg"
                  alt="CoopWise Logo"
                  width={22}
                  height={22}
                  className="h-[22px] w-[22px] brightness-0 invert"
                />
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-white">
                CoopWise
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-white/45">
              Trust infrastructure for people the credit system doesn&apos;t see yet — built on ajo, esusu, and tontine.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Product
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/how-it-works" className="text-white/55 transition-colors hover:text-[#E8BC63]">How It Works</Link></li>
              <li><Link href="/#coming-soon" className="text-white/55 transition-colors hover:text-[#E8BC63]">Roadmap</Link></li>
              <li><Link href="/signup" className="text-white/55 transition-colors hover:text-[#E8BC63]">Start a Circle</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about-us" className="text-white/55 transition-colors hover:text-[#E8BC63]">About Us</Link></li>
              <li><Link href="/support" className="text-white/55 transition-colors hover:text-[#E8BC63]">Support</Link></li>
              <li><Link href="/terms" className="text-white/55 transition-colors hover:text-[#E8BC63]">Terms</Link></li>
              <li><Link href="/privacy" className="text-white/55 transition-colors hover:text-[#E8BC63]">Privacy</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 pt-6 md:flex-row">
          <span className="text-xs text-white/35">© {new Date().getFullYear()} CoopWise. All rights reserved.</span>
          <span className="text-xs text-white/25">Built on rails you trust, backed by a ledger you can audit.</span>
        </div>
      </div>
    </footer>
  )
}
