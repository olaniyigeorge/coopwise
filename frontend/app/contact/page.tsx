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
    name: '',
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
      contact: "support@coopwise.com",
      availability: "We respond within 24 hours"
    },
    {
      icon: <Phone className="w-6 h-6 text-primary" />,
      title: "Phone Support",
      description: "Speak with our experts",
      contact: "+1 (555) 123-4567",
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

    const faqData = [    {      question: "How does CoopWise keep my money safe?",      answer: "Your financial security is our top priority. CoopWise employs multiple layers of protection: bank-level 256-bit SSL encryption for all data transmission, partnerships with FDIC-insured financial institutions to safeguard your funds, and we never store your banking credentials on our servers. All transactions are monitored 24/7 for suspicious activity, and we use multi-factor authentication to protect your account. Your money is held in segregated accounts, separate from CoopWise operational funds, ensuring it's always available when you need it."    },    {      question: "What happens if someone in my group doesn't pay?",      answer: "We've designed CoopWise with built-in protection systems to handle this situation fairly. First, our system sends automatic reminders to group members before contribution deadlines. If someone misses a payment, we offer flexible options like payment plans or deadline extensions. Group admins can set grace periods and penalty policies. If persistent issues arise, our mediation team can step in to help resolve conflicts and find solutions that work for everyone. In extreme cases, the group can vote to remove non-contributing members while protecting the interests of committed savers."    },    {      question: "Can I leave a savings group once I've joined?",      answer: "Yes, you have the freedom to leave any savings group at any time. However, we recommend following these steps: 1) Discuss your decision with group members first, as it may affect their savings plans. 2) Check your group's agreed-upon exit policies regarding pending contributions or withdrawals. 3) Ensure any outstanding contributions are settled. 4) Use our 'Leave Group' feature in your account settings. Your past contributions will be handled according to your group's rules - you may receive your proportional share immediately or according to the original payout schedule, depending on what your group agreed upon."    },    {      question: "How much does CoopWise cost?",      answer: "CoopWise is completely free for basic savings groups, which includes creating groups, inviting unlimited members, making contributions, tracking progress, and receiving basic support. We believe everyone should have access to community-powered savings tools. For larger organizations or groups wanting premium features like advanced analytics, priority customer support, custom contribution schedules, or white-label solutions, we offer affordable premium plans starting at $9.99/month. All fees are clearly disclosed upfront with no hidden charges."    },    {      question: "Is there a minimum or maximum group size?",      answer: "CoopWise accommodates groups of all sizes to fit different saving goals and social dynamics. Minimum: 2 people (perfect for couples, friends, or small partnerships). Maximum: 50 people (ideal for large families, organizations, or communities). Sweet spot: 5-15 members, which our data shows provides optimal social support, accountability, and manageable group dynamics. Smaller groups offer intimacy and trust, while larger groups can pool bigger contributions for substantial savings goals. You can always start small and invite more members later as your group grows."    },    {      question: "How do I invite people to my savings group?",      answer: "Inviting members to your savings group is simple and secure: 1) Go to your group dashboard and click 'Invite Members'. 2) Choose from three invitation methods: share your unique group link via text, email, or social media; provide your group's invite code for manual entry; or send direct invitations through the CoopWise app. 3) As the group creator or admin, you can approve or decline join requests to maintain group integrity. 4) New members will receive an invitation with group details, rules, and contribution requirements before they can join. You maintain full control over who joins your savings community."    },    {      question: "What if I need to change my contribution amount?",      answer: "Life circumstances change, and CoopWise provides flexibility to adjust your contribution amount: 1) Submit a change request through your group dashboard, explaining the reason for the adjustment. 2) Your request goes to the group admin and other members for approval via a voting system. 3) If approved, the change takes effect from the next contribution period. 4) All changes are logged transparently so everyone stays informed. 5) You can request increases, decreases, or temporary pauses. This collaborative approach ensures fairness while allowing necessary flexibility for members facing financial changes."    },    {      question: "How do withdrawals work?",      answer: "Withdrawal processes depend on your group's chosen structure, all clearly defined when you join: **Rotating Payout Groups**: Members take turns receiving the total pot according to a predetermined schedule. Each member contributes regularly and receives the full amount once during the cycle. **Individual Savings Groups**: Members can withdraw their personal contributions plus any interest/returns at any time, subject to agreed-upon notice periods. **Goal-Based Groups**: Withdrawals happen when specific savings targets are met. All withdrawal requests are processed within 1-3 business days, and every transaction is logged transparently for all members to see, maintaining trust and accountability."    }  ]

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
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setSubmitted(true)
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-8 md:pt-12 pb-10 md:pb-16">
        <div className="text-center space-y-4 md:space-y-6">
          <Badge variant="secondary" className="mb-4">
            Contact Support
          </Badge>
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
                  <Button 
                    className="mt-4 w-full"
                    variant="outline"
                  >
                    {method.title === "Live Chat" ? "Start Chat" : "Contact Now"}
                  </Button>
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
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Form */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Send us a message
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Fill out the form below and we'll get back to you as soon as possible. We typically respond within 24 hours.
              </p>

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
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
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
                      <div className="font-semibold text-gray-900">Visit our office</div>
                      <div className="text-gray-600">
                        123 Innovation Drive<br />
                        San Francisco, CA 94105<br />
                        United States
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
                <Button 
                  variant="outline" 
                  className="text-primary border-primary hover:bg-primary hover:text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Start Live Chat
                </Button>
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
