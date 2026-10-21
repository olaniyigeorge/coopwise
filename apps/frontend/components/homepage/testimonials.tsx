"use client"

import React from 'react'
import Image from 'next/image'
import { Quote } from 'lucide-react'

const testimonials = [
  {
    name: "Mama Blessing",
    location: "Owerri",
    groupName: "Oja Connect",
    avatar: "/assets/images/Ellipse 7.png",
    quote: "We used to run Ajo by word of mouth. Now everyone sees exactly what's happening — it's clearer, and safer for everybody's money.",
  },
  {
    name: "Chinedo",
    location: "Onitsha",
    groupName: "Hustle & Save Gang",
    avatar: "/assets/images/Ellipse 7a.png",
    quote: "I still save with my guys the way we always have. The difference is we've got reminders and records now — nobody argues over payouts anymore.",
  },
  {
    name: "Aunty Kemi",
    location: "Ibadan",
    groupName: "Ireti Savings Circle",
    avatar: "/assets/images/Ellipse 7b.png",
    quote: "Before CoopWise, we'd forget who had paid. Now the whole group tracks everything together, and there's zero confusion at payout time.",
  },
]

function TestimonialCard({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <div className="w-[320px] flex-shrink-0 rounded-2xl border border-brand-ink/10 bg-white p-6 shadow-[0_24px_50px_-40px_rgba(11,23,18,0.5)] transition-colors duration-300 hover:border-brand-gold/40 md:w-[380px] md:p-7">
      <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-paper ring-1 ring-brand-ink/[0.06]">
        <Quote
          className="h-4 w-4 text-brand-gold"
          fill="currentColor"
          strokeWidth={0}
        />
      </div>
      <p className="mb-6 text-sm leading-relaxed text-brand-ink/70 md:text-[15px]">
        &quot;{t.quote}&quot;
      </p>
      <div className="flex items-center gap-3">
        <Image
          src={t.avatar}
          alt={t.name}
          width={44}
          height={44}
          className="h-11 w-11 rounded-full object-cover ring-2 ring-brand-gold/30"
        />
        <div>
          <p className="text-sm font-semibold text-brand-ink">
            {t.name}{" "}
            <span className="font-normal text-brand-ink/50">· {t.location}</span>
          </p>
          <p className="text-xs font-medium text-[#0E3B2E]">{t.groupName}</p>
        </div>
      </div>
    </div>
  )
}

export default function Testimonials() {
  // duplicated once so the marquee can loop seamlessly
  const track = [...testimonials, ...testimonials]

  return (
    <section className="relative overflow-hidden border-y border-brand-ink/[0.06] bg-brand-paper py-14 md:py-20">
      <div className="mx-auto mb-10 max-w-6xl px-4 text-center md:mb-12">
        <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8C661E]">
          <span className="h-1 w-1 rounded-full bg-brand-gold" />
          Real Circles, Real Records
        </p>
        <h2 className="font-display text-2xl font-bold leading-[1.1] text-brand-ink text-balance md:text-[2.6rem]">
          What Our Members Are Saying
        </h2>
      </div>

      <div className="marquee-track relative">
        {/* edge fade */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-brand-paper via-brand-paper/80 to-transparent md:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-brand-paper via-brand-paper/80 to-transparent md:w-32" />

        <div className="flex w-max animate-marquee gap-5">
          {track.map((t, i) => (
            <TestimonialCard key={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}
