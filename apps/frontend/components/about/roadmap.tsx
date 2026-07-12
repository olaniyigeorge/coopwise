"use client"

import React from 'react'

const phases = [
  {
    tag: "Phase 1 — Now",
    title: "The Web2 Foundation",
    points: [
      "Join or create cooperative groups",
      "Contributions via familiar payment rails",
      "Full transaction and notification logging",
    ],
  },
  {
    tag: "Phase 2 — Next",
    title: "A Pluggable Web3 Layer",
    points: [
      "Wallet provisioning running quietly underneath",
      "AI group management live on WhatsApp and Telegram",
      "On-chain event logs introduced",
    ],
  },
  {
    tag: "Phase 3 — Future",
    title: "A Decentralized Core",
    points: [
      "Programmable, on-chain escrow",
      "Per-group smart contract rules",
      "Liquidity access via group standing",
    ],
  },
]

export default function Roadmap() {
  return (
    <section className="relative overflow-hidden bg-brand-ink py-16 md:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'repeating-linear-gradient(120deg, #F7F4EC 0px, #F7F4EC 1.5px, transparent 15px, transparent 22px)',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold mb-3">How We're Building</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white text-balance">
            Web3 Is the Engine. It's Never the Entry Point.
          </h2>
          <p className="text-white/60 mt-4">
            Members onboard entirely through tools they already know. Decentralized infrastructure
            is phased in underneath, on our timeline — not theirs to figure out.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {phases.map((phase, index) => (
            <div key={index} className="relative rounded-xl border border-white/10 bg-white/[0.04] p-7">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-gold mb-3">{phase.tag}</p>
              <h3 className="text-white font-semibold font-display text-lg mb-4">{phase.title}</h3>
              <ul className="space-y-2.5">
                {phase.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-brand-gold flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
              {index < phases.length - 1 && (
                <div
                  aria-hidden
                  className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-white/15"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}