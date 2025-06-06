"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MyGroupsList from './my-groups-list'
import DiscoverGroupsList from './discover-groups-list'
import { Group } from '@/lib/group-service'
import { getDashboardData } from '@/lib/dashboard-service'

interface GroupsTabViewProps {
  defaultTab?: 'my-groups' | 'discover'
}

interface DashboardGroupsData {
  groups?: {
    user_groups?: Group[];
    suggested_groups?: Group[];
  }
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
  const [hasGroups, setHasGroups] = useState<boolean | null>(null)
  const [userGroups, setUserGroups] = useState<Group[]>([])
  const [suggestedGroups, setSuggestedGroups] = useState<Group[]>([])
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
    // Fetch dashboard data to get groups info
    const fetchDashboardGroups = async () => {
      try {
        setLoading(true)
        const dashboardData = await getDashboardData() as DashboardGroupsData
        
        console.log('Dashboard data for groups:', dashboardData)
        
        // Check if the dashboard data contains groups information
        if (dashboardData && dashboardData.groups) {
          const groupsData = dashboardData.groups
          
          // Set user groups
          if (groupsData.user_groups && Array.isArray(groupsData.user_groups)) {
            setUserGroups(groupsData.user_groups)
            setHasGroups(groupsData.user_groups.length > 0)
          } else {
            setUserGroups([])
            setHasGroups(false)
          }
          
          // Set suggested groups
          if (groupsData.suggested_groups && Array.isArray(groupsData.suggested_groups)) {
            setSuggestedGroups(groupsData.suggested_groups)
          } else {
            setSuggestedGroups([])
          }
        } else {
          // If no groups data in dashboard, set empty arrays
          setUserGroups([])
          setSuggestedGroups([])
          setHasGroups(false)
        }
      } catch (error) {
        console.error('Error fetching dashboard groups data:', error)
        setUserGroups([])
        setSuggestedGroups([])
        setHasGroups(false)
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardGroups()
  }, [])
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

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
            /* @ts-ignore - We're passing the groups from API directly */
            userGroups={userGroups}
            isLoading={loading}
          />
        )}
        {activeTab === 'discover' && (
          <DiscoverGroupsList 
            searchQuery={searchQuery}
            /* @ts-ignore - We're passing the groups from API directly */
            suggestedGroups={suggestedGroups}
            isLoading={loading}
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