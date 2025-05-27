"use client"

import React from 'react'
import GroupCard from './group-card'
import { Pagination } from '@/components/ui/pagination'

interface DiscoverGroupsListProps {
  searchQuery: string
}

// Mock data for discoverable groups
const mockDiscoverGroups = [
  {
    id: '1',
    name: 'Charity Association',
    memberCount: 10,
    maxMembers: 15,
    contributionAmount: '₦100,000',
    frequency: 'monthly',
    description: 'entrepreneurs',
    badge: 'open' as const,
  },
  {
    id: '2',
    name: 'Charity Association',
    memberCount: 8,
    maxMembers: 10,
    contributionAmount: '₦50,000',
    frequency: 'monthly',
    description: 'entrepreneurs',
    badge: 'open' as const,
  },
  {
    id: '3',
    name: 'Charity Association',
    memberCount: 10,
    maxMembers: 10,
    contributionAmount: '₦60,000',
    frequency: 'monthly',
    description: 'entrepreneurs',
    badge: 'full' as const,
  },
  {
    id: '4',
    name: 'Charity Association',
    memberCount: 8,
    maxMembers: 10,
    contributionAmount: '₦80,000',
    frequency: 'monthly',
    description: 'entrepreneurs',
    badge: 'open' as const,
  },
  {
    id: '5',
    name: 'Charity Association',
    memberCount: 12,
    maxMembers: 15,
    contributionAmount: '₦100,000',
    frequency: 'monthly',
    description: 'entrepreneurs',
    badge: 'open' as const,
  },
  {
    id: '6',
    name: 'Charity Association',
    memberCount: 14,
    maxMembers: 15,
    contributionAmount: '₦120,000',
    frequency: 'monthly',
    description: 'entrepreneurs',
    badge: 'open' as const,
  }
]

export default function DiscoverGroupsList({ searchQuery }: DiscoverGroupsListProps) {
  // Filter groups based on search query
  const filteredGroups = mockDiscoverGroups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Function to handle requesting an invite code
  const handleRequestInvite = (groupId: string) => {
    console.log('Request invite for group', groupId)
    // In a real app, this would open a modal or make an API call
    alert(`Invite code requested for group ${groupId}`)
  }
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredGroups.map(group => (
          <GroupCard 
            key={group.id}
            name={group.name}
            memberCount={group.memberCount}
            maxMembers={group.maxMembers}
            contributionAmount={group.contributionAmount}
            frequency={group.frequency}
            description={group.description}
            badge={group.badge}
            isMyGroup={false}
            onRequestInvite={() => handleRequestInvite(group.id)}
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