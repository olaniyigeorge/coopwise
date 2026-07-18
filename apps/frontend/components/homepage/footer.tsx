"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-brand-ink text-white/80 py-12 md:py-14">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-10 pb-10 border-b border-white/10">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <Image
                src="/images/coopwise-logo.svg"
                alt="CoopWise Logo"
                width={24}
                height={24}
                className="w-6 h-6 brightness-0 invert"
              />
              <span className="font-display text-lg font-bold text-white">CoopWise</span>
            </Link>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed">
              Trust infrastructure for people the credit system doesn't see yet — built on ajo, esusu, and tontine.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/how-it-works" className="hover:text-brand-gold transition-colors">How It Works</Link></li>
              <li><Link href="/#coming-soon" className="hover:text-brand-gold transition-colors">On-Chain Roadmap</Link></li>
              <li><Link href="/auth/signup" className="hover:text-brand-gold transition-colors">Start a Circle</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about-us" className="hover:text-brand-gold transition-colors">About Us</Link></li>
              <li><Link href="/support" className="hover:text-brand-gold transition-colors">Support</Link></li>
              <li><Link href="/terms" className="hover:text-brand-gold transition-colors">Terms</Link></li>
              <li><Link href="/privacy" className="hover:text-brand-gold transition-colors">Privacy</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <span className="text-xs text-white/40">© {new Date().getFullYear()} CoopWise. All rights reserved.</span>
          <span className="text-xs text-white/30">Built on rails you trust, backed by a ledger you can audit.</span>
        </div>
      </div>
    </footer>
  )
}