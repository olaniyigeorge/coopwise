"use client"

import React, { useState } from 'react'
import DashboardLayout from '@/components/dashboard/layout'
import { MobileCard, MobileGrid, MobileStack } from '@/components/dashboard/mobile-responsive-wrapper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Search, 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  Paperclip, 
  Smile,
  CheckCheck,
  Check,
  Clock,
  Users,
  Plus,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMobile } from '@/hooks/use-mobile'

interface Contact {
  id: string
  name: string
  avatar?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  online: boolean
  type: 'individual' | 'group'
  groupMembers?: number
}

interface Message {
  id: string
  content: string
  timestamp: string
  senderId: string
  senderName: string
  type: 'text' | 'image' | 'file'
  status: 'sending' | 'sent' | 'delivered' | 'read'
  isOwn: boolean
}

const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Education Savers Group',
    lastMessage: 'Great job everyone! This month we saved ₦2.5M',
    lastMessageTime: '2 min ago',
    unreadCount: 3,
    online: true,
    type: 'group',
    groupMembers: 12
  },
  {
    id: '2',
    name: 'John Okafor',
    lastMessage: 'Thanks for the contribution reminder!',
    lastMessageTime: '1 hour ago',
    unreadCount: 0,
    online: true,
    type: 'individual'
  },
  {
    id: '3',
    name: 'House Fund Crew',
    lastMessage: 'Next payout is scheduled for January 15th',
    lastMessageTime: '3 hours ago',
    unreadCount: 1,
    online: false,
    type: 'group',
    groupMembers: 8
  },
  {
    id: '4',
    name: 'Sarah Ibrahim',
    lastMessage: 'How do I check my contribution history?',
    lastMessageTime: '1 day ago',
    unreadCount: 0,
    online: false,
    type: 'individual'
  },
  {
    id: '5',
    name: 'Investment Club',
    lastMessage: 'Monthly meeting scheduled for Friday',
    lastMessageTime: '2 days ago',
    unreadCount: 5,
    online: true,
    type: 'group',
    groupMembers: 25
  }
]

const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Hey everyone! Just wanted to remind you that contributions are due this Friday.',
    timestamp: '10:30 AM',
    senderId: '2',
    senderName: 'John Okafor',
    type: 'text',
    status: 'read',
    isOwn: false
  },
  {
    id: '2',
    content: 'Thanks John! I\'ve already made my contribution for this month.',
    timestamp: '10:32 AM',
    senderId: 'me',
    senderName: 'Me',
    type: 'text',
    status: 'delivered',
    isOwn: true
  },
  {
    id: '3',
    content: 'Great! We\'re making excellent progress towards our savings goal.',
    timestamp: '10:35 AM',
    senderId: '3',
    senderName: 'Sarah Ibrahim',
    type: 'text',
    status: 'read',
    isOwn: false
  },
  {
    id: '4',
    content: 'By the way, has anyone checked the new AI insights feature? It\'s giving some really helpful saving tips!',
    timestamp: '10:40 AM',
    senderId: 'me',
    senderName: 'Me',
    type: 'text',
    status: 'read',
    isOwn: true
  }
]

