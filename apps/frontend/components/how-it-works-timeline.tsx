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
    <>
      {/* Mobile version */}
      <div className="md:hidden relative">
        <div className="absolute left-4 top-0 bottom-0 flex flex-col items-center">
          <div className="absolute top-0 bottom-0 w-0.5 bg-brand-ink/10"></div>
          {steps.map((_, index) => (
            <div
              key={index}
              className="absolute w-4 h-4 rounded-full border-2 border-brand-gold bg-brand-paper z-10 flex items-center justify-center"
              style={{ top: `${(100 / (steps.length - 1)) * index}%` }}
            >
              <div className="w-2 h-2 rounded-full bg-primary"></div>
            </div>
          ))}
        </div>

        <div className="space-y-16 relative">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start pl-10">
              <div className="w-full">
                <h3 className="text-lg font-bold text-brand-ink mb-2 font-display">{step.title}</h3>
                <div className="space-y-2 mb-4">
                  {step.bullets?.map((bullet, idx) => (
                    <BulletPoint key={idx}>{typeof bullet === 'string' ? bullet : String(bullet)}</BulletPoint>
                  ))}
                </div>
                <div className="flex justify-center w-full">
                  <div className="relative w-40 h-80">
                    <Image src={step.phoneImage} alt={`Step: ${step.title}`} fill className="object-contain" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop version */}
      <div className="hidden md:block relative">
        <div className="absolute left-16 top-0 bottom-0 flex flex-col items-center">
          <div className="absolute top-0 bottom-0 w-0.5 bg-brand-ink/10"></div>
          {steps.map((_, index) => (
            <div
              key={index}
              className="absolute w-6 h-6 rounded-full border-2 border-brand-gold bg-brand-paper z-10 flex items-center justify-center"
              style={{ top: `${(100 / (steps.length - 1)) * index}%` }}
            >
              <div className="w-3 h-3 rounded-full bg-primary"></div>
            </div>
          ))}
        </div>

        <div className="space-y-[calc(100vh/8)] relative">
          {steps.map((step, index) => (
            <div key={index} className="flex justify-center items-center space-x-20">
              {step.phonePosition === 'left' ? (
                <>
                  <div className="relative w-48 h-96">
                    <Image src={step.phoneImage} alt={`Step: ${step.title}`} fill className="object-contain" />
                  </div>
                  <div className="max-w-md">
                    <h3 className="text-xl font-bold text-brand-ink mb-4 font-display">{step.title}</h3>
                    <div className="space-y-2">
                      {step.bullets?.map((bullet, idx) => (
                        <BulletPoint key={idx}>{typeof bullet === 'string' ? bullet : String(bullet)}</BulletPoint>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="max-w-md">
                    <h3 className="text-xl font-bold text-brand-ink mb-4 font-display">{step.title}</h3>
                    <div className="space-y-2">
                      {step.bullets?.map((bullet, idx) => (
                        <BulletPoint key={idx}>{typeof bullet === 'string' ? bullet : String(bullet)}</BulletPoint>
                      ))}
                    </div>
                  </div>
                  <div className="relative w-48 h-96">
                    <Image src={step.phoneImage} alt={`Step: ${step.title}`} fill className="object-contain" />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}