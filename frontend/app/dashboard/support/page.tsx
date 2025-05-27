"use client"

import React, { useState } from 'react'
import DashboardLayout from '@/components/dashboard/layout'
import { MobileCard, MobileGrid, MobileStack } from '@/components/dashboard/mobile-responsive-wrapper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Search, 
  ChevronDown, 
  ChevronRight,
  MessageCircle, 
  Phone, 
  Mail, 
  BookOpen,
  HelpCircle,
  Send,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  ThumbsUp,
  ThumbsDown,
  User,
  FileText,
  CreditCard,
  Settings,
  Shield,
  DollarSign,
  Users,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  helpful?: number
  notHelpful?: number
}

interface SupportTicket {
  id: string
  subject: string
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  lastUpdate: string
  category: string
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How do I make a contribution to my savings group?',
    answer: 'To make a contribution, go to your dashboard and click "Make Contribution". Select your group, enter the amount, and choose your payment method. You can pay via bank transfer, card payment, or mobile money.',
    category: 'Contributions',
    helpful: 45,
    notHelpful: 2
  },
  {
    id: '2',
    question: 'When will I receive my payout?',
    answer: 'Payouts are scheduled based on your group\'s rotation. You can check your payout position and estimated date in the group details page. You\'ll receive notifications 7 days before your payout date.',
    category: 'Payouts',
    helpful: 38,
    notHelpful: 1
  },
  {
    id: '3',
    question: 'How do I create a savings group?',
    answer: 'Click "Create Group" from your dashboard. Set your group name, contribution amount, frequency, and member limit. Share the group code with friends to invite them. The group starts when you reach minimum members.',
    category: 'Groups',
    helpful: 52,
    notHelpful: 3
  },
  {
    id: '4',
    question: 'What happens if I miss a contribution?',
    answer: 'If you miss a contribution, you\'ll have a 3-day grace period to make the payment with a small late fee. After this period, you may be removed from the group rotation. Contact your group admin for assistance.',
    category: 'Contributions',
    helpful: 29,
    notHelpful: 5
  },
  {
    id: '5',
    question: 'How secure are my funds and personal information?',
    answer: 'We use bank-level encryption and are regulated by the Central Bank. Your funds are held in segregated accounts with partner banks. We never store your payment details and comply with all data protection regulations.',
    category: 'Security',
    helpful: 67,
    notHelpful: 1
  },
  {
    id: '6',
    question: 'Can I leave a group before my payout?',
    answer: 'You can leave a group, but you may forfeit your position in the payout rotation. Any contributions made are non-refundable. Contact support to discuss your options if you need to leave early.',
    category: 'Groups',
    helpful: 24,
    notHelpful: 8
  }
]

const mockTickets: SupportTicket[] = [
  {
    id: 'TKT001',
    subject: 'Unable to make payment via card',
    status: 'in-progress',
    priority: 'medium',
    createdAt: '2024-01-15',
    lastUpdate: '2 hours ago',
    category: 'Payment Issues'
  },
  {
    id: 'TKT002',
    subject: 'Question about group payout schedule',
    status: 'resolved',
    priority: 'low',
    createdAt: '2024-01-10',
    lastUpdate: '3 days ago',
    category: 'General Inquiry'
  }
]

const categories = [
  { id: 'all', name: 'All Topics', icon: <BookOpen className="w-4 h-4" />, count: faqData.length },
  { id: 'Contributions', name: 'Contributions', icon: <DollarSign className="w-4 h-4" />, count: 2 },
  { id: 'Payouts', name: 'Payouts', icon: <CreditCard className="w-4 h-4" />, count: 1 },
  { id: 'Groups', name: 'Groups', icon: <Users className="w-4 h-4" />, count: 2 },
  { id: 'Security', name: 'Security', icon: <Shield className="w-4 h-4" />, count: 1 },
  { id: 'Account', name: 'Account', icon: <User className="w-4 h-4" />, count: 0 }
]