export default function MessagesPage() {
  const { isMobile } = useMobile()
  const [selectedContact, setSelectedContact] = useState<Contact | null>(mockContacts[0])
  const [searchTerm, setSearchTerm] = useState('')
  const [messageText, setMessageText] = useState('')
  const [showContactsList, setShowContactsList] = useState(!isMobile)

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendMessage = () => {
    if (!messageText.trim()) return
    
    // In a real app, this would send the message via API
    console.log('Sending message:', messageText)
    setMessageText('')
  }

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact)
    if (isMobile) {
      setShowContactsList(false)
    }
  }

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  // Mobile: Show either contacts list or chat view
  if (isMobile) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-180px)] flex flex-col">
          {showContactsList ? (
            // Contacts List View (Mobile)
            <div className="flex-1 flex flex-col">
              {/* Search and Filter */}
              <MobileCard className="mb-4">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="w-4 h-4" />
                  </Button>
                  <Button size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </MobileCard>

              {/* Contacts List */}
              <div className="flex-1 space-y-2">
                {filteredContacts.map((contact) => (
                  <Card 
                    key={contact.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleContactSelect(contact)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={contact.avatar} alt={contact.name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                              {contact.type === 'group' ? <Users className="w-5 h-5" /> : getInitials(contact.name)}
                            </AvatarFallback>
                          </Avatar>
                          {contact.online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-gray-900 truncate">
                              {contact.name}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {contact.lastMessageTime}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 truncate">
                              {contact.lastMessage}
                            </p>
                            {contact.unreadCount > 0 && (
                              <Badge className="bg-primary text-white text-xs ml-2">
                                {contact.unreadCount}
                              </Badge>
                            )}
                          </div>
                          {contact.type === 'group' && contact.groupMembers && (
                            <p className="text-xs text-gray-400 mt-1">
                              {contact.groupMembers} members
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            // Chat View (Mobile)
            selectedContact && (
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowContactsList(true)}
                        >
                          ←
                        </Button>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {selectedContact.type === 'group' ? <Users className="w-4 h-4" /> : getInitials(selectedContact.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-gray-900">{selectedContact.name}</h3>
                          <p className="text-xs text-gray-500">
                            {selectedContact.online ? 'Online' : 'Last seen 2 hours ago'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Video className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Messages */}
                <div className="flex-1 bg-gray-50 rounded-lg p-4 space-y-4 overflow-y-auto">
                  {mockMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-3",
                          message.isOwn
                            ? "bg-primary text-white rounded-br-none"
                            : "bg-white text-gray-900 rounded-bl-none shadow-sm"
                        )}
                      >
                        {!message.isOwn && selectedContact.type === 'group' && (
                          <p className="text-xs font-medium mb-1 opacity-75">
                            {message.senderName}
                          </p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <div className={cn(
                          "flex items-center justify-between mt-2 text-xs",
                          message.isOwn ? "text-white/70" : "text-gray-500"
                        )}>
                          <span>{message.timestamp}</span>
                          {message.isOwn && (
                            <div className="ml-2">
                              {getStatusIcon(message.status)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <Card className="mt-4">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon">
                        <Smile className="w-4 h-4" />
                      </Button>
                      <Button onClick={handleSendMessage} size="icon">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          )}
        </div>
      </DashboardLayout>
    )
  }

  // Desktop Layout
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-180px)] flex gap-6">
        {/* Contacts Sidebar */}
        <div className="w-80 flex flex-col">
          {/* Search and Actions */}
          <MobileCard className="mb-4">
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              New Message
            </Button>
          </MobileCard>

          {/* Contacts List */}
          <div className="flex-1 space-y-2 overflow-y-auto">
            {filteredContacts.map((contact) => (
              <Card 
                key={contact.id}
                className={cn(
                  "cursor-pointer transition-colors",
                  selectedContact?.id === contact.id 
                    ? "border-primary bg-primary/5" 
                    : "hover:bg-gray-50"
                )}
                onClick={() => handleContactSelect(contact)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={contact.avatar} alt={contact.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {contact.type === 'group' ? <Users className="w-5 h-5" /> : getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      {contact.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {contact.name}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {contact.lastMessageTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {contact.lastMessage}
                        </p>
                        {contact.unreadCount > 0 && (
                          <Badge className="bg-primary text-white text-xs ml-2">
                            {contact.unreadCount}
                          </Badge>
                        )}
                      </div>
                      {contact.type === 'group' && contact.groupMembers && (
                        <p className="text-xs text-gray-400 mt-1">
                          {contact.groupMembers} members
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {selectedContact.type === 'group' ? <Users className="w-4 h-4" /> : getInitials(selectedContact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-gray-900">{selectedContact.name}</h3>
                        <p className="text-sm text-gray-500">
                          {selectedContact.online ? 'Online' : 'Last seen 2 hours ago'}
                          {selectedContact.type === 'group' && selectedContact.groupMembers && (
                            <span> • {selectedContact.groupMembers} members</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Messages */}
              <div className="flex-1 bg-gray-50 rounded-lg p-6 space-y-4 overflow-y-auto">
                {mockMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.isOwn ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg p-3",
                        message.isOwn
                          ? "bg-primary text-white rounded-br-none"
                          : "bg-white text-gray-900 rounded-bl-none shadow-sm"
                      )}
                    >
                      {!message.isOwn && selectedContact.type === 'group' && (
                        <p className="text-xs font-medium mb-1 opacity-75">
                          {message.senderName}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <div className={cn(
                        "flex items-center justify-between mt-2 text-xs",
                        message.isOwn ? "text-white/70" : "text-gray-500"
                      )}>
                        <span>{message.timestamp}</span>
                        {message.isOwn && (
                          <div className="ml-2">
                            {getStatusIcon(message.status)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon">
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon">
                      <Smile className="w-5 h-5" />
                    </Button>
                    <Button onClick={handleSendMessage}>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-500">
                  Choose a contact or group to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
} 