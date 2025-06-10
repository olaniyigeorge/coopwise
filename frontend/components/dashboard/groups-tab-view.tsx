"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MyGroupsList from './my-groups-list'
import DiscoverGroupsList from './discover-groups-list'
import { useGroupStore } from '@/lib/hooks/use-app-store'
import { getDashboardData } from '@/lib/dashboard-service'

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
  const { 
    myGroups, 
    availableGroups, 
    fetchMyGroups, 
    fetchAvailableGroups,
    isLoading,
    error
  } = useGroupStore()
  
  // Check for tab in URL params
  const tabParam = searchParams.get('tab')
  const initialTab = tabParam === 'my' ? 'discover' : tabParam === 'my-groups' ? 'my-groups' : defaultTab
  
  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // If tab param changes, update the active tab
    if (tabParam === 'my') {
      setActiveTab('my-groups')
    } else if (tabParam === 'discover') {
      setActiveTab('discover')
    }
  }, [tabParam])
  
  useEffect(() => {
    // Use Zustand store to fetch groups
    const fetchGroups = async () => {
      try {
        setLoading(true)
        // Fetch both types of groups
        await Promise.all([
          fetchMyGroups(),
          fetchAvailableGroups()
        ]);
      } catch (error) {
        console.error('Error fetching groups data:', error)
      } finally {
        setLoading(false)
      }
    }
    

    fetchGroups()
  }, [fetchMyGroups, fetchAvailableGroups])

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  // Determine if user has groups
  const hasGroups = myGroups && myGroups.length > 0

  return (
    <div className="p-3">
      <h1 className="text-2xl font-semibold text-teal-700 mb-1">Saving Groups</h1>
      <h2 className="text-sm text-gray-500 mb-4">See your active groups or join a new one.</h2>
      <div className="grid grid-cols-2 rounded-md py-3 px-2 overflow-hidden bg-gray-200 mb-6">
        <button
          onClick={() => handleTabChange('my-groups')}
          className={`py-3  w-full text-center font-medium text-sm rounded-md ${
            activeTab === 'my-groups' 
              ? 'bg-primary text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          My Groups
        </button>
        <button
          onClick={() => handleTabChange('discover')}
          className={`py-3 text-center font-medium text-sm rounded-md ${
            activeTab === 'discover' 
              ? 'bg-primary text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Discover Groups
        </button>
      </div>
      
      {/* Tab content */}
      <div>
        {activeTab === 'my-groups' && (
          <MyGroupsList 
            hasGroups={hasGroups} 
            searchQuery={searchQuery}
            userGroups={myGroups}
            isLoading={loading || isLoading}
          />
        )}
        {activeTab === 'discover' && (
          <DiscoverGroupsList 
            searchQuery={searchQuery}
            suggestedGroups={availableGroups}
            isLoading={loading || isLoading}
          />
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