export default function SupportPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeSection, setActiveSection] = useState<'faq' | 'contact' | 'tickets'>('faq')
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    message: ''
  })
  const [openFAQs, setOpenFAQs] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleFAQ = (id: string) => {
    setOpenFAQs(prev => 
      prev.includes(id) 
        ? prev.filter(faqId => faqId !== id)
        : [...prev, id]
    )
  }

  const handleContactSubmit = async () => {
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast.success('Support ticket created successfully!', {
      description: 'We\'ll get back to you within 24 hours.'
    })
    
    setContactForm({
      subject: '',
      category: 'general',
      priority: 'medium',
      message: ''
    })
    
    setIsSubmitting(false)
    setActiveSection('tickets')
  }

  const getStatusBadge = (status: SupportTicket['status']) => {
    const variants = {
      'open': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'resolved': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800'
    }
    return variants[status]
  }

  const getPriorityBadge = (priority: SupportTicket['priority']) => {
    const variants = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    }
    return variants[priority]
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            How can we help you?
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions, contact our support team, or browse our help resources
          </p>
          
          {/* Search Bar */}
          <div className="max-w-lg mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search for help..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-base"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <MobileGrid cols={{ base: 1, sm: 2, lg: 4 }} className="mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="font-medium mb-1">Live Chat</h3>
              <p className="text-sm text-gray-600 mb-3">Chat with our support team</p>
              <Badge className="bg-green-100 text-green-800">Available</Badge>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="font-medium mb-1">Call Support</h3>
              <p className="text-sm text-gray-600 mb-3">+234 (0) 800 COOP-WISE</p>
              <Badge className="bg-blue-100 text-blue-800">Mon-Fri 9AM-6PM</Badge>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-medium mb-1">Email Support</h3>
              <p className="text-sm text-gray-600 mb-3">support@coopwise.com</p>
              <Badge className="bg-gray-100 text-gray-800">24-48 hours</Badge>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-medium mb-1">Help Center</h3>
              <p className="text-sm text-gray-600 mb-3">Browse guides & tutorials</p>
              <Badge className="bg-purple-100 text-purple-800">24/7 Access</Badge>
            </CardContent>
          </Card>
        </MobileGrid>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'faq', label: 'FAQ', icon: <HelpCircle className="w-4 h-4" /> },
            { id: 'contact', label: 'Contact Us', icon: <MessageCircle className="w-4 h-4" /> },
            { id: 'tickets', label: 'My Tickets', icon: <FileText className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeSection === tab.id
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* FAQ Section */}
        {activeSection === 'faq' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors",
                        selectedCategory === category.id
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {category.icon}
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {category.count}
                      </Badge>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* FAQ List */}
            <div className="lg:col-span-3 space-y-4">
              {filteredFAQs.length > 0 ? (
                filteredFAQs.map((faq) => (
                  <Card key={faq.id}>
                    <Collapsible open={openFAQs.includes(faq.id)} onOpenChange={() => toggleFAQ(faq.id)}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 text-left">
                              <CardTitle className="text-base font-medium pr-4">
                                {faq.question}
                              </CardTitle>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {faq.category}
                              </Badge>
                            </div>
                            <ChevronDown className={cn(
                              "w-5 h-5 text-gray-400 transition-transform",
                              openFAQs.includes(faq.id) && "transform rotate-180"
                            )} />
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <p className="text-gray-700 mb-4">{faq.answer}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-500">Was this helpful?</span>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="h-8 px-2">
                                  <ThumbsUp className="w-4 h-4 mr-1" />
                                  {faq.helpful}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 px-2">
                                  <ThumbsDown className="w-4 h-4 mr-1" />
                                  {faq.notHelpful}
                                </Button>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Guide
                            </Button>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-500 mb-4">
                      Try adjusting your search terms or browse all categories
                    </p>
                    <Button onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('all')
                    }}>
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Contact Form Section */}
        {activeSection === 'contact' && (
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <p className="text-gray-600">
                Can't find what you're looking for? Send us a message and we'll get back to you.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Subject *</label>
                  <Input
                    placeholder="Brief description of your issue"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                                 <div>                   <label htmlFor="category-select" className="block text-sm font-medium mb-2">Category</label>                   <select                      id="category-select"                     className="w-full p-2 border border-gray-300 rounded-md"                     value={contactForm.category}                     onChange={(e) => setContactForm(prev => ({ ...prev, category: e.target.value }))}                   >
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Issue</option>
                    <option value="payment">Payment Issue</option>
                    <option value="account">Account Issue</option>
                    <option value="group">Group Management</option>
                    <option value="billing">Billing Question</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <div className="flex gap-2">
                  {[
                    { value: 'low', label: 'Low', color: 'gray' },
                    { value: 'medium', label: 'Medium', color: 'blue' },
                    { value: 'high', label: 'High', color: 'orange' },
                    { value: 'urgent', label: 'Urgent', color: 'red' }
                  ].map((priority) => (
                    <button
                      key={priority.value}
                      onClick={() => setContactForm(prev => ({ ...prev, priority: priority.value as any }))}
                      className={cn(
                        "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                        contactForm.priority === priority.value
                          ? `bg-${priority.color}-100 text-${priority.color}-800 border border-${priority.color}-200`
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message *</label>
                <Textarea
                  placeholder="Please describe your issue in detail..."
                  rows={6}
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleContactSubmit}
                  disabled={isSubmitting}
                  className="min-w-[140px]"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Tickets Section */}
        {activeSection === 'tickets' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Support Tickets</h2>
              <Button onClick={() => setActiveSection('contact')}>
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </div>

            {mockTickets.length > 0 ? (
              <div className="space-y-4">
                {mockTickets.map((ticket) => (
                  <Card key={ticket.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                            <Badge className={getStatusBadge(ticket.status)}>
                              {ticket.status.replace('-', ' ')}
                            </Badge>
                            <Badge className={getPriorityBadge(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>#{ticket.id}</span>
                            <span>Created: {ticket.createdAt}</span>
                            <span>Last update: {ticket.lastUpdate}</span>
                            <Badge variant="outline">{ticket.category}</Badge>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets</h3>
                  <p className="text-gray-500 mb-4">
                    You haven't created any support tickets yet.
                  </p>
                  <Button onClick={() => setActiveSection('contact')}>
                    Create Your First Ticket
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 