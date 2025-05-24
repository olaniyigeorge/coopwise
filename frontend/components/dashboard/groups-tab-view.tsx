"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import MyGroupsList from './my-groups-list'
import DiscoverGroupsList from './discover-groups-list'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  const [activeTab, setActiveTab] = useState<string>(defaultTab)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Simulate fetching user data to determine if they have any groups
  // In a real app, this would come from an API
  const [hasGroups, setHasGroups] = useState<boolean | null>(null)
  
  useEffect(() => {
    // Simulate API call to check if user has groups
    const fetchUserGroups = async () => {
      // This would be an API call in a real app
      setTimeout(() => {
        // For demo purposes, we'll alternate between having groups and not
        // In a real app, this would come from your API
        const hasExistingGroups = localStorage.getItem('hasGroups') === 'true'
        setHasGroups(hasExistingGroups)
      }, 500)
    }
    
    fetchUserGroups()
  }, [])
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    
    // Update URL to reflect the current tab
    if (value === 'my-groups') {
      router.push('/dashboard/my-group')
    } else {
      router.push('/dashboard/discover-groups')
    }
  }
  
  // Toggle user state for demo purposes (new user vs existing user)
  const toggleUserState = () => {
    const newState = !hasGroups
    localStorage.setItem('hasGroups', String(newState))
    setHasGroups(newState)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100 rounded-lg p-1">
            <TabsTrigger 
              value="my-groups" 
              className={`rounded-md ${activeTab === 'my-groups' ? 'bg-primary text-white' : ''}`}
            >
              My Groups
            </TabsTrigger>
            <TabsTrigger 
              value="discover" 
              className={`rounded-md ${activeTab === 'discover' ? 'bg-primary text-white' : ''}`}
            >
              Discover Groups
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search group"
            className="pl-9 py-5"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Dev toggle button - remove in production */}
      <div className="hidden">
        <Button 
          onClick={toggleUserState} 
          variant="outline" 
          size="sm"
        >
          Toggle User State (Currently: {hasGroups ? 'Existing User' : 'New User'})
        </Button>
      </div>
      
      {/* Tab content */}
      <div className="mt-6">
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