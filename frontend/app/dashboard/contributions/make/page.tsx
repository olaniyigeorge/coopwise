"use client"

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ArrowLeft, CreditCard, ArrowRightLeft, Loader2 } from 'lucide-react'

// Loading component for suspense fallback
function LoadingFallback() {
  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </DashboardLayout>
  )
}

// Component that uses search params
function MakeContributionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = searchParams.get('groupId')
  const amount = searchParams.get('amount') || '100000'
  
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'card'>('transfer')
  const [pin, setPin] = useState(['', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [showPinVerification, setShowPinVerification] = useState(false)

  const handlePinChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newPin = [...pin]
      newPin[index] = value
      setPin(newPin)
      
      // Auto-focus next input
      if (value && index < 3) {
        const nextInput = document.getElementById(`pin-${index + 1}`)
        nextInput?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleContinue = () => {
    if (paymentMethod === 'card') {
      setShowPinVerification(true)
    } else {
      // For transfer, go directly to transfer page
      router.push(`/dashboard/contributions/make/transfer?groupId=${groupId}&amount=${amount}`)
    }
  }

  const handlePinVerification = async () => {
    if (pin.join('').length === 4) {
      setIsVerifying(true)
      
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setIsVerifying(false)
      
      // Navigate to card payment
      router.push(`/dashboard/contributions/make/card?groupId=${groupId}&amount=${amount}`)
    }
  }

  const isPinComplete = pin.join('').length === 4

  return (
    <DashboardLayout>
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        {/* Main Card */}
        <Card className="w-full">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-semibold">Make Contribution</CardTitle>
            <p className="text-sm text-gray-600">
              Get helpful suggestions based on your saving habits
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {!showPinVerification ? (
              <>
                {/* Payment Method Selection */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Make Contribution</h3>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">
                      Select Payment Option
                    </Label>
                    
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value as 'transfer' | 'card')}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="transfer" id="transfer" />
                        <Label htmlFor="transfer" className="flex items-center gap-2 cursor-pointer">
                          <ArrowRightLeft className="w-4 h-4 text-gray-600" />
                          Transfer
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                          <CreditCard className="w-4 h-4 text-gray-600" />
                          Card
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Amount Display */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Amount</span>
                    <span className="text-lg font-semibold text-gray-900">
                      ₦{parseInt(amount).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Continue Button */}
                <Button 
                  onClick={handleContinue}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Continue
                </Button>
              </>
            ) : (
              <>
                {/* PIN Verification */}
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="font-medium text-gray-900 mb-2">Make Contribution</h3>
                    <Label className="text-sm font-medium text-gray-700">
                      Select Payment Option
                    </Label>
                  </div>

                  {/* Selected Payment Method Display */}
                  <div className="flex justify-center">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="card" id="card-selected" checked disabled />
                      <Label htmlFor="card-selected" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-600" />
                        Card
                      </Label>
                    </div>
                  </div>

                  {/* PIN Input */}
                  <div className="space-y-4">
                    <div className="text-center">
                      <Label className="text-sm text-gray-700">
                        Enter your 4-digit card pin to confirm this payment
                      </Label>
                    </div>
                    
                    <div className="flex justify-center gap-3">
                      {pin.map((digit, index) => (
                        <Input
                          key={index}
                          id={`pin-${index}`}
                          type="password"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handlePinChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className="w-12 h-12 text-center font-medium text-lg border-2 focus:border-teal-500"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Confirm Button */}
                  <Button 
                    onClick={handlePinVerification}
                    disabled={!isPinComplete || isVerifying}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Confirm Payment'
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default function MakeContributionPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MakeContributionContent />
    </Suspense>
  )
} 