 "use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import CTA from '@/components/cta'
import { CheckCircle, Users, DollarSign, TrendingUp, Shield, Zap } from 'lucide-react'
import HowItWorksTimeline from '@/components/how-it-works-timeline'

export default function HowItWorksPage() {

  const benefits = [
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: "Community Powered",
      description: "Join trusted friends and family to achieve your savings goals together."
    },
    {
      icon: <DollarSign className="w-6 h-6 text-primary" />,
      title: "Flexible Contributions",
      description: "Set contribution amounts and schedules that work for your group."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-primary" />,
      title: "Smart Insights",
      description: "AI-powered tips and reminders to help you stay on track."
    },
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: "Secure & Transparent",
      description: "Bank-level security with full transparency on all transactions."
    },
    {
      icon: <Zap className="w-6 h-6 text-primary" />,
      title: "Quick Setup",
      description: "Get started in under 2 minutes with our streamlined onboarding."
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-primary" />,
      title: "Proven Results",
      description: "Join thousands who've successfully achieved their savings goals."
    }
  ]

  const features = [
    {
      title: "Smart Notifications",
      description: "Never miss a contribution deadline with intelligent reminders tailored to your schedule.",
      image: "/assets/images/Phone8.png"
    },
    {
      title: "Group Management",
      description: "Easily manage group members, track contributions, and monitor progress in real-time.",
      image: "/assets/images/Phone3.png"
    },
    {
      title: "Financial Insights",
      description: "Get personalized savings tips and insights based on your group's performance.",
      image: "/assets/images/Phone7.png"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-8 md:pt-12 pb-10 md:pb-16">
        <div className="text-center space-y-4 md:space-y-6">
      
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Simple Steps to{" "}
            <span className="text-brand-teal relative">
              Financial
              <span className="absolute -bottom-2 left-0 w-full">
                <Image
                  src="/assets/icons/Vector 85.svg"
                  alt="Underline"
                  width={120}
                  height={8}
                  className="w-full"
                />
              </span>
            </span>{" "}
            Success
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
            CoopWise makes group savings simple, secure, and rewarding. Follow these easy steps to start your savings journey with friends and family.
          </p>
          <div className="flex items-center space-x-4 pt-2 md:pt-4 justify-center">
            <Link href="/auth/signup">
              <Button className="bg-primary hover:bg-primary/90 text-white px-4 md:px-6">
                Start Saving Now
              </Button>
            </Link>
            <Link href="/contact">
              <Button 
                variant="outline" 
                className="text-primary border-primary hover:bg-primary hover:text-white transition-colors"
              >
                Ask Questions
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Step-by-Step Process */}
      <section className="py-10 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 md:mb-20 text-primary">
            Your Savings Journey in 6 Simple Steps
          </h2>
          <HowItWorksTimeline />
      
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Why Choose CoopWise?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands of people who are already saving smarter with CoopWise&apos;s powerful features and community support.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {benefit.icon}
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-gray-600">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Powerful Features for Success
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              CoopWise provides everything you need to successfully manage and grow your savings group.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTA />
      <Footer />
    </div>
  )
} 