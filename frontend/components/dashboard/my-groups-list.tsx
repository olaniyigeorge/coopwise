"use client"

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import GroupCard from './group-card'
import EmptyGroupState from './empty-group-state'
import { Pagination } from '@/components/ui/pagination'

interface MyGroupsListProps {
  hasGroups: boolean | null
  searchQuery: string
}

// Mock data for existing user groups
const mockMyGroups = [
  {
    id: '1',
    name: 'Moms Budget Circle',
    memberCount: 12,
    maxMembers: 15,
    contributionAmount: '₦50,000',
    frequency: 'monthly',
    description: 'entrepreneurs',
    badge: 'member' as const,
    nextContribution: {
      amount: '₦50,000',
      dueDate: 'May 25',
      daysLeft: 10
    },
    nextPayout: {
      amount: '₦250,000',
      date: 'May 25'
    }
  },
  {
    id: '2',
    name: 'Hustle and Save Gang',
    memberCount: 15,
    maxMembers: 15,
    contributionAmount: '₦60,000',
    frequency: 'monthly',
    description: 'entrepreneurs',
    badge: 'admin' as const,
    nextContribution: {
      amount: '₦60,000',
      dueDate: 'May 25',
      daysLeft: 10
    },
    nextPayout: {
      amount: '₦300,000',
      date: 'May 25'
    }
  },
  {
    id: '3',
    name: 'Charity Association',
    memberCount: 10,
    maxMembers: 15,
    contributionAmount: '₦100,000',
    frequency: 'monthly',
    description: 'entrepreneurs',
    badge: 'admin' as const,
    nextContribution: {
      amount: '₦100,000',
      dueDate: 'May 25',
      daysLeft: 10
    },
    nextPayout: {
      amount: '₦500,000',
      date: 'May 25'
    }
  },
  {
    id: '4',
    name: 'Hustle and Save Gang',
    memberCount: 10,
    maxMembers: 15,
    contributionAmount: '₦100,000',
    frequency: 'monthly',
    description: 'entrepreneurs',
    badge: 'member' as const,
    nextContribution: {
      amount: '₦100,000',
      dueDate: 'May 25',
      daysLeft: 10
    },
    nextPayout: {
      amount: '₦500,000',
      date: 'May 25'
    }
  },
]

export default function MyGroupsList({ hasGroups, searchQuery }: MyGroupsListProps) {
  // Filter groups based on search query
  const filteredGroups = mockMyGroups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // If still loading user data
  if (hasGroups === null) {
    return <div className="py-20 text-center text-gray-500">Loading groups...</div>
  }
  
  // If user has no groups
  if (hasGroups === false) {
    return <EmptyGroupState />
  }
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGroups.map(group => (
          <GroupCard 
            key={group.id}
            id={group.id}
            name={group.name}
            memberCount={group.memberCount}
            maxMembers={group.maxMembers}
            contributionAmount={group.contributionAmount}
            frequency={group.frequency}
            description={group.description}
            badge={group.badge}
            isMyGroup={true}
            nextContribution={group.nextContribution}
            nextPayout={group.nextPayout}
            onViewDetails={() => console.log('View details for', group.name)}
          />
        ))}
      </div>
      
      {filteredGroups.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Pagination 
            totalPages={30} 
            currentPage={1} 
            onPageChange={(page) => console.log('Go to page', page)} 
          />
        </div>
      )}
    </div>
  )
} 