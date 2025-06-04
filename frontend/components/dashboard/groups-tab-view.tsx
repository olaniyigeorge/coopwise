"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MyGroupsList from './my-groups-list'
import DiscoverGroupsList from './discover-groups-list'

interface GroupsTabViewProps {
  defaultTab?: 'my-groups' | 'discover'
}

// Loading component for suspense fallback
function LoadingFallback() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded-lg w-full max-w-md mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}

// Component that uses search params
function GroupsTabViewContent({ defaultTab = 'my-groups' }: GroupsTabViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Check for tab in URL params
  const tabParam = searchParams.get('tab')
  const initialTab = tabParam === 'my' ? 'discover' : tabParam === 'my-groups' ? 'my-groups' : defaultTab
  
  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Simulate fetching user data to determine if they have any groups
  // In a real app, this would come from an API
  const [hasGroups, setHasGroups] = useState<boolean | null>(null)
  
  useEffect(() => {
    // If tab param changes, update the active tab
    if (tabParam === 'my') {
      setActiveTab('my-groups')
    } else if (tabParam === 'discover') {
      setActiveTab('discover')
    }
  }, [tabParam])
  
  useEffect(() => {
    // Simulate API call to check if user has groups
    const fetchUserGroups = async () => {
      // This would be an API call in a real app
      setTimeout(() => {
        // For demo purposes, we'll assume user has groups if they've created any
        // In a real app, this would come from your API
        setHasGroups(true) // Default to true for better UX after group creation
      }, 500)
    }
    
    fetchUserGroups()
  }, [])
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  
  }

  return (
    <div className="p-3">
      <h1 className="text-2xl font-semibold text-teal-700 mb-1">Saving Groups</h1>
      <h2 className="text-sm text-gray-500 mb-4">See your active groups or join a new one.</h2>
      <div className="grid grid-cols-2 rounded-md overflow-hidden mb-6">
        <button
          onClick={() => handleTabChange('my-groups')}
          className={`py-3 text-center font-medium text-sm ${
            activeTab === 'my-groups' 
              ? 'bg-[#06413F] text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          My Groups
        </button>
        <button
          onClick={() => handleTabChange('discover')}
          className={`py-3 text-center font-medium text-sm ${
            activeTab === 'discover' 
              ? 'bg-[#06413F] text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Discover Groups
        </button>
      </div>
      
      {/* Tab content */}
      <div>
        {activeTab === 'my-groups' && (
          <MyGroupsList hasGroups={hasGroups} searchQuery={searchQuery} />
        )}
        {activeTab === 'discover' && (
          <DiscoverGroupsList searchQuery={searchQuery} />
        )}
      </div>
    </div>
  )
}

export default function GroupsTabView({ defaultTab = 'my-groups' }: GroupsTabViewProps) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <GroupsTabViewContent defaultTab={defaultTab} />
    </Suspense>
  )
} 