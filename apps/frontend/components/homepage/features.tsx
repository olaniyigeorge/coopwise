"use client"

import React from 'react'
import { Network, Scale, BadgeCheck, Building2 } from 'lucide-react'

const features = [
  {
    icon: Network,
    eyebrow: "Collective Coordination",
    title: "Turn Community Capital Into Collective Power",
    description:
      "Bring the money, relationships, and intent already inside your community into one coordinated structure — from pooled capital and bulk purchasing to businesses, assets, and shared goals.",
  },
  {
    icon: Scale,
    eyebrow: "Governance",
    title: "Make the Rules Clear. Make Ownership Explicit.",
    description:
      "Define who contributes, who decides, who owns what, and what happens when someone joins, leaves, or disagrees. CoopWise gives every cooperative a structure its members can understand and trust.",
  },
  {
    icon: BadgeCheck,
    eyebrow: "Portable Trust",
    title: "Turn Participation Into Reputation",
    description:
      "Your history in a cooperative shouldn't disappear when the group ends. Build a verifiable record of contribution, reliability, and participation that can become a foundation for access to more capital and opportunity.",
  },
  {
    icon: Building2,
    eyebrow: "Built to Outlive You",
    title: "Build Economic Structures, Not Just Savings Pots",
    description:
      "Move beyond emergency funds. Pool capital to build businesses, acquire assets, finance members, and create institutions that can survive individual members and compound across generations.",
  },
];

export default function Features() {
  return (
    <section className="relative overflow-hidden border-y border-brand-ink/[0.06] bg-white py-16 md:py-24">
      {/* Warm light + ledger texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_40%_at_50%_0%,rgba(232,188,99,0.12),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
          <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8C661E]">
            <span className="h-1 w-1 rounded-full bg-brand-gold" />
            Why Choose CoopWise
          </p>
          <h2 className="font-display text-3xl font-bold leading-[1.1] text-brand-ink text-balance md:text-[2.6rem]">
            The Trust of Your Cooperative. The Discipline of an Infrastructure.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl border border-brand-ink/10 bg-brand-paper p-7 transition-[border-color,box-shadow] duration-500 hover:border-transparent hover:shadow-[0_30px_60px_-40px_rgba(11,23,18,0.55)]"
            >
              {/* Liquid fill — oversized ellipse rises from below and flows down over the card */}
              <div
                aria-hidden
                className="absolute inset-x-[-10%] -bottom-[25%] h-[150%] rounded-[20%] bg-gradient-to-t from-[#0E3B2E] via-[#0E3B2E] to-[#0d7a6e]
                  -translate-y-full will-change-transform transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
                  group-hover:translate-y-0 group-hover:duration-500"
              >
                <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(232,188,99,0.35),transparent_70%)]" />
              </div>

              {/* Content sits above the fill */}
              <div className="relative z-10">
                <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0E3B2E]/[0.08] ring-1 ring-[#0B1712]/[0.06] transition-colors duration-300 group-hover:bg-white/15 group-hover:ring-white/10 group-hover:duration-500">
                  <feature.icon
                    className="h-5 w-5 text-[#0E3B2E] transition-colors duration-300 group-hover:text-[#E8BC63] group-hover:duration-500"
                    strokeWidth={1.75}
                  />
                </div>

                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8C661E] transition-colors duration-300 group-hover:text-[#E8BC63] group-hover:duration-500">
                  {feature.eyebrow}
                </p>
                <h3 className="mb-2.5 font-display text-lg font-bold leading-snug text-brand-ink transition-colors duration-300 group-hover:text-white group-hover:duration-500">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-brand-ink/65 transition-colors duration-300 group-hover:text-white/85 group-hover:duration-500">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
