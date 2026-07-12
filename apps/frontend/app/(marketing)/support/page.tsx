"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Navbar from '@/components/homepage/navbar'
import Footer from '@/components/homepage/footer'
import ScrollToTop from '@/components/homepage/scroll-to-top'
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  BookOpen,
  Users,
  ShieldCheck,
  CreditCard,
  Settings,
  AlertTriangle,
  Clock,
  CheckCircle,
  Map,
  ArrowRight
} from 'lucide-react'

// A card with the same liquid-fill hover used across the homepage and About page —
// keeps Support visually part of the same product, not a bolted-on help widget.
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

export default function SupportPage() {
  const supportOptions = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Live Chat",
      description: "Instant answers from a real person on our team",
      availability: "Launching soon",
      action: "Start Chat",
      comingSoon: true
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone",
      description: "Talk it through with someone directly",
      availability: "Mon–Fri, 9AM–6PM WAT",
      action: "Call Now",
      link: "tel:+2348144441712"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email",
      description: "Send the details, we'll dig into it properly",
      availability: "We reply within 24 hours",
      action: "Send Email",
      link: "mailto:hellocoopwise@gmail.com"
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Help Center",
      description: "Self-serve guides for every part of CoopWise",
      availability: "Launching soon",
      action: "Browse Guides",
      comingSoon: true
    }
  ]

  const supportCategories = [
    {
      icon: <Users className="w-7 h-7" />,
      title: "Group Management",
      description: "Creating, joining, and running your savings circle",
      topics: [
        "Starting a new savings group",
        "Inviting members you trust",
        "Setting your contribution schedule",
        "Admin permissions, explained",
        "Leaving a group properly"
      ]
    },
    {
      icon: <CreditCard className="w-7 h-7" />,
      title: "Contributions & Payouts",
      description: "Everything about money moving in and out",
      topics: [
        "Adding a payment method",
        "Making a contribution",
        "How payouts are calculated",
        "Reading your transaction history",
        "When a payment doesn't go through"
      ]
    },
    {
      icon: <ShieldCheck className="w-7 h-7" />,
      title: "Security & Privacy",
      description: "Keeping your account and your circle's data safe",
      topics: [
        "Setting up two-factor login",
        "Who can see your contribution history",
        "Reporting suspicious activity",
        "Requesting your data",
        "Recovering a locked account"
      ]
    },
    {
      icon: <Settings className="w-7 h-7" />,
      title: "Account Settings",
      description: "Your profile, notifications, and verification",
      topics: [
        "Updating your profile",
        "Choosing what CoopWise reminds you about",
        "Linking a bank account or card",
        "Identity verification, explained",
        "Deactivating your account"
      ]
    }
  ]

  const quickAnswers = [
    {
      question: "How do I reset my password?",
      answer: (
        <div className="space-y-2">
          <p>To reset your password:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Go to the CoopWise login page and select "Forgot Password."</li>
            <li>Enter the email address tied to your account.</li>
            <li>Check your inbox for a reset link — and your spam folder, just in case.</li>
            <li>Set a new password (8+ characters, a mix of letters, numbers, and symbols).</li>
            <li>Log in as normal.</li>
          </ol>
          <p>No email after 10 minutes? Reach out and we'll sort it out directly.</p>
        </div>
      )
    },
    {
      question: "Is my money actually safe with CoopWise?",
      answer: (
        <div className="space-y-2">
          <p>
            Contributions move through Paystack, a regulated payment processor already used across 
            Nigerian fintech — CoopWise never stores your card or bank credentials directly. Every contribution and payout is logged
            and visible to your group in real time, which is the actual safeguard: a record nobody
            can quietly alter after the fact.
          </p>
          <p>
            We're a small, early-stage team, and we'd rather say that plainly than borrow language
            (deposit insurance, "bank-level" guarantees) that doesn't reflect where we are today.
            As the roadmap below shows, we're building toward on-chain, independently auditable
            escrow — that's the direction, not a promise about right now.
          </p>
        </div>
      )
    },
    {
      question: "Can I leave a savings group anytime?",
      answer: (
        <div className="space-y-2">
          <p>Yes — you're never locked in. To leave:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Open your group settings and select "Leave Group."</li>
            <li>Review any pending contributions or upcoming payouts your exit might affect.</li>
            <li>Worth a conversation with the group first — your departure can shift others' plans.</li>
            <li>Settle any outstanding obligations under your group's own rules.</li>
            <li>Confirm.</li>
          </ol>
          <p>Your contribution history stays visible, and you're paid out according to the group's agreed structure.</p>
        </div>
      )
    },
    {
      question: "How do I invite people to my group?",
      answer: (
        <div className="space-y-2">
          <p>From your group dashboard, select "Invite Members." From there you can:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Share your group's unique link by text, email, or social</li>
            <li>Hand out the invite code for manual entry</li>
            <li>Require admin approval before new members join</li>
          </ul>
          <p>Every invite carries the group's rules and contribution terms, so nobody joins without knowing what they're signing up for.</p>
        </div>
      )
    },
    {
      question: "What happens if someone doesn't pay?",
      answer: (
        <div className="space-y-2">
          <p>Today, that's handled by your group directly:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Reminders go out before a due date, and again if it's missed.</li>
            <li>Group admins can set grace periods or agree on a payment plan.</li>
            <li>The full contribution record is visible to everyone, so there's no ambiguity about who owes what.</li>
            <li>Persistent non-payment is a group decision — CoopWise doesn't override that.</li>
          </ol>
          <p>
            AI-assisted dispute resolution — reviewing the record and proposing a fair outcome
            automatically — is on our roadmap, not live yet. We'll say so here the day it ships.
          </p>
        </div>
      )
    },
    {
      question: "How much does CoopWise cost?",
      answer: (
        <div className="space-y-2">
          <p>
            Creating and joining a group is free today. We haven't finalized a pricing model yet,
            and we're not going to publish numbers before they're real. When there's anything to
            pay for, it'll be small, clearly disclosed, and never a surprise deducted from your
            group's savings.
          </p>
        </div>
      )
    },
    {
      question: "How do I reach customer support?",
      answer: (
        <div className="space-y-2">
          <p>Two channels are live right now:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Email</strong> — <a href="mailto:hellocoopwise@gmail.com" className="text-primary hover:underline">hellocoopwise@gmail.com</a>, we reply within 24 hours.
            </li>
            <li>
              <strong>Phone</strong> — <a href="tel:+2348144441712" className="text-primary hover:underline">+234 903 7018 310</a>, Mon–Fri, 9AM–6PM WAT.
            </li>
          </ul>
          <p>Live chat and a full self-serve Help Center are next on the roadmap.</p>
        </div>
      )
    },
    {
      question: "What types of savings groups can I create?",
      answer: (
        <div className="space-y-2">
          <p>Whatever structure your circle already runs on:</p>
          <ul className="space-y-1">
            <li><strong>Rotating groups (ajo/esusu-style)</strong> — regular contributions, members take turns receiving the full pot.</li>
            <li><strong>Goal-based groups</strong> — saving together toward one shared target.</li>
            <li><strong>Family circles</strong> — coordinated household savings.</li>
            <li><strong>Workplace or community groups</strong> — colleagues or neighbors saving side by side.</li>
          </ul>
          <p>Every group sets its own contribution amount, schedule, and payout order.</p>
        </div>
      )
    }
  ]

  const statusItems = [
    { service: "Platform", status: "Operational" },
    { service: "Payments (Paystack)", status: "Operational" },
    { service: "Web App", status: "Operational" }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-paper/90">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(100deg, #0B1712 0px, #0B1712 2px, transparent 20px, transparent 22px)',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 pt-16 md:pt-20 pb-12 md:pb-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold mb-4">Support</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-[3.2rem] font-bold text-brand-ink leading-[1.1] text-balance">
            Answers, On the Record
          </h1>
          <p className="text-base md:text-lg text-brand-ink/70 max-w-2xl mx-auto mt-5">
            Browse the guides below, or reach a real person directly. Same principle as the rest
            of CoopWise — no runaround, no forms into a void.
          </p>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold mb-3">Get in Touch</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-brand-ink text-balance">
              Support, Your Way
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {supportOptions.map((option, index) => (
              <LiquidCard key={index} className="p-6 text-center flex flex-col">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-white/15 group-hover:text-white transition-colors duration-300 group-hover:duration-500">
                    {option.icon}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h3 className="font-display font-semibold text-brand-ink group-hover:text-white transition-colors duration-300 group-hover:duration-500">
                    {option.title}
                  </h3>
                  {option.comingSoon && (
                    <Badge className="bg-[#B8892B]/10 text-brand-gold border border-[#B8892B]/30 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/30 transition-colors duration-300 group-hover:duration-500">
                      Coming Soon
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-brand-ink/60 group-hover:text-white/80 mb-3 transition-colors duration-300 group-hover:duration-500">
                  {option.description}
                </p>
                <div className="text-xs text-brand-ink/45 group-hover:text-white/60 mb-4 flex items-center justify-center gap-1 transition-colors duration-300 group-hover:duration-500">
                  <Clock className="w-3.5 h-3.5" />
                  {option.availability}
                </div>
                <div className="mt-auto">
                  {option.comingSoon ? (
                    <Button className="w-full bg-brand-ink/5 text-brand-ink/40 group-hover:bg-white/10 group-hover:text-white/50" variant="outline" disabled>
                      {option.action}
                    </Button>
                  ) : (
                    <a href={option.link} className="block">
                      <Button className="w-full border-primary text-primary group-hover:bg-white group-hover:text-primary group-hover:border-white transition-colors duration-300 group-hover:duration-500" variant="outline">
                        {option.action}
                      </Button>
                    </a>
                  )}
                </div>
              </LiquidCard>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Topic */}
      <section className="py-16 md:py-20 bg-brand-paper">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold mb-3">Browse</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-brand-ink text-balance">
              Find It by Topic
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {supportCategories.map((category, index) => (
              <LiquidCard key={index} className="p-7">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-white/15 group-hover:text-white flex-shrink-0 transition-colors duration-300 group-hover:duration-500">
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-brand-ink group-hover:text-white transition-colors duration-300 group-hover:duration-500">
                      {category.title}
                    </h3>
                    <p className="text-sm text-brand-ink/55 group-hover:text-white/75 transition-colors duration-300 group-hover:duration-500">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {category.topics.map((topic, idx) => (
                    <div key={idx} className="flex items-center text-sm text-brand-ink/60 group-hover:text-white/80 transition-colors duration-300 group-hover:duration-500">
                      <HelpCircle className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                      {topic}
                    </div>
                  ))}
                </div>
                <Badge className="bg-[#B8892B]/10 text-brand-gold border border-[#B8892B]/30 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/30 transition-colors duration-300 group-hover:duration-500">
                  Full guides coming soon
                </Badge>
              </LiquidCard>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Answers */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold mb-3">FAQ</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-brand-ink text-balance">
              Quick Answers
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {quickAnswers.map((qa, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-brand-paper rounded-lg border border-brand-ink/10"
              >
                <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                  <span className="font-semibold text-brand-ink font-display">{qa.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-5 text-brand-ink/65 leading-relaxed">
                  {qa.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-10">
            <p className="text-brand-ink/60 mb-4">Still stuck on something?</p>
            <div className="flex items-center gap-3 justify-center flex-wrap">
              <a href="mailto:hellocoopwise@gmail.com">
                <Button variant="outline" className="text-primary border-primary hover:bg-primary hover:text-white">
                  Email Us Directly
                </Button>
              </a>
              <Button disabled variant="outline" className="text-brand-ink/40 border-brand-ink/15">
                <MessageCircle className="w-4 h-4 mr-2" />
                Live Chat
                <Badge className="ml-2 bg-[#B8892B]/10 text-brand-gold border border-[#B8892B]/30">Coming Soon</Badge>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Where We Are Right Now — transparency section */}
      <section className="relative overflow-hidden bg-brand-ink py-16 md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'repeating-linear-gradient(120deg, #F7F4EC 0px, #F7F4EC 1.5px, transparent 15px, transparent 22px)',
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#B8892B]/50 bg-[#B8892B]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-gold mb-5">
            <Map className="h-3.5 w-3.5" />
            Where We Are Right Now
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-5 text-balance">
            We'd Rather Tell You What's Not Built Yet
          </h2>
          <p className="text-white/60 leading-relaxed mb-2">
            CoopWise is early — Phase 1 of a longer roadmap. Group creation, contributions, and
            transparent transaction tracking are live today. Live chat, a full self-serve Help
            Center, and AI-assisted dispute resolution are being built next.
          </p>
          <p className="text-white/60 leading-relaxed">
            Until those ship, email and phone reach an actual person on our team — not a queue.
            Every gap on this page is one we're actively closing.
          </p>
        </div>
      </section>

      {/* System Status */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <Card className="border border-brand-ink/10 shadow-none">
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-display text-xl text-brand-ink">System Status</CardTitle>
              <p className="text-brand-ink/55 text-sm">Current status of CoopWise services</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statusItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-brand-paper rounded-lg">
                    <span className="text-sm font-medium text-brand-ink">{item.service}</span>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span className="text-sm text-brand-ink/60">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Security Concerns */}
      <section className="py-12 bg-brand-paper">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-xl border border-red-200 bg-white p-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-display font-semibold text-brand-ink mb-1.5">Notice something wrong with your account?</h3>
              <p className="text-sm text-brand-ink/60 mb-4">
                Unauthorized access, a transaction you don't recognize, anything security-related —
                treat it as urgent and contact us right away. We'll treat it the same way.
              </p>
              <a href="tel:+2349037018310">
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Us
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-brand-ink mb-4 text-balance">
            Still Need Help?
          </h2>
          <p className="text-brand-ink/65 mb-8 max-w-xl mx-auto">
            No bots, no ticket number to remember — just tell us what's going on.
          </p>
          <div className="flex items-center gap-3 justify-center flex-wrap">
            <a href="mailto:hellocoopwise@gmail.com">
              <Button className="bg-primary hover:bg-primary/90 text-white px-6 group">
                Contact Support
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </a>
            <Link href="/about-us">
              <Button variant="outline" className="text-primary border-primary hover:bg-primary hover:text-white">
                About CoopWise
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