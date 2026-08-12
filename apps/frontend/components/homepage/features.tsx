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
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14 md:mb-16 max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold mb-3">Why Choose CoopWise</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-brand-ink text-balance">
            The Trust of Your Cooperative. The Discipline of an Infrastructure.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative overflow-hidden bg-brand-paper p-7 rounded-xl border border-brand-ink/10 hover:border-transparent hover:shadow-xl transition-[border-color,box-shadow] duration-500"
            >
              {/* Liquid fill — oversized ellipse, sits below the card, rises in fast on hover, drains slowly on exit */}
              <div
                aria-hidden
                className="absolute inset-x-[-10%] -bottom-[25%] h-[150%] rounded-[20%] bg-gradient-to-t from-primary to-[#0d7a6e]
                  -translate-y-full transition-transform duration-700 ease-in-out
                  group-hover:translate-y-0 group-hover:duration-300 group-hover:ease-out"
              />

              {/* Content sits above the fill */}
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-primary/10 group-hover:bg-white/15 flex items-center justify-center mb-6 transition-colors duration-300 group-hover:duration-500">
                  <feature.icon className="h-5 w-5 text-primary group-hover:text-white transition-colors duration-300 group-hover:duration-500" strokeWidth={1.75} />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-gold mb-2 transition-colors duration-300 group-hover:duration-500">
                  {feature.eyebrow}
                </p>
                <h3 className="text-lg font-semibold text-brand-ink group-hover:text-white mb-2 font-display transition-colors duration-300 group-hover:duration-500">
                  {feature.title}
                </h3>
                <p className="text-sm text-brand-ink/65 group-hover:text-white/85 leading-relaxed transition-colors duration-300 group-hover:duration-500">
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