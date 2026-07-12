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
    <div className="w-[320px] md:w-[380px] flex-shrink-0 bg-white rounded-2xl border border-brand-ink/10 p-6 md:p-7 shadow-sm">
      <Quote className="h-6 w-6 text-brand-gold/70 mb-4" fill="currentColor" strokeWidth={0} />
      <p className="text-sm md:text-[15px] text-brand-ink/75 leading-relaxed mb-6">
        "{t.quote}"
      </p>
      <div className="flex items-center gap-3">
        <Image
          src={t.avatar}
          alt={t.name}
          width={44}
          height={44}
          className="rounded-full object-cover w-11 h-11 ring-2 ring-brand-gold/30"
        />
        <div>
          <p className="text-sm font-semibold text-brand-ink">{t.name} <span className="font-normal text-brand-ink/50">· {t.location}</span></p>
          <p className="text-xs text-primary font-medium">{t.groupName}</p>
        </div>
      </div>
    </div>
  )
}

export default function Testimonials() {
  // duplicated once so the marquee can loop seamlessly
  const track = [...testimonials, ...testimonials]

  return (
    <section className="py-14 md:py-20 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 mb-10 md:mb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold mb-3">Real Circles, Real Records</p>
        <h2 className="font-display text-2xl md:text-4xl font-bold text-brand-ink text-balance">
          What Our Members Are Saying
        </h2>
      </div>

      <div className="marquee-track relative">
        {/* edge fade */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10" />

        <div className="flex gap-5 w-max animate-marquee">
          {track.map((t, i) => (
            <TestimonialCard key={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}