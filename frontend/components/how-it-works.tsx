"use client"

import React from 'react'
import Image from 'next/image'
import { BulletPoint } from './ui/bullet-point'
import HowItWorksTimeline from './how-it-works-timeline'

export default function HowItWorks() {


  return (
    <section className="py-10 md:py-20">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 md:mb-20 text-primary">How CoopWise works</h2>
        <HowItWorksTimeline />
      </div>
    </section>
  )
}