"use client"

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Calendar, 
  CreditCard,
  Download,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { mockContributions } from '@/lib/mock-data'
import { 
  formatCurrency, 
  formatDate, 
  getStatusColor, 
  getStatusLabel,
  getTypeLabel,
  getPaymentMethodLabel 
} from '@/lib/contribution-utils'

export default function ContributionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contributionId = params.id as string

  // Find the contribution (in a real app, this would be fetched from an API)
  const contribution = mockContributions.find(c => c.id === contributionId)

  if (!contribution) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Contribution Not Found</h1>
          <p className="text-gray-600 mb-6">The contribution you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/dashboard/contributions')}>
            Back to Contributions
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const statusColor = getStatusColor(contribution.status)
  const statusLabel = getStatusLabel(contribution.status)
  const typeLabel = getTypeLabel(contribution.type)
  const paymentMethodLabel = getPaymentMethodLabel(contribution.paymentMethod)

  const handleRetryPayment = () => {
    console.log('Retrying payment for:', contribution.id)
  }

  const handleDownloadReceipt = () => {
    console.log('Downloading receipt for:', contribution.id)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Contribution Details</h1>
            <p className="text-sm text-gray-600">
              Reference: {contribution.reference || 'N/A'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {contribution.status === 'failed' && (
              <Button size="sm" onClick={handleRetryPayment}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Payment
              </Button>
            )}
            {contribution.status === 'completed' && (
              <Button variant="outline" size="sm" onClick={handleDownloadReceipt}>
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Contribution Information</span>
                  <Badge className={`${statusColor}`} variant="secondary">
                    {statusLabel}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type</label>
                    <p className="text-base font-medium text-gray-900">{typeLabel}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Amount</label>
                    <p className="text-base font-medium text-gray-900">
                      {formatCurrency(contribution.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date</label>
                    <p className="text-base font-medium text-gray-900">
                      {formatDate(contribution.date)}
                    </p>
                  </div>
                  {contribution.dueDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Due Date</label>
                      <p className="text-base font-medium text-gray-900">
                        {formatDate(contribution.dueDate)}
                      </p>
                    </div>
                  )}
                </div>
                
                {contribution.description && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <p className="text-base text-gray-900 mt-1">
                        {contribution.description}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Method</label>
                    <div className="flex items-center gap-2 mt-1">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <p className="text-base font-medium text-gray-900">
                        {paymentMethodLabel}
                      </p>
                    </div>
                  </div>
                  {contribution.reference && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Transaction Reference</label>
                      <p className="text-base font-medium text-gray-900">
                        {contribution.reference}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Group Info */}
            {contribution.group && (
              <Card>
                <CardHeader>
                  <CardTitle>Group Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Group Name</label>
                      <p className="text-base font-medium text-gray-900">
                        {contribution.group.name}
                      </p>
                    </div>
                    {contribution.group.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Description</label>
                        <p className="text-sm text-gray-700">
                          {contribution.group.description}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contribution Amount</label>
                      <p className="text-base font-medium text-gray-900">
                        {formatCurrency(contribution.group.contributionAmount)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Frequency</label>
                      <p className="text-base font-medium text-gray-900 capitalize">
                        {contribution.group.frequency}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contribution.status === 'completed' && (
                  <Button variant="outline" className="w-full" onClick={handleDownloadReceipt}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Receipt
                  </Button>
                )}
                {contribution.status === 'failed' && (
                  <Button className="w-full" onClick={handleRetryPayment}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Payment
                  </Button>
                )}
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 