"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ComingSoonButton from '@/components/coming-soon-button'
import ComingSoonWrapper from '@/components/ui/coming-soon-wrapper'

import { 
  BarChart, 
  Download, 
  MessageCircle, 
  Settings, 
  CreditCard,
  Gift
} from 'lucide-react'

/**
 * Example component showing different ways to use the Coming Soon components
 * 
 * This component demonstrates how to use both ComingSoonWrapper and ComingSoonButton
 * in various scenarios throughout your application.
 */
export default function ComingSoonExample() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Coming Soon Components</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Using ComingSoonButton</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Default Button:</p>
              <ComingSoonButton>
                Start Live Chat
              </ComingSoonButton>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-2">Custom Title and Description:</p>
              <ComingSoonButton 
                title="Premium Feature" 
                description="This feature will be available in our premium plan coming next month."
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Analytics
              </ComingSoonButton>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-2">Different Button Variants:</p>
              <div className="flex flex-wrap gap-2">
                <ComingSoonButton variant="default">
                  Default
                </ComingSoonButton>
                <ComingSoonButton variant="destructive">
                  Destructive
                </ComingSoonButton>
                <ComingSoonButton variant="outline">
                  Outline
                </ComingSoonButton>
                <ComingSoonButton variant="ghost">
                  Ghost
                </ComingSoonButton>
                <ComingSoonButton variant="link">
                  Link
                </ComingSoonButton>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Using ComingSoonWrapper</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Wrap Custom UI Elements:</p>
              <div className="grid grid-cols-2 gap-4">
                <ComingSoonWrapper 
                  title="Advanced Analytics"
                  description="Our advanced analytics dashboard is currently under development."
                >
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors">
                    <BarChart className="w-8 h-8 text-blue-500 mb-2" />
                    <h3 className="font-medium">View Analytics</h3>
                    <p className="text-xs text-gray-500">Track your savings progress</p>
                  </div>
                </ComingSoonWrapper>
                
                <ComingSoonWrapper
                  title="Account Settings"
                  description="Advanced account settings will be available in the next update."
                >
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                    <Settings className="w-8 h-8 text-gray-500 mb-2" />
                    <h3 className="font-medium">Advanced Settings</h3>
                    <p className="text-xs text-gray-500">Customize your account</p>
                  </div>
                </ComingSoonWrapper>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-2">Wrap Menu Items:</p>
              <div className="bg-white border rounded-lg divide-y">
                <div className="p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-gray-500" />
                    <span>Messages</span>
                  </div>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">3</span>
                </div>
                
                <ComingSoonWrapper
                  title="Payment Methods"
                  description="Payment method management will be available soon."
                >
                  <div className="p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-500" />
                      <span>Payment Methods</span>
                    </div>
                    <span className="text-xs">Coming Soon</span>
                  </div>
                </ComingSoonWrapper>
                
                <ComingSoonWrapper
                  title="Referral Program"
                  description="Our referral program is launching next month. Stay tuned!"
                >
                  <div className="p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Gift className="w-5 h-5 text-gray-500" />
                      <span>Refer a Friend</span>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">Soon</span>
                  </div>
                </ComingSoonWrapper>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">How to Use</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">ComingSoonButton</h3>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm mt-2">
              {`<ComingSoonButton 
  title="Premium Feature" 
  description="This feature will be available soon."
  variant="outline"
>
  Export Analytics
</ComingSoonButton>`}
            </pre>
          </div>
          
          <div>
            <h3 className="text-lg font-medium">ComingSoonWrapper</h3>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm mt-2">
              {`<ComingSoonWrapper
  title="Coming Soon"
  description="This feature is under development."
>
  <Button>Any UI Element</Button>
</ComingSoonWrapper>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
} 