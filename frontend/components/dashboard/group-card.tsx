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
  contributionAmount,
  frequency,
  description,
  badge,
  isMyGroup = false,
  nextContribution,
  nextPayout,
  onRequestInvite
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
      <span className={`text-xs px-2 py-1 rounded-md ${badgeStyles[badge]}`}>
        {badge === 'member' && 'Member'}
        {badge === 'admin' && 'Admin'}
        {badge === 'open' && 'Open'}
        {badge === 'full' && 'Full'}
      </span>
    )
  }

  // For My Groups view
  const myGroupContent = (
    <div className="bg-white rounded-md p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-base font-medium">{name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Your Payout Number: {id === '1' ? '1' : Math.floor(Math.random() * 5) + 1}</p>
        </div>
        {renderBadge()}
      </div>
      
          {nextContribution && (
        <div className="mt-3">
          <p className="text-xs text-gray-600 mb-1">Next contribution:</p>
                <p className="text-base font-semibold">{nextContribution.amount}</p>
          <p className="text-xs text-gray-500 flex items-center mt-0.5">
            <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
            </svg>
                  Due on {nextContribution.dueDate} ({nextContribution.daysLeft} days to go)
                </p>
            </div>
          )}
          
          {nextPayout && (
        <div className="mt-3">
          <p className="text-xs text-gray-600 mb-1">Next payout:</p>
                <p className="text-base font-semibold">{nextPayout.amount}</p>
          <p className="text-xs text-gray-500 flex items-center mt-0.5">
            <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
            </svg>
                  Expected on {nextPayout.date}
                </p>
              </div>
      )}
            </div>
  );

  // For Discover Groups view
  const discoverGroupContent = (
    <div className="bg-white rounded-md p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-base font-medium">{name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{memberCount} members • {contributionAmount} {frequency}</p>
        </div>
        {renderBadge()}
      </div>
      
      <p className="text-xs text-gray-600 mb-4">
        A savings group for {description}
      </p>
      
        <div className="mt-4">
        <h4 className="text-xs font-medium mb-1">Group Savings</h4>
        <p className="text-base font-bold mb-4">₦100,000,000</p>
        
          <Button 
          className="w-full bg-primary hover:bg-primary text-white"
            onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRequestInvite?.();
            }}
          >
            Request code
          </Button>
        </div>
    </div>
  );

  const cardContent = isMyGroup ? myGroupContent : discoverGroupContent;

  // If it's a user's group and has an ID, make it clickable to view details
  if (isMyGroup && id) {
    return (
      <Link href={`/dashboard/my-group/${id}`} className="block">
        {cardContent}
      </Link>
    )
  }
  
  return cardContent
} 