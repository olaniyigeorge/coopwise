"use client"

import React from 'react'
import { Link2, Coins, FileCode2, Vault, ArrowRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'

const chainFeatures = [
  {
    icon: Coins,
    title: "Liquidity, Accessed as a Group",
    description:
      "As your group's contribution history grows, it becomes provable collective standing. We're building access to partner liquidity — capital your group can tap together, without anyone leaving the circle.",
  },
  {
    icon: Vault,
    title: "Collateral-light Financing",
    description:
      "Your group's standing — every contribution made on time, by everyone — becomes its credit history. No property, no paperwork, just a track record we can verify.",
  },
  {
    icon: FileCode2,
    title: "Rules You Can't Bend",
    description:
      "Rotation, deadlines, ownership shares, exit terms — written into rules your group defines and enforced by the platform. No admin can bend them after the fact.",
  },
  {
    icon: Link2,
    title: "Auditable Escrow",
    description:
      "Group funds sit in escrow, and every movement is recorded in a clear history your group can review at any time.",
  },
]

export default function ComingSoon() {
  const router = useRouter()
  return (
    <section className="relative overflow-hidden bg-[#0B1712] py-16 md:py-24">
      {/* Ember glow + faint tally texture on the dark ledger page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_0%,rgba(232,188,99,0.16),transparent_65%),radial-gradient(45%_40%_at_100%_100%,rgba(127,191,156,0.10),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(120deg, #F7F4EC 0px, #F7F4EC 1.5px, transparent 20px, transparent 22px)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-gold/40 bg-brand-gold/10 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#E8BC63]">
            <span className="h-1 w-1 rounded-full bg-[#E8BC63]" />
            History, Put to Work
          </div>
          <h2 className="font-display text-3xl font-bold leading-[1.1] text-white text-balance md:text-[2.6rem]">
            The Ledger, Put to Work
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/55 md:text-lg">
            Today, CoopWise runs on rails you already trust — bank transfer, card, familiar apps.
            What your group builds next is a financial identity that travels with it, so the
            record you write together becomes something the wider financial system can recognize.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {chainFeatures.map((feature, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-gold/40 hover:bg-white/[0.06] sm:p-7"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-gold/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8BC63]/10 ring-1 ring-[#E8BC63]/25 transition-colors duration-300 group-hover:bg-[#E8BC63]/15">
                  <feature.icon
                    className="h-5 w-5 text-[#E8BC63]"
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <h3 className="mb-1.5 font-display text-lg font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/55">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-5 text-center">
          <p className="max-w-md text-sm leading-relaxed text-white/50">
            Everything runs on the bank transfer, card and wallet rails you already use — no new
            apps to learn, no crypto wallet required.
          </p>
          <Button
            onClick={() => router.push("/signup")}
            className="group h-12 rounded-full bg-[#E8BC63] px-6 text-sm font-semibold text-[#0B1712] shadow-[0_18px_40px_-22px_rgba(232,188,99,0.8)] hover:bg-[#F0CB7E]"
          >
            Join the Early Access List
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </section>
  )
}
