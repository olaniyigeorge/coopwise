"use client"

// Card/Bank/USSD funding tabs — parked here (not rendered anywhere) now that
// Paystack covers all three channels through one flow. Kept intact rather
// than deleted in case a direct-gateway integration is wanted later; wire
// it back into app/dashboard/wallet/fund/page.tsx if so.

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { CreditCard, Banknote, Wallet } from 'lucide-react'
import WalletService from '@/services/wallet-service'
import { LocalCurrency } from '@/services/dashboard-service'

interface LegacyPaymentMethodsProps {
  amount: string
  localCurrency: LocalCurrency
  onSuccess: () => void
}

export default function LegacyPaymentMethods({ amount, localCurrency, onSuccess }: LegacyPaymentMethodsProps) {
  const { toast } = useToast()
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!amount || parseInt(amount) < 100) {
      toast({
        title: "Invalid amount",
        description: "Please enter an amount of at least ₦100",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    const depData = {
      payment_gateway: paymentMethod,
      local_amount: Number(amount),
      currency: localCurrency,
    }

    try {
      const depositResponse = await WalletService.depositInWallet(depData)
      if (!depositResponse) {
        toast({
          title: "Deposit Failed",
          description: "This deposit attempt failed.",
          variant: "destructive"
        })
        return
      }
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="card" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="card" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Card
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex items-center gap-2">
            <Banknote className="w-4 h-4" /> Bank
          </TabsTrigger>
          <TabsTrigger value="ussd" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" /> USSD
          </TabsTrigger>
        </TabsList>

        <TabsContent value="card">
          <Card>
            <CardHeader>
              <CardTitle>Card Payment</CardTitle>
              <CardDescription>Enter your card details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Card Number</label>
                <Input type="text" placeholder="0000 0000 0000 0000" maxLength={19} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry Date</label>
                  <Input type="text" placeholder="MM/YY" maxLength={5} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CVV</label>
                  <Input type="text" placeholder="123" maxLength={3} required />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" onClick={() => setPaymentMethod("card")} className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? 'Processing...' : 'Pay Now'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle>Bank Transfer</CardTitle>
              <CardDescription>Transfer to the account below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="mb-2">
                  <p className="text-sm text-gray-500">Bank Name</p>
                  <p className="font-medium">CoopWise Bank</p>
                </div>
                <div className="mb-2">
                  <p className="text-sm text-gray-500">Account Number</p>
                  <p className="font-medium">0123456789</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Name</p>
                  <p className="font-medium">CoopWise Ltd</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Your Account Number</label>
                <Input type="text" placeholder="Enter your account number" maxLength={10} required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" onClick={() => setPaymentMethod("bank_transfer")} className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? 'Processing...' : 'Confirm Transfer'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="ussd">
          <Card>
            <CardHeader>
              <CardTitle>USSD Payment</CardTitle>
              <CardDescription>Pay using USSD code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <p className="text-lg font-bold mb-2">Dial *123*456*{amount || '0000'}#</p>
                <p className="text-sm text-gray-500">Dial the code above on your phone to complete payment</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Your Phone Number</label>
                <Input type="text" placeholder="Enter your phone number" maxLength={11} required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" onClick={() => setPaymentMethod("ussd")} className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  )
}
