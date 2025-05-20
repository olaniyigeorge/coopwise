"use client"

import React from 'react'
import Image from 'next/image'
import { BulletPoint } from './ui/bullet-point'

export default function HowItWorks() {
  const steps = [
    {
      title: "Open the CoopWise Link",
      bullets: [
        "If someone invites you, just tap the group link they shared",
        "Or visit www.coopwise.com to get started"
      ],
      phoneImage: "/assets/icons/PhoneBorder.svg",
      phonePosition: "right"
    },
    {
      title: "Create Your Account",
      bullets: [
        "Sign up with your name, email or phone number",
        "Set your savings goal and basic initial takes less than 2 minutes"
      ],
      phoneImage: "/assets/icons/PhoneBorder.svg",
      phonePosition: "left"
    },
    {
      title: "Join or Start a Group",
      bullets: [
        "Enter an invite code if you're joining a group",
        "Or start your own group and invite people you trust"
      ],
      phoneImage: "/assets/icons/PhoneBorder.svg",
      phonePosition: "right"
    },
    {
      title: "Set Your Group Rules",
      bullets: [
        "Decide how much to contribute and how often",
        "Decide if payouts rotate or stay fixed, it's your group, your rules"
      ],
      phoneImage: "/assets/icons/PhoneBorder.svg",
      phonePosition: "left"
    },
    {
      title: "Save Money, Get Smart AI Tips",
      bullets: [
        "Make regular contributions",
        "CoopWise sends helpful reminders and suggestions to keep you on track"
      ],
      phoneImage: "/assets/icons/PhoneBorder.svg",
      phonePosition: "right"
    },
    {
      title: "Track Your Progress",
      bullets: [
        "See your group's total savings, who has contributed, and when payouts are coming",
        "Everything is transparent and easy to follow"
      ],
      phoneImage: "/assets/icons/PhoneBorder.svg",
      phonePosition: "left"
    }
  ]

  return (
    <section className="py-10 md:py-20">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 md:mb-20 text-primary">How CoopWise works</h2>
        
        {/* Mobile version - visible on mobile, hidden on md screens and up */}
        <div className="md:hidden relative">
          {/* Mobile timeline */}
          <div className="absolute left-4 top-0 bottom-0 flex flex-col items-center">
            {/* Vertical line */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {/* Timeline nodes */}
            {steps.map((_, index) => (
              <div 
                key={index} 
                className="absolute w-4 h-4 rounded-full border-2 border-primary bg-white z-10 flex items-center justify-center"
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
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <div className="space-y-2 mb-4">
                    {step.bullets.map((bullet, idx) => (
                      <BulletPoint key={idx}>{bullet}</BulletPoint>
                    ))}
                  </div>
                  <div className="flex justify-center w-full">
                    <div className="relative w-28 h-56">
                      <Image
                        src={step.phoneImage}
                        alt={`Step: ${step.title}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop version - hidden on mobile, visible on md screens and up */}
        <div className="hidden md:block relative">
          {/* Custom timeline */}
          <div className="absolute left-16 top-0 bottom-0 flex flex-col items-center">
            {/* Vertical line */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {/* Timeline nodes */}
            {steps.map((_, index) => (
              <div 
                key={index} 
                className="absolute w-6 h-6 rounded-full border-2 border-primary bg-white z-10 flex items-center justify-center"
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
                    {/* Phone on left */}
                    <div className="relative w-36 h-72">
                      <Image
                        src={step.phoneImage}
                        alt={`Step: ${step.title}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                    
                    {/* Text content on right */}
                    <div className="max-w-md">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                      <div className="space-y-2">
                        {step.bullets.map((bullet, idx) => (
                          <BulletPoint key={idx}>{bullet}</BulletPoint>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Text content on left */}
                    <div className="max-w-md">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                      <div className="space-y-2">
                        {step.bullets.map((bullet, idx) => (
                          <BulletPoint key={idx}>{bullet}</BulletPoint>
                        ))}
                      </div>
                    </div>
                    
                    {/* Phone on right */}
                    <div className="relative w-36 h-72">
                      <Image
                        src={step.phoneImage}
                        alt={`Step: ${step.title}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}