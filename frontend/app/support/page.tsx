"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import CTA from '@/components/cta'
import { 
  HelpCircle, 
  MessageCircle, 
  Phone, 
  Mail, 
  BookOpen, 
  Users, 
  Shield, 
  CreditCard,
  Settings,
  AlertTriangle,
  Clock,
  CheckCircle
} from 'lucide-react'

export default function SupportPage() {
    const supportOptions = [    {      icon: <MessageCircle className="w-6 h-6 text-primary" />,      title: "Live Chat",      description: "Get instant help from our support team",      availability: "Available 24/7",      action: "Start Chat",      recommended: true    },    {      icon: <Phone className="w-6 h-6 text-primary" />,      title: "Phone Support",      description: "Speak directly with our experts",      availability: "Mon-Fri, 9AM-6PM EST",      action: "Call Now",      recommended: false    },    {      icon: <Mail className="w-6 h-6 text-primary" />,      title: "Email Support",      description: "Send us a detailed message now",      availability: "Response within 24 hours",      action: "Send Email",      recommended: false    },    {      icon: <BookOpen className="w-6 h-6 text-primary" />,      title: "Help Center",      description: "Browse our comprehensive guides",      availability: "Available anytime",      action: "Browse Guides",      recommended: false    }  ]

  const supportCategories = [
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Group Management",
      description: "Creating, joining, and managing your savings groups",
      topics: [
        "How to create a new savings group",
        "Inviting members to your group",
        "Setting contribution schedules",
        "Managing group permissions",
        "Leaving or dissolving a group"
      ]
    },
    {
      icon: <CreditCard className="w-8 h-8 text-primary" />,
      title: "Payments & Transactions",
      description: "Everything about contributions, withdrawals, and payments",
      topics: [
        "Adding payment methods",
        "Making contributions",
        "Withdrawal process",
        "Transaction history",
        "Payment troubleshooting"
      ]
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Security & Privacy",
      description: "Account security, privacy settings, and data protection",
      topics: [
        "Two-factor authentication setup",
        "Privacy settings management",
        "Reporting suspicious activity",
        "Data export and deletion",
        "Account recovery"
      ]
    },
    {
      icon: <Settings className="w-8 h-8 text-primary" />,
      title: "Account Settings",
      description: "Profile management, notifications, and preferences",
      topics: [
        "Updating profile information",
        "Notification preferences",
        "Linking bank accounts",
        "Identity verification",
        "Account deactivation"
      ]
    }
  ]

    const quickAnswers = [    {      question: "How do I reset my password?",      answer: "To reset your password: 1) Go to the CoopWise login page and click 'Forgot Password'. 2) Enter the email address associated with your account. 3) Check your email for a secure reset link (also check spam/junk folders). 4) Click the link and create a new strong password with at least 8 characters, including uppercase, lowercase, numbers, and symbols. 5) Log in with your new password. If you don't receive the email within 10 minutes, contact our support team for immediate assistance."    },    {      question: "Is my money safe with CoopWise?",      answer: "Absolutely. Your financial security is our highest priority. CoopWise employs multiple security layers: bank-level 256-bit SSL encryption, partnerships with FDIC-insured financial institutions, 24/7 transaction monitoring, multi-factor authentication, and segregated account management. We never store banking credentials and undergo regular security audits. Your funds are held separately from our operational accounts and are always accessible to you. We maintain comprehensive insurance coverage and comply with all financial regulations."    },    {      question: "Can I leave a savings group anytime?",      answer: "Yes, you have complete freedom to leave any savings group. Here's the process: 1) Navigate to your group settings and select 'Leave Group'. 2) Review any pending contributions or upcoming payouts that might be affected. 3) Consider discussing with group members first, as your departure may impact their savings plans. 4) Complete any outstanding financial obligations according to your group's rules. 5) Confirm your departure. Your contribution history remains transparent, and you'll receive your share according to the group's established payout structure."    },    {      question: "How do I invite people to my group?",      answer: "Inviting members is simple and secure: 1) Access your group dashboard and click 'Manage Members' or 'Invite'. 2) Choose your preferred method: share the unique group link via text, email, or social media; provide the group's invite code for manual entry; or send direct app invitations. 3) Set invitation permissions - you can require admin approval for new members. 4) Include personalized messages explaining your savings goals. 5) Track invitation status and approve/decline requests as needed. All invitations include group details, rules, and contribution requirements for transparency."    },    {      question: "What happens if someone doesn't pay?",      answer: "CoopWise has comprehensive systems to handle missed payments fairly: 1) Automatic reminders are sent before due dates and after missed payments. 2) Flexible options include payment plans, deadline extensions, or temporary contribution adjustments. 3) Group admins can set grace periods and late payment policies. 4) Our mediation team can help resolve persistent issues and facilitate group discussions. 5) Repeat offenders may face group removal through democratic voting. 6) All communication is logged transparently to maintain group trust and accountability."    },    {      question: "How much does CoopWise cost?",      answer: "CoopWise offers transparent, affordable pricing: **FREE Basic Plan** includes unlimited group creation, member invitations, contribution tracking, basic analytics, and standard support. **Premium Plans** start at $9.99/month for advanced features like detailed analytics, priority support, custom contribution schedules, automated reminders, and white-label options for organizations. **Enterprise Solutions** available for large groups (50+ members) with dedicated support and custom features. No hidden fees, no transaction charges, and all pricing is clearly displayed upfront."    },    {      question: "How do I contact customer support?",      answer: "We offer multiple convenient support channels: 1) **Live Chat** (recommended) - Available 24/7 through our website or app for instant assistance. 2) **Email Support** - Send detailed inquiries to support@coopwise.com with response within 24 hours. 3) **Phone Support** - Call during business hours (Mon-Fri, 9AM-6PM EST) for direct conversation. 4) **Help Center** - Browse our comprehensive self-service knowledge base anytime. 5) **Emergency Line** - Available 24/7 for security-related issues or urgent account problems. Choose the method that works best for your situation."    },    {      question: "What types of savings groups can I create?",      answer: "CoopWise supports diverse savings group structures to match your goals: **Rotating Savings Groups (ROSCAs)** - Members contribute regularly and take turns receiving the full pot. **Goal-Based Groups** - Save collectively toward specific targets like vacations, emergency funds, or major purchases. **Individual Savings Groups** - Personal accounts with community support and motivation. **Family Savings** - Coordinate household savings goals with spouse, children, or extended family. **Workplace Groups** - Colleague-based savings for team events or shared goals. **Community Groups** - Neighborhood or friend circles saving for mutual support. Each type offers customizable rules, contribution schedules, and payout structures."    }  ]

  const statusItems = [
    {
      service: "Platform Status",
      status: "Operational",
      icon: <CheckCircle className="w-4 h-4 text-green-500" />
    },
    {
      service: "Payment Processing",
      status: "Operational", 
      icon: <CheckCircle className="w-4 h-4 text-green-500" />
    },
    {
      service: "Mobile App",
      status: "Operational",
      icon: <CheckCircle className="w-4 h-4 text-green-500" />
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-8 md:pt-12 pb-10 md:pb-16">
        <div className="text-center space-y-4 md:space-y-6">
          <Badge variant="secondary" className="mb-4">
            Help & Support
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            How Can We{" "}
            <span className="text-brand-teal relative">
              Help
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
            You?
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions, get help with your account, or reach out to our support team. We're here to ensure your CoopWise experience is smooth and successful.
          </p>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Get Support Your Way
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the support method that works best for you. Our team is ready to help through multiple channels.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportOptions.map((option, index) => (
              <Card key={index} className="text-center border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      {option.icon}
                    </div>
                  </div>
                  <CardTitle className="text-lg mb-2">{option.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 mb-3">{option.description}</p>
                  <div className="text-sm text-gray-500 mb-4 flex items-center justify-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {option.availability}
                  </div>
                  <Button 
                    className="w-full"
                    variant="outline"
                  >
                    {option.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Support Categories */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Browse by Topic
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find help articles and guides organized by category to quickly locate the information you need.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {supportCategories.map((category, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      {category.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{category.title}</CardTitle>
                      <p className="text-gray-600 text-sm">{category.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {category.topics.map((topic, idx) => (
                      <Link key={idx} href="#" className="flex items-center text-gray-600 hover:text-primary transition-colors">
                        <HelpCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">{topic}</span>
                      </Link>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    View All Articles
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Answers */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Quick Answers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get instant answers to the most commonly asked questions about CoopWise.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {quickAnswers.map((qa, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white rounded-lg border shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-gray-50">
                  <span className="font-semibold text-gray-900">{qa.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  {qa.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">Can't find what you're looking for?</p>
            <div className="flex items-center space-x-4 justify-center">
              <Link href="/contact">
                <Button variant="outline" className="text-primary border-primary hover:bg-primary hover:text-white">
                  Contact Support
                </Button>
              </Link>
              <Button>
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Live Chat
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* System Status */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">System Status</CardTitle>
              <p className="text-gray-600">Current operational status of CoopWise services</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statusItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{item.service}</span>
                    <div className="flex items-center space-x-2">
                      {item.icon}
                      <span className="text-sm text-gray-600">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="#" className="text-primary hover:underline text-sm">
                  View detailed status page →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Emergency Support */}
      <section className="py-12 bg-red-50 border-y border-red-100">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="border-red-200 bg-white">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Emergency Support</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    If you suspect unauthorized access to your account, notice suspicious transactions, 
                    or encounter any security-related issues, contact us immediately.
                  </p>
                  <div className="flex items-center space-x-4">
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                      <Phone className="w-4 h-4 mr-2" />
                      Emergency Line
                    </Button>
                    <span className="text-sm text-gray-500">Available 24/7</span>
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
              Still Need Help?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Our support team is standing by to help you succeed with CoopWise. Don't hesitate to reach out.
            </p>
            <div className="flex items-center space-x-4 justify-center">
              <Button 
                variant="secondary" 
                className="bg-white text-primary hover:bg-gray-100 px-6 py-3 transition-colors duration-200"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Live Chat
              </Button>
              <Link href="/contact">
                <Button 
                  variant="secondary" 
                  className="bg-white text-primary hover:bg-gray-100 px-6 py-3 transition-colors duration-200"
                >
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>

      <Footer />
    </div>
  )
} 