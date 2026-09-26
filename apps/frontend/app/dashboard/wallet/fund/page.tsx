"use client"

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowRight,
  CheckCircle,
  Loader2,
  Wallet,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils';
import WalletService from '@/services/wallet-service';
import { getDashboardData, LocalCurrency } from '@/services/dashboard-service';
import { getApiErrorDetail } from '@/lib/api-error';

// Flip to true once real Paystack keys are configured — this makes
// "Continue with Paystack" redirect to Paystack's hosted checkout instead
// of instantly mock-crediting the wallet.
const PAYSTACK_LIVE = false;

export default function FundWallet() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [isPaystackLoading, setIsPaystackLoading] = useState(false);
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  const [localCurrency, setLocalCurrency] = useState<LocalCurrency>(LocalCurrency.NGN);

  useEffect(() => {
    getDashboardData().then((data) => {
      const currency = data?.summary?.wallet?.local_currency;
      if (currency) setLocalCurrency(currency);
    });
  }, []);

  useEffect(() => {
    const status = searchParams.get('status')
    if (status === 'success') {
      setPaymentSuccessful(true);
      toast({ title: 'Payment successful', description: 'Your wallet has been funded.' });
    } else if (status === 'failed') {
      toast({
        title: 'Payment failed',
        description: 'Your Paystack payment did not complete. Please try again.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAmount(value);
  };

  const handlePaystackFund = async () => {
    if (!amount || parseInt(amount) < 100) {
      toast({
        title: "Invalid amount",
        description: "Please enter an amount of at least ₦100",
        variant: "destructive"
      });
      return;
    }
    try {
      setIsPaystackLoading(true);

      if (PAYSTACK_LIVE) {
        const response = await WalletService.initiateDeposit({
          payment_gateway: 'paystack',
          local_amount: Number(amount),
          currency: localCurrency,
        });
        const authUrl = response.init_payment_response?.data?.authorization_url;
        if (!response.init_payment_response.status || !authUrl) {
          throw new Error(response.init_payment_response.message || 'Could not start Paystack payment.');
        }
        window.location.href = authUrl;
        return;
      }

      // Test mode: no live Paystack keys yet — initiate + immediately
      // finalise a mock_success deposit so the credit is real and shows up
      // on the dashboard right away, without leaving this page.
      const response = await WalletService.initiateDeposit({
        payment_gateway: 'mock_success',
        local_amount: Number(amount),
        currency: localCurrency,
      });
      const txRef = response.init_payment_response?.data?.tx_ref;
      if (!response.init_payment_response.status || !txRef) {
        throw new Error(response.init_payment_response.message || 'Could not start deposit.');
      }
      await WalletService.finalizeDeposit(txRef, 'mock_success');
      setPaymentSuccessful(true);
    } catch (err: any) {
      const detail = getApiErrorDetail(err);
      const message = (typeof detail === "string" ? detail : detail?.message) || err?.message || "Could not fund wallet.";
      toast({ title: "Payment failed", description: message, variant: "destructive" });
    } finally {
      setIsPaystackLoading(false);
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
                  You have successfully added {formatCurrency(parseInt(amount) || 0)} to your wallet.
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

        <Card className="mb-6 border-emerald-200 bg-emerald-50/40">
          <CardHeader>
            <CardTitle>Pay with Paystack</CardTitle>
            <CardDescription>
              Card, bank transfer, or USSD — securely handled by Paystack.
              {!PAYSTACK_LIVE && (
                <span className="block mt-1 text-xs text-amber-600 font-medium">
                  Test mode: instantly credits your wallet while live Paystack keys are being set up.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              type="button"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={isPaystackLoading}
              onClick={handlePaystackFund}
            >
              {isPaystackLoading ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Wallet className="w-4 h-4 mr-1.5" />
              )}
              Continue with Paystack
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
