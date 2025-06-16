"use client"

import React, { useState, useRef, useEffect } from 'react'
import ApiErrorMessage from './api-error-message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Send, Sparkles, Bot, User, RefreshCw, ChevronDown } from 'lucide-react'
import ComingSoonWrapper from '@/components/ui/coming-soon-wrapper'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Message = {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

type TemplatePrompt = {
  id: string
  title: string
  prompt: string
  category: 'savings' | 'budgeting' | 'investing' | 'general'
}

const templatePrompts: TemplatePrompt[] = [
  {
    id: 'budget-plan',
    title: 'Create a budget plan',
    prompt: 'Can you help me create a monthly budget plan based on an income of ₦150,000?',
    category: 'budgeting'
  },
  {
    id: 'savings-goal',
    title: 'Savings goal strategy',
    prompt: 'What strategy should I use to save ₦500,000 in 6 months?',
    category: 'savings'
  },
  {
    id: 'expense-reduce',
    title: 'Reduce expenses',
    prompt: 'What are 5 practical ways I can reduce my daily expenses?',
    category: 'budgeting'
  },
  {
    id: 'investment-start',
    title: 'Start investing',
    prompt: 'I have ₦100,000 saved. What are some safe investment options for beginners?',
    category: 'investing'
  },
  {
    id: 'emergency-fund',
    title: 'Emergency fund',
    prompt: 'How much should I have in my emergency fund and how can I build it quickly?',
    category: 'savings'
  },
  {
    id: 'debt-strategy',
    title: 'Debt payment strategy',
    prompt: 'What\'s the best strategy to pay off multiple debts with limited income?',
    category: 'general'
  }
]

export default function AIChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your CoopWise AI assistant. How can I help you with your savings and financial goals today?',
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [apiError, setApiError] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setApiError(null)

    try {
      // Import dynamically to avoid server-side rendering issues
      const { aiService } = await import('@/services/ai-service')
      
      // Always use the Gemini API since we have the API key
      const aiResponseText = await aiService.sendMessage(userMessage.content);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponseText,
        role: 'assistant',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error('Error sending message to AI:', error)
      
      // Set API error
      setApiError('Failed to connect to the AI service. Please try again later.')
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error processing your request. Please try again later.',
        role: 'assistant',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handlePromptSelect = (prompt: string) => {
    setInputValue(prompt)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const filteredPrompts = selectedCategory === 'all' 
    ? templatePrompts 
    : templatePrompts.filter(p => p.category === selectedCategory)



  // Handle retry when API error occurs
  const handleRetry = () => {
    setApiError(null)
    if (messages.length > 1 && messages[messages.length - 1].role === 'assistant') {
      // Remove the last error message
      setMessages(messages.slice(0, -1))
    }
  }

    return (
    <div className="flex flex-col h-[calc(100vh-160px)] w-full">
      {apiError ? (
        <ApiErrorMessage message={apiError} onRetry={handleRetry} />
      ) : (
        <Card className="flex flex-col h-full w-full border-none shadow-none rounded-none">
        <CardHeader className="pb-2 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-lg">AI Savings Assistant</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2"
                onClick={async () => {
                  setIsLoading(true)
                  try {
                    // Import dynamically to avoid server-side rendering issues
                    const { aiService } = await import('@/services/ai-service')
                    await aiService.resetChat()
                    
                    setMessages([
                      {
                        id: '1',
                        content: 'Hello! I\'m your CoopWise AI assistant. How can I help you with your savings and financial goals today?',
                        role: 'assistant',
                        timestamp: new Date()
                      }
                    ])
                  } catch (error) {
                    console.error('Error resetting chat:', error)
                  } finally {
                    setIsLoading(false)
                  }
                }}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">New Chat</span>
              </Button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 mt-2">
              <Badge 
                variant={selectedCategory === 'all' ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('all')}
              >
                All
              </Badge>
              <Badge 
                variant={selectedCategory === 'savings' ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('savings')}
              >
                Savings
              </Badge>
              <Badge 
                variant={selectedCategory === 'budgeting' ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('budgeting')}
              >
                Budgeting
              </Badge>
              <Badge 
                variant={selectedCategory === 'investing' ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('investing')}
              >
                Investing
              </Badge>
              <Badge 
                variant={selectedCategory === 'general' ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('general')}
              >
                General
              </Badge>
            </div>
          </CardHeader>
          
                  <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full pr-3">
            <div className="space-y-3 pb-3">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`flex gap-3 max-w-[85%] ${
                        message.role === 'user' 
                          ? 'flex-row-reverse' 
                          : 'flex-row'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {message.role === 'user' ? (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                      </div>
                                          <div 
                      className={`p-2 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}
                    >
                        {message.role === 'user' ? (
                          <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                        ) : (
                          <div className="text-sm ai-message-content">
                            {/* @ts-ignore - React-markdown has TypeScript issues with Next.js */}
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        <div 
                          className={`text-xs mt-1 ${
                            message.role === 'user' 
                              ? 'text-primary-foreground/70' 
                              : 'text-muted-foreground'
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>
          
                  <div className="mt-2">
          <p className="text-xs text-muted-foreground mb-1">Suggested prompts:</p>
          <div className="flex flex-wrap gap-1 mb-2">
              {filteredPrompts.slice(0, 3).map((prompt) => (
                <Button
                  key={prompt.id}
                  variant="outline"
                  size="sm"
                  className="text-xs py-1 h-auto"
                  onClick={() => handlePromptSelect(prompt.prompt)}
                >
                  {prompt.title}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs py-1 h-auto"
                onClick={() => {
                  const randomPrompt = templatePrompts[Math.floor(Math.random() * templatePrompts.length)]
                  handlePromptSelect(randomPrompt.prompt)
                }}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Random
              </Button>
            </div>
          </div>
          
                          <CardFooter className="pt-0 px-0 pb-0">
          <div className="relative w-full flex flex-col">
            <div className="relative flex-grow">
              <Textarea
                ref={inputRef}
                placeholder="Ask about savings, budgeting, or financial advice..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[30px] pr-12 resize-none w-full rounded-none border-x-0 border-b-0 focus-visible:ring-0 focus-visible:border-0"
                maxLength={500}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !inputValue.trim()}
                size="icon"
                className="absolute right-1 bottom-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-1 text-right pr-3 w-16 ml-auto">
              {inputValue.length}/500
            </div>
          </div>
        </CardFooter>
        </Card>
      )}
    </div>
  )
} 