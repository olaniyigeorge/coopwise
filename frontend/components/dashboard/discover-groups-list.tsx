"use client"

import React, { useState, useEffect } from 'react'
import GroupCard from './group-card'
import { Pagination } from '@/components/ui/pagination'
import GroupService, { Group } from '@/lib/group-service'
import { Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface DiscoverGroupsListProps {
  searchQuery: string
}

// Helper to transform API group data to UI format
const transformGroup = (group: Group) => ({
  id: group.id,
  name: group.name,
  memberCount: group.memberCount || Math.floor(Math.random() * group.max_members) + 1, // Simulate member count
  maxMembers: group.max_members,
  contributionAmount: `₦${group.contribution_amount.toLocaleString()}`,
  frequency: group.contribution_frequency,
  description: group.description || `A ${group.contribution_frequency} savings group`,
  badge: group.memberCount >= group.max_members ? 'full' as const : 'open' as const,
});

export default function DiscoverGroupsList({ searchQuery }: DiscoverGroupsListProps) {
  const [groups, setGroups] = useState<ReturnType<typeof transformGroup>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 6 // Number of groups per page
  
  // Fetch groups from API
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setIsLoading(true);
        const response = await GroupService.getGroups();
        
        // Transform the data for UI
        const transformedGroups = Array.isArray(response) && response.length > 0
          ? response.map(group => {
              // Add memberCount as a random number for demo
              // In a real app, this would come from the API
              const memberCount = Math.floor(Math.random() * group.max_members) + 1;
              return transformGroup({...group, memberCount});
            })
          : [];
        
        setGroups(transformedGroups);
        
        // If we got groups, set total pages only if more than 10 items
        if (transformedGroups.length > 0) {
          setTotalPages(Math.ceil(transformedGroups.length / limit));
        } else {
          // If we didn't get groups, use mock data
          console.log('No groups returned from API, using mock data');
          setGroups(mockDiscoverGroups);
          setTotalPages(Math.ceil(mockDiscoverGroups.length / limit));
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
        toast({
          title: "Error fetching groups",
          description: "Could not load groups. Please try again later.",
          variant: "destructive",
        });
        // Use mock data as fallback
        setGroups(mockDiscoverGroups);
        setTotalPages(Math.ceil(mockDiscoverGroups.length / limit));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGroups();
  }, []);
  
  // Filter groups based on search query
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Apply pagination to filtered groups
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );
  
  // Function to handle requesting an invite code
  const handleRequestInvite = (groupId: string) => {
    console.log('Request invite for group', groupId)
    // In a real app, this would open a modal or make an API call
    toast({
      title: "Invite code requested",
      description: `We've sent an invite code request for this group`,
    })
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-500">Loading groups...</span>
      </div>
    )
  }
  
  // Show empty state if no groups
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
          {searchQuery ? `No groups match "${searchQuery}"` : "There are no groups available at the moment"}
        </p>
      </div>
    )
  }
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            isMyGroup={false}
            onRequestInvite={() => handleRequestInvite(group.id)}
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
const mockDiscoverGroups = [
  {
    id: '1',
    name: 'Tailors Association',
    memberCount: 10,
    maxMembers: 15,
    contributionAmount: '₦100,000',
    frequency: 'monthly',
    description: 'A savings group for tailors',
    badge: 'open' as const,
  },
  {
    id: '2',
    name: 'Oja Connect',
    memberCount: 8,
    maxMembers: 10,
    contributionAmount: '₦50,000',
    frequency: 'monthly',
    description: 'Market women savings group',
    badge: 'open' as const,
  },
  {
    id: '3',
    name: 'Tech Founders Circle',
    memberCount: 10,
    maxMembers: 10,
    contributionAmount: '₦60,000',
    frequency: 'monthly',
    description: 'A savings group for tech entrepreneurs',
    badge: 'full' as const,
  },
  {
    id: '4',
    name: 'Teachers Union',
    memberCount: 8,
    maxMembers: 10,
    contributionAmount: '₦80,000',
    frequency: 'monthly',
    description: 'A group for educators',
    badge: 'open' as const,
  },
  {
    id: '5',
    name: 'Farmers Cooperative',
    memberCount: 12,
    maxMembers: 15,
    contributionAmount: '₦100,000',
    frequency: 'monthly',
    description: 'Agricultural support group',
    badge: 'open' as const,
  },
  {
    id: '6',
    name: 'Creative Artists',
    memberCount: 14,
    maxMembers: 15,
    contributionAmount: '₦120,000',
    frequency: 'monthly',
    description: 'For artists and creatives',
    badge: 'open' as const,
  }
] 