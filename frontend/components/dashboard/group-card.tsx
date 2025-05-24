"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Define the possible group status badges
type BadgeType = 'member' | 'admin' | 'open' | 'full'

interface GroupCardProps {
  id?: string
  name: string
  memberCount: number
  maxMembers: number
  contributionAmount: string
  frequency: string
  description: string
  badge?: BadgeType
  isMyGroup?: boolean
  // For My Groups view
  nextContribution?: {
    amount: string
    dueDate: string
    daysLeft: number
  }
  nextPayout?: {
    amount: string
    date: string
  }
  // Actions
  onRequestInvite?: () => void
  onViewDetails?: () => void
}

export default function GroupCard({
  id,
  name,
  memberCount,
  maxMembers,
  contributionAmount,
  frequency,
  description,
  badge,
  isMyGroup = false,
  nextContribution,
  nextPayout,
  onRequestInvite,
  onViewDetails
}: GroupCardProps) {
  
  // Function to render the appropriate badge
  const renderBadge = () => {
    if (!badge) return null
    
    const badgeStyles = {
      member: "bg-green-100 text-green-800",
      admin: "bg-amber-100 text-amber-800",
      open: "bg-green-100 text-green-800",
      full: "bg-amber-100 text-amber-800"
    }
    
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badgeStyles[badge]}`}>
        {badge === 'member' && 'Member'}
        {badge === 'admin' && 'Admin'}
        {badge === 'open' && 'Open'}
        {badge === 'full' && 'Full'}
      </span>
    )
  }

  const cardContent = (
    <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-medium">{name}</h3>
          <p className="text-sm text-gray-500">{memberCount} members • {contributionAmount} {frequency}</p>
        </div>
        {renderBadge()}
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        A saving group for {description}
      </p>
      
      {isMyGroup ? (
        // My Groups view with contribution and payout info
        <div className="space-y-3">
          {nextContribution && (
            <div>
              <p className="text-sm font-medium">Next contribution:</p>
              <div className="flex justify-between">
                <p className="text-base font-semibold">{nextContribution.amount}</p>
                <p className="text-sm text-gray-500">
                  Due on {nextContribution.dueDate} ({nextContribution.daysLeft} days to go)
                </p>
              </div>
            </div>
          )}
          
          {nextPayout && (
            <div>
              <p className="text-sm font-medium">Next payout:</p>
              <div className="flex justify-between">
                <p className="text-base font-semibold">{nextPayout.amount}</p>
                <p className="text-sm text-gray-500">
                  Expected on {nextPayout.date}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Discover Groups view with request button
        <div className="mt-4">
          <Button 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRequestInvite?.()
            }}
            variant="default"
            className="w-full"
          >
            Request code
          </Button>
        </div>
      )}
    </div>
  )

  // If it's a user's group and has an ID, make it clickable
  if (isMyGroup && id) {
    return (
      <Link href={`/dashboard/my-group/${id}`} className="block">
        {cardContent}
      </Link>
    )
  }
  
  return cardContent
} 