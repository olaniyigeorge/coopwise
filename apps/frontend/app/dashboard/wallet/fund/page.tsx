"use client"

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/layout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, CreditCard, Loader2, Wallet } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils';
import WalletService from '@/services/wallet-service';
import { getDashboardData, LocalCurrency } from '@/services/dashboard-service';
import { getApiErrorDetail } from '@/lib/api-error';

// Set NEXT_PUBLIC_PAYSTACK_LIVE=true once real Paystack keys are configured
// on the backend — "Continue with Paystack" then redirects to Paystack's
// hosted checkout instead of instantly mock-crediting the wallet.
const PAYSTACK_LIVE = process.env.NEXT_PUBLIC_PAYSTACK_LIVE === 'true';

const QUICK_AMOUNTS = ['1000', '5000', '10000'] as const;

function LoadingFallback() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-lg animate-pulse space-y-4">
        <div className="h-8 w-24 rounded-full bg-content/5" />
        <div className="h-16 rounded-2xl bg-content/5" />
        <div className="h-80 rounded-[24px] bg-surface" />
      </div>
    </DashboardLayout>
  )
}

function FundWalletContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [isPaystackLoading, setIsPaystackLoading] = useState(false);
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  const [localCurrency, setLocalCurrency] = useState<LocalCurrency>(LocalCurrency.NGN);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    getDashboardData().then((data) => {
      const wallet = data?.summary?.wallet;
      if (wallet?.local_currency) setLocalCurrency(wallet.local_currency);
      if (wallet?.local_balance != null) setWalletBalance(Number(wallet.local_balance));
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

  const fundedAmount = parseInt(amount, 10);
  const fundedLabel = Number.isFinite(fundedAmount) && fundedAmount > 0
    ? `You added ${formatCurrency(fundedAmount)} to your wallet.`
    : 'Your wallet has been funded.';

  if (paymentSuccessful) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[calc(100dvh-9rem)] flex-col items-center justify-center px-4 text-center">
          <span className="relative flex items-center justify-center">
            <motion.span
              aria-hidden
              className="absolute h-24 w-24 rounded-full border-2 border-[#1F7A54]/35 sm:h-28 sm:w-28 lg:h-40 lg:w-40 dark:border-[#7FBF9C]/40"
              initial={{ scale: 0.7, opacity: 0.7 }}
              animate={{ scale: 1.45, opacity: 0 }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
            />
            <motion.span
              initial={{ scale: 0.45, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 14 }}
              className="flex h-24 w-24 items-center justify-center rounded-full bg-[#DFF0E4] text-[#17603F] sm:h-28 sm:w-28 lg:h-40 lg:w-40 dark:bg-[#1C3A2C] dark:text-[#B7E3C3]"
            >
              <CheckCircle className="h-12 w-12 sm:h-14 sm:w-14 lg:h-20 lg:w-20" strokeWidth={1.75} />
            </motion.span>
          </span>
          <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-content lg:text-4xl">
            Payment successful
          </h1>
          <p className="mt-1.5 text-sm text-content/55">{fundedLabel}</p>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#0E3B2E] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0A2E24]"
          >
            Return to dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-lg space-y-4 pb-8">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-content/55 transition-colors hover:text-content"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-content/45">
            Wallet
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-content sm:text-3xl">
            Fund your wallet
          </h1>
          <p className="mt-1.5 text-sm text-content/55">
            Add money so you can contribute to your cooperatives.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-[24px] bg-[#0E3B2E] p-5 text-white dark:bg-[#173B2C]">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
              Current balance
            </p>
            <p className="mt-1.5 font-display text-3xl font-bold leading-none tracking-tight">
              {walletBalance != null ? formatCurrency(walletBalance, 2) : '—'}
            </p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#E8BC63]">
            <Wallet className="h-5 w-5" />
          </span>
        </div>

        <div className="space-y-5 rounded-[24px] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)] sm:p-6">
          <div className="space-y-2">
            <Label
              htmlFor="fund-amount"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-content/45"
            >
              Amount
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-display text-lg font-bold text-content/35">
                ₦
              </span>
              <Input
                id="fund-amount"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0"
                className="h-14 rounded-xl border-content/15 bg-content/[0.03] pl-10 pr-4 font-display text-2xl font-bold tracking-tight md:text-2xl"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((value) => {
                const selected = amount === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(value)}
                    className={cn(
                      'h-10 rounded-full border text-sm font-semibold transition-colors',
                      selected
                        ? 'border-[#0E3B2E] bg-[#DFF0E4] text-[#17603F] dark:border-[#7FBF9C] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]'
                        : 'border-content/10 text-content/70 hover:bg-content/[0.04]'
                    )}
                  >
                    {formatCurrency(Number(value))}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handlePaystackFund}
              disabled={isPaystackLoading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#1F7A54]/40 bg-transparent text-sm font-semibold text-[#1F7A54] transition-colors hover:border-[#1F7A54]/60 hover:bg-[#1F7A54]/5 hover:text-[#0E3B2E] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#7FBF9C]/40 dark:text-[#7FBF9C] dark:hover:bg-[#7FBF9C]/10 dark:hover:text-[#B7E3C3]"
            >
              {isPaystackLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Continue with Paystack
            </button>
            <p className="text-center text-[11px] text-content/40">
              {PAYSTACK_LIVE
                ? 'Card, bank transfer or USSD'
                : 'Test mode credits your wallet instantly while live Paystack keys are being set up.'}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// useSearchParams() (used above to read Paystack's ?status= on return) makes this
// page client-rendered, and Next requires such pages to sit inside a Suspense
// boundary or the production build fails while prerendering.
export default function FundWallet() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <FundWalletContent />
    </Suspense>
  );
}
