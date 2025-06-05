"use client"

import React, { useState, useEffect } from 'react'
import GroupCard from './group-card'
import { Pagination } from '@/components/ui/pagination'
import GroupService, { Group } from '@/lib/group-service'
import { Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface DiscoverGroupsListProps {
  searchQuery: string
  suggestedGroups?: Group[]
  isLoading?: boolean
}

// Helper to transform API group data to UI format
const transformGroup = (group: Group) => {
  // Determine if the group is full based on member count (if available)
  let badge: 'open' | 'full' = 'open'
  const memberCount = group.memberCount || Math.floor(Math.random() * group.max_members) + 1
  if (memberCount >= group.max_members) {
    badge = 'full'
  }
  
  return {
    id: group.id,
    name: group.name,
    memberCount: memberCount,
    maxMembers: group.max_members,
    contributionAmount: `₦${group.contribution_amount.toLocaleString()}`,
    frequency: group.contribution_frequency,
    description: group.description || `A savings group for entrepreneurs`,
    badge
  };
};

export default function DiscoverGroupsList({ searchQuery, suggestedGroups = [], isLoading = false }: DiscoverGroupsListProps) {
  const [groups, setGroups] = useState<ReturnType<typeof transformGroup>[]>([])
  const [localLoading, setLocalLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 6 // Number of groups per page
  const router = useRouter()
  
  // Process groups from props
  useEffect(() => {
    try {
      setLocalLoading(true);
      
      // Transform the data for UI if we have suggestedGroups from props
      if (Array.isArray(suggestedGroups) && suggestedGroups.length > 0) {
        const transformedGroups = suggestedGroups.map(group => {
          return transformGroup(group);
        });
        
        setGroups(transformedGroups);
        setTotalPages(Math.ceil(transformedGroups.length / limit));
      } else if (!isLoading) {
        // If no groups passed from props and not still loading, set empty array
        setGroups([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error processing suggested groups data:', error);
      // Set empty array on error
      setGroups([]);
      setTotalPages(1);
    } finally {
      setLocalLoading(false);
    }
  }, [suggestedGroups, isLoading]);
  
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
  const handleRequestInvite = async (groupId: string) => {
    try {
      toast({
        title: "Requesting invite code...",
        description: "Please wait while we generate an invite code",
      });
      
      // Navigate to join group page with the group ID
      router.push(`/dashboard/join-group?id=${groupId}`);
    } catch (error) {
      console.error('Error requesting invite:', error);
      toast({
        title: "Error requesting invite",
        description: "Could not request an invite code. Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  // Show loading state
  if (isLoading || localLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-500">Loading groups...</span>
      </div>
    )
  }
  
  // Show empty state if no groups
  if (filteredGroups.length === 0 && !isLoading && !localLoading) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="mt-6 flex justify-center">
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