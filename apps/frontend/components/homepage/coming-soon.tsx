"use client"

import React from 'react'
import { Link2, Coins, FileCode2, Vault, ArrowRight } from 'lucide-react'
import { Button } from "@/components/ui/button"

const chainFeatures = [
  {
    icon: Coins,
    title: "Liquidity Pools up to $30M",
    description:
      "Once your group's contribution history lives on-chain, it becomes provable collateral. We're building access to liquidity pools across select blockchains — capital your circle can tap without ever leaving the group.",
  },
  {
    icon: Vault,
    title: "Collateral-less Financing",
    description:
      "Your standing in the group — every contribution made on time — becomes your credit history. No property, no paperwork, just a track record the chain can verify.",
  },
  {
    icon: FileCode2,
    title: "Smart Contract Group Rules",
    description:
      "Contribution schedules, payout order, and penalties, encoded directly into your group's smart contract — so the rules enforce themselves and no admin can bend them.",
  },
  {
    icon: Link2,
    title: "On-Chain, Auditable Escrow",
    description:
      "Escrow secured on-chain, starting with Solana, with every transaction written to an immutable public record your group can audit at any time.",
  },
]

export default function ComingSoon() {
  return (
    <section className="relative overflow-hidden bg-brand-ink py-16 md:py-24">
      {/* faint tally texture on the dark ledger page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'repeating-linear-gradient(120deg, #F7F4EC 0px, #F7F4EC 1.5px, transparent 20px, transparent 22px)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4">
        <div className="text-center mb-14 md:mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/50 bg-brand-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-gold mb-4">
            History, Put to Work
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white text-balance">
            The Ledger Goes On-Chain
          </h2>
          <p className="text-white/60 mt-4 text-base md:text-lg">
            Today, CoopWise runs on rails you already trust — bank transfer, card, familiar apps.
            Underneath, we're quietly building a decentralized core, so your group's discipline
            becomes something the wider financial system can recognize.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {chainFeatures.map((feature, index) => (
            <div
              key={index}
              className="flex gap-4 p-6 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-brand-gold/40 transition-colors"
            >
              <div className="flex-shrink-0 w-11 h-11 rounded-full border border-brand-gold/40 flex items-center justify-center">
                <feature.icon className="h-5 w-5 text-brand-gold" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-white font-semibold font-display mb-1.5">{feature.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <p className="text-white/50 text-sm max-w-md">
            Web3 is the engine underneath, not the entry point. You'll never need a crypto wallet
            to benefit from it.
          </p>
          <Button className="bg-brand-gold hover:bg-brand-gold/90 text-brand-ink font-semibold px-6 group">
            Join the Early Access List
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </section>
  )
}