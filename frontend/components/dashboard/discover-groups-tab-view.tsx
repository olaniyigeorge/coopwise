"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Link from "next/link"
import GroupService, { Group } from "@/lib/group-service"
import { Skeleton } from "@/components/ui/skeleton"

interface GroupCardProps {
  name: string
  memberCount: number
  amount: string
  frequency: string
  status: 'Full' | 'Open'
  description: string
  model?: string
}

interface DiscoverGroupsTabViewProps {
  defaultTab?: 'my-groups' | 'discover'
}

// Helper to transform API group data to UI format
const transformGroup = (group: Group) => ({
  id: group.id,
  name: group.name,
  memberCount: group.memberCount || Math.floor(Math.random() * group.max_members) + 1,
  amount: `₦${group.contribution_amount.toLocaleString()}`,
  frequency: group.contribution_frequency,
  status: (group.memberCount && group.memberCount >= group.max_members) ? 'Full' as const : 'Open' as const,
  description: group.description || `A ${group.contribution_frequency} savings group`,
  model: group.coop_model?.toUpperCase() || 'ROTATED GIFT'
});

const GroupCard = ({ name, memberCount, amount, frequency, description }: GroupCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="mb-2">
        <h3 className="text-gray-900 font-medium">{name}</h3>
      </div>
      
      <div className="text-sm text-gray-600 mb-3">
        {memberCount} members • {amount} {frequency}
      </div>
      
      <p className="text-sm text-gray-600 mb-5">
        A savings group for {description}
      </p>
      
      <div className="mb-2">
        <div className="text-sm text-gray-600">
          Group Savings
        </div>
        <div className="text-base font-medium text-gray-900">
          ₦100,000,000
        </div>
      </div>
      
      <Button 
        variant="default" 
        className="w-full bg-teal-700 hover:bg-teal-800 text-white py-2 mt-4"
      >
        Request code
      </Button>
    </div>
  )
}

// Loading skeleton for group cards
const GroupCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
    <Skeleton className="h-6 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2 mb-3" />
    <Skeleton className="h-4 w-full mb-5" />
    <Skeleton className="h-4 w-1/3 mb-2" />
    <Skeleton className="h-6 w-1/2 mb-4" />
    <Skeleton className="h-10 w-full" />
  </div>
);

export default function DiscoverGroupsTabView({ defaultTab = 'discover' }: DiscoverGroupsTabViewProps) {
  const [activeTab, setActiveTab] = useState<'my-groups' | 'discover'>(defaultTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [myGroups, setMyGroups] = useState<ReturnType<typeof transformGroup>[]>([])
  const [discoverGroups, setDiscoverGroups] = useState<ReturnType<typeof transformGroup>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Fetch groups from API
  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoading(true);
      
      try {
        // Fetch both my groups and discover groups
        const [myGroupsResponse, discoverGroupsResponse] = await Promise.all([
          GroupService.getMyGroups(),
          GroupService.getGroups()
        ]);
        
        // Transform my groups data
        if (Array.isArray(myGroupsResponse) && myGroupsResponse.length > 0) {
          const transformed = myGroupsResponse.map(group => {
            // Add memberCount if not provided by API
            const memberCount = group.memberCount || Math.floor(Math.random() * group.max_members) + 1;
            return transformGroup({...group, memberCount});
          });
          setMyGroups(transformed);
        }
        
        // Transform discover groups data
        if (Array.isArray(discoverGroupsResponse) && discoverGroupsResponse.length > 0) {
          const transformed = discoverGroupsResponse.map(group => {
            // Add memberCount if not provided by API
            const memberCount = group.memberCount || Math.floor(Math.random() * group.max_members) + 1;
            return transformGroup({...group, memberCount});
          });
          setDiscoverGroups(transformed);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGroups();
  }, []);
  
  // Switch tabs without page navigation
  const handleTabChange = (tab: 'my-groups' | 'discover') => {
    setActiveTab(tab);
  }

  // Filter groups based on search query
  const filteredMyGroups = myGroups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDiscoverGroups = discoverGroups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="px-4 sm:px-6 md:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Saving Groups</h1>
        <p className="text-gray-600">See your active groups or join a new one.</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex rounded-lg overflow-hidden bg-gray-100 mb-8">
        <button
          className={`flex-1 py-3 px-4 text-center ${
            activeTab === 'my-groups'
              ? 'bg-teal-700 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => handleTabChange('my-groups')}
        >
          My Groups
        </button>
        <button
          className={`flex-1 py-3 px-4 text-center ${
            activeTab === 'discover'
              ? 'bg-teal-700 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => handleTabChange('discover')}
        >
          Discover Groups
        </button>
      </div>

      {/* Group cards grid - 3 columns on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {isLoading ? (
          // Show loading skeletons while data is being fetched
          Array(6).fill(0).map((_, index) => <GroupCardSkeleton key={index} />)
        ) : activeTab === 'my-groups' ? (
          // Show my groups or a message if none
          filteredMyGroups.length > 0 ? (
            filteredMyGroups.map(group => (
              <GroupCard 
                key={group.id}
                name={group.name}
                memberCount={group.memberCount}
                amount={group.amount}
                frequency={group.frequency}
                status={group.status}
                description={group.description}
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <p className="text-gray-500">You haven't joined any groups yet.</p>
            </div>
          )
        ) : (
          // Show discover groups or a message if none
          filteredDiscoverGroups.length > 0 ? (
            filteredDiscoverGroups.map(group => (
              <GroupCard 
                key={group.id}
                name={group.name}
                memberCount={group.memberCount}
                amount={group.amount}
                frequency={group.frequency}
                status={group.status}
                description={group.description}
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-10">
              <p className="text-gray-500">No groups available at the moment.</p>
            </div>
          )
        )}
      </div>
    </div>
  )
} 