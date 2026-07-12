"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { ArrowRight } from 'lucide-react'
import useAuthStore from '@/stores/auth-store'

export default function AboutCta() {
  const { isAuthenticated } = useAuthStore()

  return (
    <section className="py-16 md:py-20 bg-brand-paper">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-brand-ink mb-4 text-balance">
          Bring Your Circle Onto a Ledger It Can Trust
        </h2>
        <p className="text-brand-ink/65 mb-8 max-w-xl mx-auto">
          Start a group in minutes, or join one with an invite code. No wallet, no jargon —
          just the savings habit you already have, with a record everyone can see.
        </p>
        <Link href={isAuthenticated ? "/dashboard" : "/auth/signup"}>
          <Button className="bg-primary hover:bg-brand-ink duration-800 transition-all text-white px-6 group">
            Start Your Circle
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </div>
    </section>
  )
}