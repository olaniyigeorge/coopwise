"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import ComingSoonWrapper from '@/components/ui/coming-soon-wrapper'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Send, 
  CheckCircle,
  HelpCircle,
  Users,
  Shield,
  Zap
} from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6 text-primary" />,
      title: "Email Support",
      description: "Get help from our team",
      contact: "hellocoopwise@gmail.com",
      availability: "We respond within 24 hours"
    },
    {
      icon: <Phone className="w-6 h-6 text-primary" />,
      title: "Phone Support",
      description: "Speak with our experts",
      contact: "+234 814 4441 712",
      availability: "Mon-Fri, 9AM-6PM EST"
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-primary" />,
      title: "Live Chat",
      description: "Instant help when you need it",
      contact: "Chat with us",
      availability: "Available 24/7"
    }
  ]

  const faqData = [
    {
      question: "How does CoopWise keep my money safe?",
      answer: "We keep your money in stable digital currency (like USDT) to protect it from market ups and downs. It stays secure and steady until you're ready to use it."
    },
    {
      question: "What happens if someone in my group doesn't pay?",
      answer: "The \"group admin\" can remove them. If they've received money before, CoopWise may auto-deduct what they owe. It's best to only invite people you trust."
    },
    {
      question: "Can I leave a savings group?",
      answer: "Yes, as long as you don't owe the group any money (outstanding loans and unpaid contributions). If you've paid up, you're free to leave anytime."
    },
    {
      question: "How much does CoopWise cost?",
      answer: "We charge a small fee (2–5%) only when payouts happen. No monthly fees, no hidden charges."
    },
    {
      question: "Is there a group size limit?",
      answer: "No. You can save solo or with as many people as you want. It's totally up to you. A tip will be to join small groups with trusted members."
    },
    {
      question: "How do I invite people to my group?",
      answer: "Click on \"share invite\" in your group to get a the invite code, send them your invite code. They click, view the group, and join if they want."
    },
    {
      question: "Can I change my contribution amount?",
      answer: "It depends on your group's rules. Some allow it, others don't. If needed, you can always join or create a group that fits your budget."
    },
    {
      question: "How do withdrawals work?",
      answer: "When you request a withdrawal, we send the money straight to your bank account. Group payouts work the same, just confirm and get paid."
    }
  ]

  const supportTopics = [
    {
      icon: <Users className="w-5 h-5" />,
      title: "Group Management",
      description: "Help with creating, joining, or managing your savings group"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Security & Safety",
      description: "Questions about account security and fund protection"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Technical Issues",
      description: "App problems, login issues, or feature requests"
    }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    // TODO call -> /api/v1/support/write-us
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setSubmitted(true)
    setFormData({ full_name: '', email: '', subject: '', message: '' })
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-8 md:pt-12 pb-10 md:pb-16">
        <div className="text-center space-y-4 md:space-y-6">
      
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            We're Here to{" "}
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
            </span>
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto">
            Have questions about CoopWise? Need help with your savings group? Our support team is ready to assist you every step of the way.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the contact method that works best for you. We're available through multiple channels to provide the support you need.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {contactMethods.map((method, index) => (
              <Card key={index} className="text-center border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      {method.icon}
                    </div>
                  </div>
                  <CardTitle className="text-lg mb-2">{method.title}</CardTitle>
                  <CardDescription className="text-gray-600 mb-3">
                    {method.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="font-semibold text-primary mb-2">{method.contact}</div>
                  <div className="text-sm text-gray-500">{method.availability}</div>
                  {method.title === "Email Support" ? (
                    <Link href={`mailto:${method.contact}`}>
                      <Button 
                        className="mt-4 w-full"
                        variant="outline"
                      >
                        Contact Now
                      </Button>
                    </Link>
                  ) : method.title === "Phone Support" ? (
                    <Link href={`tel:${method.contact.replace(/\s+/g, '')}`}>
                      <Button 
                        className="mt-4 w-full"
                        variant="outline"
                      >
                        Contact Now
                      </Button>
                    </Link>
                  ) : (
                    <ComingSoonWrapper
                      title="Live Chat Coming Soon"
                      description="Our live chat support feature is currently under development. Please use email or phone support in the meantime."
                    >
                      <Button 
                        className="mt-4 w-full"
                        variant="outline"
                      >
                        Start Chat
                      </Button>
                    </ComingSoonWrapper>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Support Topics */}
          <div className="bg-white rounded-lg p-8 shadow-sm border">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
              What can we help you with?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {supportTopics.map((topic, index) => (
                <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {topic.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{topic.title}</div>
                    <div className="text-sm text-gray-600">{topic.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
            {/* Form */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Send us a message
              </h2>
              <div className="flex items-center gap-3 mb-4">
                <p className="text-lg text-gray-600">
                Fill out the form below and we'll get back to you as soon as possible. We typically respond within 24 hours.
              </p>
                <Badge className="bg-red-100 text-red-800 whitespace-nowrap">Coming Soon</Badge>
              </div>

              {submitted && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Thank you for your message! We've received it and will get back to you within 24 hours.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="How can we help you?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us more about your question or issue..."
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full md:w-auto px-8"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Other ways to reach us
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg mt-1">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                      <div className="font-semibold text-gray-900">Visit our office</div>
                        <Badge className="bg-red-100 text-red-800">Coming Soon</Badge>
                      </div>
                      <div className="text-gray-600">
                        123 Innovation Drive<br />
                        Lagos State,<br />
                        Nigeria
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg mt-1">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Business hours</div>
                      <div className="text-gray-600">
                        Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                        Saturday: 10:00 AM - 4:00 PM PST<br />
                        Sunday: Closed
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-2">Need immediate help?</h4>
                <p className="text-gray-600 mb-4">
                  For urgent issues or account emergencies, our live chat is available 24/7.
                </p>
                <ComingSoonWrapper
                  title="Live Chat Coming Soon"
                  description="Our live chat support feature is currently under development. Please use email or phone support in the meantime."
                >
                  <Button 
                    variant="outline" 
                    className="text-primary border-primary hover:bg-primary hover:text-white"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Start Live Chat
                  </Button>
                </ComingSoonWrapper>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <HelpCircle className="w-8 h-8 text-primary mr-3" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Frequently Asked Questions
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find quick answers to common questions about CoopWise. Can't find what you're looking for? Contact our support team.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqData.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white rounded-lg border shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-gray-50">
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <Link href="#contact-form">
              <Button variant="outline" className="text-primary border-primary hover:bg-primary hover:text-white">
                Contact Our Support Team
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Start Saving with CoopWise?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of people who are already saving money smarter with our community-powered platform.
          </p>
                    <div className="flex items-center space-x-4 justify-center">            <Link href="/auth/signup">         
                         <Button                 variant="secondary"                 className="bg-white text-primary hover:bg-gray-100 px-6 py-3 transition-colors duration-200"              >                Get Started Free              </Button>      
                               </Link>            <Link href="/how-it-works">          <Button 
                variant="secondary" 
                className= "bg-white text-primary hover:bg-gray-100 px-6 py-3 transition-colors duration-200"
              >    
                                          Learn How It Works              </Button>            </Link>          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
