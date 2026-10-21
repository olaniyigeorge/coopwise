"use client"

import React from 'react'
import Image from 'next/image'
import { BulletPoint } from './ui/bullet-point'

export default function HowItWorksTimeline() {
  const steps = [
    {
      title: "Open the CoopWise Link",
      bullets: [
        "Invited by someone? Tap the group link they shared.",
        "Starting fresh? Head to www.coopwise.com to get going."
      ],
      phoneImage: "/assets/images/Phone0.png",
      phonePosition: "right"
    },
    {
      title: "Create Your Account",
      bullets: [
        "Sign up with your name, email, or phone number — under two minutes.",
        "Set your savings goal and you're in."
      ],
      phoneImage: "/assets/images/Phone1.png",
      phonePosition: "left"
    },
    {
      title: "Join or Start a Group",
      bullets: [
        "Have an invite code? Enter it to join an existing circle.",
        "Starting your own? Invite the people you already trust."
      ],
      phoneImage: "/assets/images/Phone2.png",
      phonePosition: "right"
    },
    {
      title: "Set Your Group's Rules",
      bullets: [
        "Decide how much to contribute, and how often.",
        "Choose whether payouts rotate or stay fixed. It's your circle — you write the rules."
      ],
      phoneImage: "/assets/images/Phone3.png",
      phonePosition: "left"
    },
    {
      title: "Save on Schedule, Guided by AI",
      bullets: [
        "Make your contributions as they come due.",
        "CoopWise sends reminders and tips before a deadline slips, not after."
      ],
      phoneImage: "/assets/images/Phone4.png",
      phonePosition: "right"
    },
    {
      title: "Track Every Naira",
      bullets: [
        "See total savings, who's contributed, and when the next payout lands.",
        "One dashboard, fully transparent, always up to date."
      ],
      phoneImage: "/assets/images/Phone6.png",
      phonePosition: "left"
    }
  ]

  return (
    <div className="relative">
      {/* Timeline rail */}
      <div
        aria-hidden
        className="absolute bottom-10 left-[19px] top-8 w-px bg-gradient-to-b from-brand-gold/50 via-brand-ink/10 to-transparent"
      />

      <ol className="space-y-5 md:space-y-6">
        {steps.map((step, index) => (
          <li key={index} className="relative pl-12 md:pl-16">
            {/* Node */}
            <span
              aria-hidden
              className="absolute left-0 top-7 flex h-10 w-10 items-center justify-center rounded-full border border-brand-gold/40 bg-white shadow-[0_10px_22px_-14px_rgba(11,23,18,0.6)]"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#0E3B2E] ring-4 ring-[#0E3B2E]/[0.08]" />
            </span>

            <div className="group rounded-2xl border border-brand-ink/10 bg-brand-paper/70 p-6 transition-all duration-300 hover:border-brand-gold/40 hover:bg-brand-paper hover:shadow-[0_30px_60px_-45px_rgba(11,23,18,0.5)] md:p-8">
              <div
                className={`flex flex-col items-center gap-6 md:flex-row md:gap-10 ${
                  step.phonePosition === "left" ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className="w-full min-w-0 flex-1">
                  <h3 className="mb-3 font-display text-xl font-bold leading-snug text-brand-ink md:text-2xl">
                    {step.title}
                  </h3>
                  <div className="space-y-2.5">
                    {step.bullets?.map((bullet, idx) => (
                      <BulletPoint key={idx}>
                        {typeof bullet === 'string' ? bullet : String(bullet)}
                      </BulletPoint>
                    ))}
                  </div>
                </div>

                <div className="relative h-72 w-36 shrink-0 md:h-80 md:w-40">
                  <Image
                    src={step.phoneImage}
                    alt={`Step: ${step.title}`}
                    fill
                    sizes="(max-width: 768px) 144px, 160px"
                    className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
