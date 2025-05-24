"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRightLeft, Copy, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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
function TransferPaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = searchParams.get('groupId')
  const amount = searchParams.get('amount') || '100000'
  
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [isConfirming, setIsConfirming] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // Mock bank details
  const bankDetails = {
    accountName: 'Charity Association Coopwise',
    accountNumber: '0123456781',
    bankName: 'Polaris Bank'
  }

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    toast.success(`${type} copied to clipboard`)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleConfirmPayment = async () => {
    setIsConfirming(true)
    
    // Simulate payment confirmation
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setIsConfirming(false)
    
    // Navigate to success page or back to contributions
    router.push(`/dashboard/contributions?success=true&amount=${amount}&method=transfer`)
  }

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
            {!isConfirming ? (
              <>
                {/* Payment Method Selection - Showing Transfer Selected */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Make Contribution</h3>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">
                      Select Payment Option
                    </Label>
                    
                    <RadioGroup value="transfer" className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="transfer" id="transfer" checked />
                        <Label htmlFor="transfer" className="flex items-center gap-2 cursor-pointer">
                          <ArrowRightLeft className="w-4 h-4 text-gray-600" />
                          Transfer
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3 opacity-50">
                        <RadioGroupItem value="card" id="card" disabled />
                        <Label htmlFor="card" className="flex items-center gap-2">
                          Card
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Transfer Details */}
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-gray-900">
                      Transfer <span className="text-lg font-semibold text-green-600">₦{parseInt(amount).toLocaleString()}</span> to:
                    </p>
                    <div className="text-lg font-semibold text-gray-900">
                      {bankDetails.bankName}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 tracking-wider">
                      {bankDetails.accountNumber}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(bankDetails.accountNumber, 'Account number')}
                        className="ml-2 h-6 w-6 p-0"
                      >
                        {copied === 'Account number' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Account Details Card */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Account Name</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {bankDetails.accountName}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(bankDetails.accountName, 'Account name')}
                          className="h-4 w-4 p-0"
                        >
                          {copied === 'Account name' ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Bank</span>
                      <span className="text-sm font-medium text-gray-900">
                        {bankDetails.bankName}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Amount</span>
                      <span className="text-sm font-semibold text-green-600">
                        ₦{parseInt(amount).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="flex items-center justify-center gap-2 p-3 bg-orange-50 rounded-lg">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-orange-700">
                      Expires in <span className="font-mono font-semibold">{formatTime(timeLeft)}</span> minutes
                    </span>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Transfer Instructions</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Use the exact amount shown above</li>
                      <li>• Complete transfer within 10 minutes</li>
                      <li>• Click "Confirm Payment" after transfer</li>
                      <li>• Keep your transfer receipt for records</li>
                    </ul>
                  </div>
                </div>

                {/* Confirm Button */}
                <Button 
                  onClick={handleConfirmPayment}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Confirm Payment
                </Button>

                {/* Note */}
                <p className="text-xs text-gray-500 text-center">
                  Only click "Confirm Payment" after you have completed the bank transfer
                </p>
              </>
            ) : (
              /* Confirming State */
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
                <div className="text-center">
                  <h3 className="font-medium text-gray-900 mb-2">Confirming Payment</h3>
                  <p className="text-sm text-gray-600">
                    Please wait while we verify your transfer...
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default function TransferPaymentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TransferPaymentContent />
    </Suspense>
  )
} 