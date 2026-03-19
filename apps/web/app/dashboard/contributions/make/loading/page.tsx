"use client"

import React, { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
function ContributionLoadingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = searchParams.get('groupId')
  const amount = searchParams.get('amount') || '100000'

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      router.push(`/dashboard/contributions/make?groupId=${groupId}&amount=${amount}`)
    }, 2000)

    return () => clearTimeout(timer)
  }, [router, groupId, amount])

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

          <CardContent className="py-20">
            <div className="flex flex-col items-center justify-center space-y-4">
              {/* Loading Spinner */}
              <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin text-teal-600" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-teal-100 rounded-full"></div>
              </div>
              
              <div className="text-center">
                <h3 className="font-medium text-gray-900 mb-2">Setting up your contribution</h3>
                <p className="text-sm text-gray-600">
                  Please wait while we prepare the payment options...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default function ContributionLoadingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ContributionLoadingContent />
    </Suspense>
  )
} 