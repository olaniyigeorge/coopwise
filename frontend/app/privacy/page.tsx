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
import { Shield, Eye, Lock, Settings, AlertCircle, Database } from 'lucide-react'

export default function PrivacyPage() {
  const lastUpdated = "December 15, 2024"

  const sections = [
    {
      id: "introduction",
      title: "1. Introduction",
      content: [
        "At CoopWise, we take your privacy seriously. This Privacy Policy explains how we collect, use, protect, and share your personal information when you use our savings group platform.",
        "This policy applies to all users of CoopWise and covers both our website and mobile applications.",
        "By using CoopWise, you consent to the data practices described in this policy."
      ]
    },
    {
      id: "information-collected",
      title: "2. Information We Collect",
      content: [
        "Personal Information: Name, email address, phone number, date of birth, and address for identity verification and account creation.",
        "Financial Information: Bank account details (encrypted), transaction history within the platform, and savings group activity.",
        "Usage Data: How you interact with our platform, device information, IP addresses, and browser type.",
        "Communications: Messages within savings groups, customer support interactions, and feedback you provide.",
        "Verification Documents: Government-issued ID and other documents required for identity verification and compliance."
      ]
    },
    {
      id: "how-we-use",
      title: "3. How We Use Your Information",
      content: [
        "To provide and maintain our savings group platform and related services.",
        "To process transactions, contributions, and withdrawals within your savings groups.",
        "To verify your identity and prevent fraud, money laundering, and other illegal activities.",
        "To send you important updates about your account, groups, and contributions.",
        "To provide customer support and respond to your inquiries.",
        "To improve our services through analytics and user feedback.",
        "To comply with legal and regulatory requirements."
      ]
    },
    {
      id: "information-sharing",
      title: "4. Information Sharing",
      content: [
        "With Group Members: Basic profile information and contribution status within your savings groups.",
        "With Service Providers: Trusted third parties who help us operate our platform, including payment processors and identity verification services.",
        "With Financial Institutions: Banks and payment processors for transaction processing and fund management.",
        "For Legal Compliance: When required by law, court order, or to protect our rights and safety.",
        "With Your Consent: Any other sharing will be done only with your explicit permission.",
        "We never sell your personal information to advertisers or marketing companies."
      ]
    },
    {
      id: "data-security",
      title: "5. Data Security",
      content: [
        "We use bank-level 256-bit SSL encryption to protect your data in transit and at rest.",
        "Financial information is stored with FDIC-insured partner institutions using industry-standard security protocols.",
        "We employ multi-factor authentication and regular security audits to prevent unauthorized access.",
        "Our team receives regular security training and follows strict access controls.",
        "We monitor our systems 24/7 for suspicious activity and potential security threats.",
        "In the unlikely event of a security breach, we will notify affected users promptly."
      ]
    },
    {
      id: "data-retention",
      title: "6. Data Retention",
      content: [
        "We retain your personal information only as long as necessary to provide our services and comply with legal obligations.",
        "Account information is kept for the duration of your account plus 7 years for financial record-keeping requirements.",
        "Transaction records are maintained as required by financial regulations and tax laws.",
        "You can request deletion of your data, subject to legal and regulatory requirements.",
        "Inactive accounts may be archived after 3 years of inactivity with prior notice."
      ]
    },
    {
      id: "your-rights",
      title: "7. Your Privacy Rights",
      content: [
        "Access: You can request a copy of the personal information we have about you.",
        "Correction: You can update or correct your personal information through your account settings.",
        "Deletion: You can request deletion of your account and associated data, subject to legal requirements.",
        "Portability: You can request a copy of your data in a machine-readable format.",
        "Withdrawal of Consent: You can withdraw consent for non-essential data processing.",
        "To exercise these rights, contact us at privacy@coopwise.com."
      ]
    },
    {
      id: "cookies-tracking",
      title: "8. Cookies and Tracking",
      content: [
        "We use essential cookies to operate our platform and remember your login status.",
        "Analytics cookies help us understand how users interact with our platform to improve the experience.",
        "We do not use advertising cookies or track you across other websites.",
        "You can control cookie settings through your browser, though this may affect platform functionality.",
        "We use anonymized analytics data to improve our services and user experience."
      ]
    },
    {
      id: "third-party-services",
      title: "9. Third-Party Services",
      content: [
        "We integrate with trusted payment processors and banks to facilitate transactions.",
        "Identity verification services help us comply with financial regulations.",
        "Customer support tools enable us to provide better assistance.",
        "All third-party services are carefully vetted and must meet our security and privacy standards.",
        "These services operate under their own privacy policies, which we encourage you to review."
      ]
    },
    {
      id: "international-transfers",
      title: "10. International Data Transfers",
      content: [
        "CoopWise operates primarily in the United States, and your data is stored on servers located in the US.",
        "If you access our service from outside the US, your data may be transferred to and processed in the US.",
        "We ensure appropriate safeguards are in place for any international data transfers.",
        "We comply with applicable international privacy laws and regulations."
      ]
    },
    {
      id: "children-privacy",
      title: "11. Children's Privacy",
      content: [
        "CoopWise is not intended for use by individuals under 18 years of age.",
        "We do not knowingly collect personal information from children under 18.",
        "If we become aware that we have collected information from a child under 18, we will delete it promptly.",
        "Parents or guardians who believe their child has provided information to us should contact us immediately."
      ]
    },
    {
      id: "changes-policy",
      title: "12. Changes to This Policy",
      content: [
        "We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.",
        "Material changes will be communicated via email and prominent notice on our platform.",
        "We will indicate the date of the most recent update at the top of this policy.",
        "Continued use of our service after changes constitutes acceptance of the updated policy."
      ]
    }
  ]

  const highlights = [
    {
      icon: <Shield className="w-5 h-5 text-primary" />,
      title: "Bank-Level Security",
      description: "256-bit encryption and FDIC-insured protection"
    },
    {
      icon: <Eye className="w-5 h-5 text-primary" />,
      title: "Full Transparency",
      description: "Clear information about data collection and use"
    },
    {
      icon: <Lock className="w-5 h-5 text-primary" />,
      title: "Your Control",
      description: "Comprehensive privacy rights and controls"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-8 md:pt-12 pb-10 md:pb-16">
        <div className="text-center space-y-4 md:space-y-6">
          <Badge variant="secondary" className="mb-4">
            Privacy & Security
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Privacy{" "}
            <span className="text-brand-teal relative">
              Policy
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
            Your privacy is fundamental to our mission. Learn how we protect, use, and manage your personal information with the highest standards of security and transparency.
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

      {/* Privacy Content */}
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

          {/* Privacy Notice */}
          <Card className="mt-8 border-l-4 border-l-primary bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Database className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Your Data, Your Rights</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    You have complete control over your personal information. You can access, update, or delete your data at any time. 
                    For privacy-related questions or to exercise your rights, contact us at privacy@coopwise.com.
                  </p>
                  <div className="flex items-center space-x-4">
                    <Link href="/contact">
                      <Button size="sm" variant="outline" className="text-primary border-primary hover:bg-primary hover:text-white">
                        <Settings className="w-4 h-4 mr-2" />
                        Contact Privacy Team
                      </Button>
                    </Link>
                  </div>
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
            Your Privacy is Protected
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join CoopWise with confidence knowing your personal and financial information is secure and protected.
          </p>
          <div className="flex items-center space-x-4 justify-center">
            <Link href="/auth/signup">
              <Button 
                variant="secondary" 
                className="bg-white text-primary hover:bg-gray-100 px-6 py-3 transition-colors duration-200"
              >
                Get Started Securely
              </Button>
            </Link>
            <Link href="/contact">
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-primary px-6 py-3 transition-colors duration-200"
              >
                Privacy Questions
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
} 