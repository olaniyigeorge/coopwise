"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  CreditCard, 
  Banknote, 
  Wallet, 
  ArrowRight,
  CheckCircle
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils';
import WalletService from '@/lib/wallet-service';

export default function FundWallet() {
  const router = useRouter();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAmount(value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log(`\n Adding money....    \n`)
    
    if (!amount || parseInt(amount) < 100) {
      toast({
        title: "Invalid amount",
        description: "Please enter an amount of at least ₦100",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Simulate payment processing
    // setTimeout(() => {
    //   setLoading(false);
    //   setPaymentSuccessful(true);
      
    //   // Display success notification
    //   toast({
    //     title: "Payment Successful",
    //     description: `You have successfully added ${formatCurrency(parseInt(amount))} to your wallet.`,
    //     variant: "default"
    //   });
      
    //   // Reset form after 2 seconds and redirect back to dashboard
    //   setTimeout(() => {
    //     router.push('/dashboard');
    //   }, 2000);
    // }, 2000);

    setLoading(false);

    const depData = {
      'local_amount': Number(amount),
      'currency': "NGN" // TODO Get user's local_currency
    }

    try {
      const depositResponse = await WalletService.depositInWallet(depData);
      if (!depositResponse) {
          toast({
            title: "Deposit Failed",
            description: `This deposit attempt failed.`,
            variant: "destructive"
          });
          setPaymentSuccessful(false);
      }
      setPaymentSuccessful(true);
    } catch {
      setPaymentSuccessful(false);
    }
  };

  if (paymentSuccessful) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto my-8">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-6">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-semibold text-green-700">Payment Successful!</h2>
                <p className="text-green-600 mt-2">
                  You have successfully added {formatCurrency(parseInt(amount))} to your wallet.
                </p>
                <Button
                  className="mt-6 bg-primary hover:bg-primary/90"
                  onClick={() => router.push('/dashboard')}
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Button
          variant="ghost"
          className="flex items-center gap-1 px-0 hover:px-2 ease-in-out transition-all duration-500 mb-4"
          onClick={() => router.push('/dashboard')}
        >
          <ArrowRight className="w-4 h-4" /> Back to Dashboard
        </Button>
        <h1 className="text-2xl font-semibold">Fund Your Wallet</h1>
        <p className="text-gray-500 text-sm">Add money to your wallet to make contributions</p>
      </div>

      <div className="max-w-md mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Enter Amount</CardTitle>
            <CardDescription>How much would you like to add?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
              <Input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                className="pl-8 text-lg"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <Button variant="outline" onClick={() => setAmount('1000')}>₦1,000</Button>
              <Button variant="outline" onClick={() => setAmount('5000')}>₦5,000</Button>
              <Button variant="outline" onClick={() => setAmount('10000')}>₦10,000</Button>
            </div>
          </CardContent>
        </Card>

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
                    <Input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Expiry Date</label>
                      <Input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">CVV</label>
                      <Input
                        type="text"
                        placeholder="123"
                        maxLength={3}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
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
                    <Input
                      type="text"
                      placeholder="Enter your account number"
                      maxLength={10}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
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
                    <Input
                      type="text"
                      placeholder="Enter your phone number"
                      maxLength={11}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                    {loading ? 'Processing...' : 'Confirm Payment'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </DashboardLayout>
  );
}
