"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ContributionCard from './contribution-card'
import { ArrowRight } from 'lucide-react'
import { Contribution } from '@/lib/types'
import { getUserContributions, getRecentContributions } from '@/lib/mock-data'

interface ContributionHistoryProps {
  groupId?: string
  limit?: number
  showHeader?: boolean
  className?: string
}

export default function ContributionHistory({ 
  groupId, 
  limit = 5, 
  showHeader = true,
  className 
}: ContributionHistoryProps) {
  // Get contributions based on groupId or show recent ones
  const contributions = groupId 
    ? getUserContributions('1').filter(c => c.groupId === groupId).slice(0, limit)
    : getRecentContributions(limit)

  const handleViewDetails = (contribution: Contribution) => {
    console.log('Viewing details for:', contribution.id)
  }

  const handleRetryPayment = (contribution: Contribution) => {
    console.log('Retrying payment for:', contribution.id)
  }

  const handleViewReceipt = (contribution: Contribution) => {
    console.log('Viewing receipt for:', contribution.id)
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
      <div>
            <CardTitle className="text-lg font-semibold">
              {groupId ? 'Group Contribution History' : 'Recent Contributions'}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {groupId 
                ? 'Your contribution history for this group' 
                : 'Your latest contribution activities'
              }
            </p>
      </div>
          <Link href="/dashboard/contributions">
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              View all
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardHeader>
      )}
      
      <CardContent className="space-y-3">
        {contributions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-4">
              {groupId 
                ? 'No contributions found for this group yet'
                : 'No contributions made yet'
              }
            </p>
            <Button size="sm">
              Make your first contribution
            </Button>
          </div>
        ) : (
          <>
            {contributions.map((contribution) => (
              <ContributionCard
                key={contribution.id}
                contribution={contribution}
                showGroup={!groupId}
                onViewDetails={handleViewDetails}
                onRetryPayment={handleRetryPayment}
                onViewReceipt={handleViewReceipt}
              />
            ))}
            
            {contributions.length >= limit && (
              <div className="pt-3 border-t border-gray-100">
                <Link href="/dashboard/contributions">
        <Button variant="outline" className="w-full">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    View all contributions
        </Button>
                </Link>
      </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
} 