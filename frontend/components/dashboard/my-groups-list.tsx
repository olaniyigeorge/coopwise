"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import GroupCard from './group-card'
import EmptyGroupState from './empty-group-state'
import { Pagination } from '@/components/ui/pagination'
import GroupService, { Group } from '@/lib/group-service'
import { Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useRouter, useSearchParams } from 'next/navigation'

interface MyGroupsListProps {
  hasGroups: boolean | null
  searchQuery: string
}

// Helper to transform API group data to UI format for My Groups
const transformMyGroup = (group: Group) => ({
  id: group.id,
  name: group.name,
  memberCount: group.memberCount || Math.floor(Math.random() * group.max_members) + 1, // Simulate member count
  maxMembers: group.max_members,
  contributionAmount: `₦${group.contribution_amount.toLocaleString()}`,
  frequency: group.contribution_frequency,
  description: group.description || `A ${group.contribution_frequency} savings group`,
  badge: 'member' as const, // Default to member, can be updated based on real data
  nextContribution: {
    amount: `₦${group.contribution_amount.toLocaleString()}`,
    dueDate: getNextContributionDate(group.contribution_frequency),
    daysLeft: getNextContributionDaysLeft(group.contribution_frequency)
  },
  nextPayout: {
    amount: `₦${(group.contribution_amount * 5).toLocaleString()}`, // Simulated payout
    date: getNextPayoutDate(group.contribution_frequency)
  }
});

// Helper functions to simulate next contribution and payout dates
function getNextContributionDate(frequency: string): string {
  const today = new Date();
  let nextDate = new Date();
  
  switch(frequency) {
    case 'daily':
      nextDate.setDate(today.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(today.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(today.getMonth() + 1);
      break;
    default:
      nextDate.setDate(today.getDate() + 7); // Default to weekly
  }
  
  return nextDate.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
}

function getNextContributionDaysLeft(frequency: string): number {
  switch(frequency) {
    case 'daily': return 1;
    case 'weekly': return 7;
    case 'monthly': return 30;
    default: return 7;
  }
}

function getNextPayoutDate(frequency: string): string {
  const today = new Date();
  let payoutDate = new Date();
  
  switch(frequency) {
    case 'daily':
      payoutDate.setDate(today.getDate() + 10);
      break;
    case 'weekly':
      payoutDate.setDate(today.getDate() + 8 * 7); // 8 weeks
      break;
    case 'monthly':
      payoutDate.setMonth(today.getMonth() + 6); // 6 months
      break;
    default:
      payoutDate.setMonth(today.getMonth() + 3); // Default to 3 months
  }
  
  return payoutDate.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
}

export default function MyGroupsList({ hasGroups, searchQuery }: MyGroupsListProps) {
  const [groups, setGroups] = useState<ReturnType<typeof transformMyGroup>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 4 // Number of groups per page
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Fetch groups from API
  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        setIsLoading(true);
        
        // Use the getMyGroups method which calls /api/v1/cooperatives/me
        const response = await GroupService.getMyGroups();
        
        // Transform the data for UI
        const transformedGroups = Array.isArray(response) && response.length > 0
          ? response.map(group => {
              // Add memberCount as a random number for demo
              // In a real app, this would come from the API
              const memberCount = Math.floor(Math.random() * group.max_members) + 1;
              return transformMyGroup({...group, memberCount});
            })
          : [];
        
        if (transformedGroups.length > 0) {
          setGroups(transformedGroups);
          setTotalPages(Math.ceil(transformedGroups.length / limit));
        } else {
          // If no real groups, use mock data
          console.log('No groups returned from API, using mock data');
          setGroups(mockMyGroups);
          setTotalPages(Math.ceil(mockMyGroups.length / limit));
        }
      } catch (error) {
        console.error('Error fetching my groups:', error);
        toast({
          title: "Error fetching groups",
          description: "Could not load your groups. Please try again later.",
          variant: "destructive",
        });
        // Use mock data as fallback
        setGroups(mockMyGroups);
        setTotalPages(Math.ceil(mockMyGroups.length / limit));
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch if hasGroups is true
    if (hasGroups === true) {
      fetchMyGroups();
    } else {
      setIsLoading(false);
    }
    
    // Add tab to dependencies to refresh when URL changes (like after group creation)
    // This ensures newly created groups appear in the list
  }, [hasGroups, searchParams]);
  
  // Filter groups based on search query
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Apply pagination to filtered groups
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );
  
  // If still loading user data
  if (hasGroups === null || isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-500">Loading groups...</span>
      </div>
    )
  }
  
  // If user has no groups
  if (hasGroups === false) {
    return <EmptyGroupState />
  }
  
  // If no groups after filtering
  if (filteredGroups.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-1">No groups found</h3>
        <p className="text-sm text-gray-500">
          {searchQuery ? `No groups match "${searchQuery}"` : "You don't have any groups yet"}
        </p>
      </div>
    )
  }
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paginatedGroups.map(group => (
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
          {/* Only show pagination when we have more than limit (10) items */}
          {filteredGroups.length > limit && (
            <Pagination 
              totalPages={totalPages} 
              currentPage={currentPage} 
              onPageChange={(page) => setCurrentPage(page)} 
            />
          )}
        </div>
      )}
    </div>
  )
}

// Mock data for fallback when API fails
const mockMyGroups = [
  {
    id: '1',
    name: 'Moms Budget Circle',
    memberCount: 12,
    maxMembers: 15,
    contributionAmount: '₦50,000',
    frequency: 'monthly',
    description: 'A savings group for mothers',
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
    description: 'A group for entrepreneurs',
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
    description: 'A savings group for charitable activities',
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
    description: 'A group for young professionals',
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