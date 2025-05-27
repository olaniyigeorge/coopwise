"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  CreditCard,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Contribution } from '@/lib/types'
import { 
  formatCurrency, 
  formatDate, 
  getStatusColor, 
  getStatusLabel,
  getTypeLabel,
  getPaymentMethodLabel 
} from '@/lib/contribution-utils'

interface ContributionCardProps {
  contribution: Contribution
  showGroup?: boolean
  showUser?: boolean
  onViewDetails?: (contribution: Contribution) => void
  onRetryPayment?: (contribution: Contribution) => void
  onViewReceipt?: (contribution: Contribution) => void
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-600" />
    case 'pending':
    case 'processing':
      return <Clock className="w-4 h-4 text-yellow-600" />
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-600" />
    case 'overdue':
      return <AlertTriangle className="w-4 h-4 text-red-600" />
    default:
      return <Clock className="w-4 h-4 text-gray-600" />
  }
}

export default function ContributionCard({
  contribution,
  showGroup = false,
  showUser = false,
  onViewDetails,
  onRetryPayment,
  onViewReceipt
}: ContributionCardProps) {
  const router = useRouter()
  const statusColor = getStatusColor(contribution.status)
  const statusLabel = getStatusLabel(contribution.status)
  const typeLabel = getTypeLabel(contribution.type)
  const paymentMethodLabel = getPaymentMethodLabel(contribution.paymentMethod)

  const handleRetryPayment = () => {
    onRetryPayment?.(contribution)
  }

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(contribution)
    } else {
      // Default behavior: navigate to detail page
      router.push(`/dashboard/contributions/${contribution.id}`)
    }
  }

  const handleViewReceipt = () => {
    onViewReceipt?.(contribution)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              {getStatusIcon(statusLabel)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">{typeLabel}</h3>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(contribution.date)}</p>
                  
                  {showGroup && contribution.group && (
                    <p className="text-xs text-gray-600 mt-1">
                      Group: {contribution.group.name}
                    </p>
                  )}
                  
                  {showUser && contribution.user && (
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={contribution.user.avatar} />
                        <AvatarFallback className="text-xs">
                          {contribution.user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600">{contribution.user.name}</span>
                    </div>
                  )}
                  
                  {contribution.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {contribution.description}
                    </p>
                  )}
                </div>
                
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-gray-900 text-sm">
                    {formatCurrency(contribution.amount)}
                  </p>
                  <Badge className={`text-xs mt-1 ${statusColor}`} variant="secondary">
                    {statusLabel}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{paymentMethodLabel}</span>
                  {contribution.reference && (
                    <span className="text-xs text-gray-400">• {contribution.reference}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {contribution.status === 'failed' && onRetryPayment && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={handleRetryPayment}
                    >
                      Retry
                    </Button>
                  )}
                  
                  {contribution.status === 'completed' && onViewReceipt && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={handleViewReceipt}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleViewDetails}>
                        View Details
                      </DropdownMenuItem>
                      {contribution.status === 'completed' && (
                        <DropdownMenuItem onClick={handleViewReceipt}>
                          View Receipt
                        </DropdownMenuItem>
                      )}
                      {contribution.status === 'failed' && (
                        <DropdownMenuItem onClick={handleRetryPayment}>
                          Retry Payment
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 