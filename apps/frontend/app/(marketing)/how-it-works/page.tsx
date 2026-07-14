"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import Navbar from '@/components/homepage/navbar'
import Footer from '@/components/homepage/footer'
import ScrollToTop from '@/components/homepage/scroll-to-top'
import HowItWorksTimeline from '@/components/how-it-works-timeline'
import { Users, HandCoins, BellRing, Eye, Timer, Landmark, ArrowRight } from 'lucide-react'

// Same liquid-fill hover card used across Home, About, and Support —
// keeps this page visually part of the same product.
function LiquidCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`group relative overflow-hidden bg-white rounded-xl border border-brand-ink/10 hover:border-transparent hover:shadow-xl transition-[border-color,box-shadow] duration-500 ${className}`}>
      <div
        aria-hidden
        className="absolute inset-x-[-10%] -bottom-[25%] h-[150%] rounded-b-[25%] bg-gradient-to-t from-primary to-[#0d7a6e]
          -translate-y-full transition-transform duration-700 ease-in
          group-hover:translate-y-0 group-hover:duration-300 group-hover:ease-out"
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export default function HowItWorksPage() {
  const benefits = [
    {
      icon: Users,
      title: "Powered by People You Trust",
      description: "No app replaces the accountability of saving with people you already know. CoopWise just gives that trust a record to stand on.",
    },
    {
      icon: HandCoins,
      title: "Your Group Sets the Terms",
      description: "Contribution amount, frequency, payout order — your circle decides the rules. CoopWise enforces them, it doesn't dictate them.",
    },
    {
      icon: BellRing,
      title: "Nudges, Not Nagging",
      description: "CoopWise tracks your group's schedule and reminds members ahead of a due date, so discipline doesn't rely on memory alone.",
    },
    {
      icon: Eye,
      title: "Transparent by Default",
      description: "Every contribution and payout is visible to your whole group, logged in real time. That visibility is the security model, not a marketing claim.",
    },
    {
      icon: Timer,
      title: "Live in Under Two Minutes",
      description: "Sign up, set a goal, join or start a group. No paperwork, no waiting period before you can start saving.",
    },
    {
      icon: Landmark,
      title: "Built on a Model That Already Works",
      description: "Rotating savings groups have financed households and small businesses across the continent for generations. CoopWise didn't invent the discipline — it just gives it better bookkeeping.",
    },
  ]

  const features = [
    {
      title: "Reminders That Read the Calendar",
      description: "Contribution due dates, payout timing — CoopWise tracks your group's schedule and nudges members before a deadline slips, not after.",
      image: "/assets/images/Phone8.png"
    },
    {
      title: "One Dashboard for the Whole Group",
      description: "Add members, track who's contributed, and watch progress update in real time. No separate spreadsheet required.",
      image: "/assets/images/Phone3.png"
    },
    {
      title: "A Clearer Picture of Your Saving",
      description: "See how your group is trending against its goal, with simple insights that help you adjust before a cycle ends, not after.",
      image: "/assets/images/Phone7.png"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-paper">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(120deg, #0B1712 0px, #0B1712 2px, transparent 20px, transparent 22px)',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 pt-16 md:pt-20 pb-12 md:pb-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold mb-4">The Process</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-[3.2rem] font-bold text-brand-ink leading-[1.1] text-balance">
            How CoopWise Actually Works
          </h1>
          <p className="text-base md:text-lg text-brand-ink/70 max-w-2xl mx-auto mt-5">
            No app tour needed. Six steps, start to finish — from opening the link to watching
            your group's ledger fill up.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center mt-8">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-6 group">
                Start Saving Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="/support" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto text-primary border-primary hover:border-brand-ink hover:bg-brand-ink hover:text-white transition-colors"
              >
                Get Support
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Step-by-Step Process */}
      <section className="py-14 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10 md:mb-20 max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold mb-3">The Full Walkthrough</p>
            <h2 className="font-display text-2xl md:text-4xl font-bold text-brand-ink text-balance">
              Every Step, Laid Out
            </h2>
          </div>
          <HowItWorksTimeline />
        </div>
      </section>

      {/* Why It Works */}
      <section className="py-16 md:py-24 bg-brand-paper">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold mb-3">Why It Works</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-brand-ink text-balance">
              Built Around How Groups Actually Save
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <LiquidCard key={index} className="p-7">
                <div className="w-12 h-12 rounded-full bg-primary/10 group-hover:bg-brand-gold/15 flex items-center justify-center mb-6 transition-colors duration-300 group-hover:duration-500">
                  <benefit.icon className="h-5 w-5 text-primary group-hover:text-brand-gold transition-colors duration-300 group-hover:duration-500" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-semibold text-brand-ink group-hover:text-white mb-2 font-display transition-colors duration-300 group-hover:duration-500">
                  {benefit.title}
                </h3>
                <p className="text-sm text-brand-ink/65 group-hover:text-white/85 leading-relaxed transition-colors duration-300 group-hover:duration-500">
                  {benefit.description}
                </p>
              </LiquidCard>
            ))}
          </div>
        </div>
      </section>

      {/* What's in the App */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold mb-3">Inside CoopWise</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-brand-ink text-balance">
              What's Actually in the App
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="relative w-32 h-64 mx-auto mb-6">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className="text-xl font-bold text-brand-ink mb-3 font-display">{feature.title}</h3>
                <p className="text-brand-ink/65 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-16 md:py-20 bg-brand-paper">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-brand-ink mb-4 text-balance">
            Ready to See It in Action?
          </h2>
          <p className="text-brand-ink/65 mb-8 max-w-xl mx-auto">
            Six steps, one ledger everyone can trust. Start your circle today.
          </p>
          <div className="flex items-center gap-3 justify-center flex-wrap">
            <Link href="/signup">
              <Button className="bg-primary hover:bg-primary/90 text-white px-6 group">
                Start Saving Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="/support">
              <Button variant="outline" className="text-primary border-brand-ink hover:bg-brand-ink hover:text-white">
                Talk to Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  )
}