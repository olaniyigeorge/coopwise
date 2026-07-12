"use client"

import React from 'react'
import { Eye, Users, HandCoins, Layers } from 'lucide-react'

const values = [
  {
    icon: Eye,
    title: "Transparency First",
    description: "If a member can't see it, we haven't built it right. Every contribution and payout is visible to the whole group, always.",
  },
  {
    icon: Users,
    title: "The Group Comes First",
    description: "We design for the circle, not the individual saver. Features that don't serve the group's trust get cut.",
  },
  {
    icon: HandCoins,
    title: "No New Habits Required",
    description: "Members should never need to learn Web3, crypto, or new jargon to benefit from what's running underneath.",
  },
  {
    icon: Layers,
    title: "Built in the Open, in Phases",
    description: "We ship the foundation first and layer in automation and decentralization deliberately — never faster than trust can follow.",
  },
]

export default function Values() {
  return (
    <section className="py-16 md:py-24 bg-brand-paper">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold mb-3">What We Stand For</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-brand-ink text-balance">
            Four Rules We Don't Break
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <div
              key={index}
              className="group relative overflow-hidden bg-white p-7 rounded-xl border border-brand-ink/10 hover:border-transparent hover:shadow-xl transition-[border-color,box-shadow] duration-500"
            >
              <div
                aria-hidden
                className="absolute inset-x-[-10%] -bottom-[25%] h-[150%] rounded-[20%] bg-gradient-to-t from-primary to-[#0d7a6e]
                  -translate-y-full transition-transform duration-800 ease-in
                  group-hover:translate-y-0 group-hover:duration-300 group-hover:ease-in-out"
              />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-full bg-primary/10 group-hover:bg-brand-gold/15 flex items-center justify-center mb-6 transition-colors duration-300 group-hover:duration-500">
                  <value.icon className="h-5 w-5 text-primary group-hover:text-brand-gold transition-colors duration-300 group-hover:duration-500" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-semibold text-brand-ink group-hover:text-white mb-2 font-display transition-colors duration-300 group-hover:duration-500">
                  {value.title}
                </h3>
                <p className="text-sm text-brand-ink/65 group-hover:text-white/85 leading-relaxed transition-colors duration-300 group-hover:duration-500">
                  {value.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}