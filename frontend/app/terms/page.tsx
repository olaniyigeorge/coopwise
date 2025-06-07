"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { FileText, Shield, Users, AlertCircle } from 'lucide-react'

export default function TermsPage() {
  const lastUpdated = "May 25, 2025"

  const sections = [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      content: [
        "By accessing and using CoopWise ('Service'), you accept and agree to be bound by the terms and provision of this agreement.",
        "If you do not agree to abide by the above, please do not use this service.",
        "Use of our service is also governed by our Privacy Policy, which is incorporated into these terms by reference."
      ]
    },
    {
      id: "description",
      title: "2. Service Description",
      content: [
        "CoopWise is a digital platform that enables users to create and participate in savings groups with friends, family, and trusted individuals.",
        "The platform provides tools for group management, contribution tracking, payment processing, and financial insights.",
        "We reserve the right to modify, suspend, or discontinue any part of our service at any time with reasonable notice."
      ]
    },
    {
      id: "eligibility",
      title: "3. User Eligibility",
      content: [
        "You must be at least 18 years old to use CoopWise.",
        "You must provide accurate, current, and complete information during registration.",
        "You are responsible for maintaining the confidentiality of your account credentials.",
        "You may not create multiple accounts or share your account with others."
      ]
    },
    {
      id: "user-responsibilities",
      title: "4. User Responsibilities",
      content: [
        "You agree to use the service only for lawful purposes and in accordance with these terms.",
        "You are responsible for all activities that occur under your account.",
        "You must not use the service to transmit any harmful, illegal, or offensive content.",
        "You agree to honor all financial commitments made through savings groups you join.",
        "You must not attempt to circumvent any security measures or access unauthorized areas of the service."
      ]
    },
    {
      id: "financial-terms",
      title: "5. Financial Terms",
      content: [
        "CoopWise facilitates savings groups but does not guarantee returns or financial outcomes.",
        "Users are responsible for their own financial decisions and contributions.",
        "We may charge fees for certain premium features, which will be clearly disclosed.",
        "All transactions are processed through secure, third-party payment processors.",
        "Dispute resolution between group members is primarily the responsibility of the group, though we may provide mediation assistance."
      ]
    },
    {
      id: "privacy-security",
      title: "6. Privacy and Security",
      content: [
        "We implement industry-standard security measures to protect your data and funds.",
        "Your personal and financial information is handled according to our Privacy Policy.",
        "We use bank-level encryption and partner with FDIC-insured institutions.",
        "You should immediately report any suspected unauthorized access to your account."
      ]
    },
    {
      id: "prohibited-uses",
      title: "7. Prohibited Uses",
      content: [
        "Using the service for any illegal activities or money laundering.",
        "Creating fake accounts or misrepresenting your identity.",
        "Attempting to defraud other users or the platform.",
        "Interfering with the proper functioning of the service.",
        "Violating any applicable laws or regulations in your jurisdiction."
      ]
    },
    {
      id: "limitation-liability",
      title: "8. Limitation of Liability",
      content: [
        "CoopWise is provided 'as is' without warranties of any kind.",
        "We are not liable for any indirect, incidental, or consequential damages.",
        "Our liability is limited to the amount of fees you have paid to us in the past 12 months.",
        "We are not responsible for the actions of other users or external payment processors.",
        "Users participate in savings groups at their own risk."
      ]
    },
    {
      id: "termination",
      title: "9. Account Termination",
      content: [
        "You may terminate your account at any time by contacting our support team.",
        "We may suspend or terminate accounts that violate these terms.",
        "Upon termination, you remain responsible for any outstanding obligations.",
        "We will provide reasonable notice before terminating accounts except in cases of serious violations."
      ]
    },
    {
      id: "changes",
      title: "10. Changes to Terms",
      content: [
        "We may update these terms from time to time to reflect changes in our service or legal requirements.",
        "Material changes will be communicated via email or prominent notice on our platform.",
        "Continued use of the service after changes constitutes acceptance of the new terms.",
        "If you disagree with changes, you may terminate your account."
      ]
    },
    {
      id: "contact",
      title: "11. Contact Information",
      content: [
        "If you have questions about these terms, please contact us at legal@coopwise.com.",
        "For general support, visit our Contact page or email support@coopwise.com.",
        "Legal notices should be sent to: CoopWise Legal Department, 123 Innovation Drive, San Francisco, CA 94105."
      ]
    }
  ]

  const highlights = [
    {
      icon: <FileText className="w-5 h-5 text-primary" />,
      title: "Clear Terms",
      description: "Transparent and straightforward legal terms"
    },
    {
      icon: <Shield className="w-5 h-5 text-primary" />,
      title: "Your Protection",
      description: "Designed to protect both users and the platform"
    },
    {
      icon: <Users className="w-5 h-5 text-primary" />,
      title: "Community Focus",
      description: "Rules that foster trust and cooperation"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-8 md:pt-12 pb-10 md:pb-16">
        <div className="text-center space-y-4 md:space-y-6">
          {/* <Badge variant="secondary" className="mb-4">
            Legal Information
          </Badge> */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Terms of{" "}
            <span className="text-brand-teal relative">
              Service
              <span className="absolute -bottom-2 left-0 w-full">
                <Image
                  src="/assets/icons/Vector 85.svg"
                  alt="Underline"
                  width={120}
                  height={8}
                  className="w-full"
                />
              </span>
            </span>
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
            Please read these terms carefully. They outline the rules and regulations for using CoopWise and help ensure a safe, fair experience for everyone.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highlights.map((highlight, index) => (
              <Card key={index} className="text-center border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      {highlight.icon}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{highlight.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600">{highlight.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-8">
            {sections.map((section, index) => (
              <Card key={section.id} className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-gray-900" id={section.id}>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {section.content.map((paragraph, idx) => (
                      <p key={idx} className="text-gray-600 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
                {index < sections.length - 1 && (
                  <div className="px-6 pb-6">
                    <Separator />
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Important Notice */}
          <Card className="mt-8 border-l-4 border-l-primary bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Important Notice</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    These terms constitute a legally binding agreement between you and CoopWise. 
                    If you have questions about any section, please contact our legal team before using the service. 
                    By creating an account, you acknowledge that you have read, understood, and agree to these terms.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Start Saving?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Now that you understand our terms, join thousands of people saving smarter with CoopWise.
          </p>
          <div className="flex items-center space-x-4 justify-center">
            <Link href="/auth/signup">
              <Button 
                variant="secondary" 
                className="bg-white text-primary hover:bg-gray-100 px-6 py-3 transition-colors duration-200"
              >
                Get Started Free
              </Button>
            </Link>
            <Link href="/contact">
            <Button 
                variant="secondary" 
                className= "bg-white text-primary hover:bg-gray-100 px-6 py-3 transition-colors duration-200"
              >
                Ask Questions
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
} 