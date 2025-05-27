"use client"

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react'

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
function CardPaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = searchParams.get('groupId')
  const amount = searchParams.get('amount') || '100000'
  
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [saveCard, setSaveCard] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Format card number with spaces
  const handleCardNumberChange = (value: string) => {
    // Remove all non-digits
    const cleanValue = value.replace(/\D/g, '')
    
    // Add spaces every 4 digits
    const formattedValue = cleanValue.replace(/(\d{4})(?=\d)/g, '$1 ')
    
    // Limit to 19 characters (16 digits + 3 spaces)
    if (formattedValue.length <= 19) {
      setCardNumber(formattedValue)
    }
  }

  // Format expiry date MM/YY
  const handleExpiryChange = (value: string) => {
    // Remove all non-digits
    const cleanValue = value.replace(/\D/g, '')
    
    // Add slash after 2 digits
    let formattedValue = cleanValue
    if (cleanValue.length >= 2) {
      formattedValue = cleanValue.slice(0, 2) + '/' + cleanValue.slice(2, 4)
    }
    
    // Limit to 5 characters (MM/YY)
    if (formattedValue.length <= 5) {
      setExpiryDate(formattedValue)
    }
  }

  // Format CVV (3 digits)
  const handleCvvChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    if (cleanValue.length <= 3) {
      setCvv(cleanValue)
    }
  }

  const isFormValid = () => {
    return cardNumber.replace(/\s/g, '').length === 16 &&
           expiryDate.length === 5 &&
           cvv.length === 3
  }

  const handlePayment = async () => {
    if (!isFormValid()) return
    
    setIsProcessing(true)
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setIsProcessing(false)
    
    // Navigate to success page or back to contributions
    router.push(`/dashboard/contributions?success=true&amount=${amount}`)
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
            {!isProcessing ? (
              <>
                {/* Payment Method Selection - Showing Card Selected */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Make Contribution</h3>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">
                      Select Payment Option
                    </Label>
                    
                    <RadioGroup value="card" className="space-y-3">
                      <div className="flex items-center space-x-3 opacity-50">
                        <RadioGroupItem value="transfer" id="transfer" disabled />
                        <Label htmlFor="transfer" className="flex items-center gap-2">
                          Transfer
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="card" id="card" checked />
                        <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                          <CreditCard className="w-4 h-4 text-gray-600" />
                          Card
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Card Details Form */}
                <div className="space-y-4">
                  {/* Card Number */}
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">
                      Card Number
                    </Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9101 2345"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      className="text-base tracking-wider"
                    />
                  </div>

                  {/* Expiry Date and CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate" className="text-sm font-medium text-gray-700">
                        Expiration Date
                      </Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                        className="text-base"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cvv" className="text-sm font-medium text-gray-700">
                        CVV
                      </Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        type="password"
                        value={cvv}
                        onChange={(e) => handleCvvChange(e.target.value)}
                        className="text-base"
                      />
                    </div>
                  </div>

                  {/* Save Card Checkbox */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="saveCard"
                      checked={saveCard}
                      onCheckedChange={(checked) => setSaveCard(checked as boolean)}
                    />
                    <Label
                      htmlFor="saveCard"
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      Save card details
                    </Label>
                  </div>
                </div>

                {/* Amount Display */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Amount</span>
                    <span className="text-lg font-semibold text-gray-900">
                      ₦{parseInt(amount).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Pay Button */}
                <Button 
                  onClick={handlePayment}
                  disabled={!isFormValid()}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Pay ₦{parseInt(amount).toLocaleString()}
                </Button>
              </>
            ) : (
              /* Processing State */
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-teal-600" />
                <div className="text-center">
                  <h3 className="font-medium text-gray-900 mb-2">Processing Payment</h3>
                  <p className="text-sm text-gray-600">
                    Please wait while we process your payment...
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

export default function CardPaymentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CardPaymentContent />
    </Suspense>
  )
} 