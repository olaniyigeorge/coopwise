"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import MyGroupsList from './my-groups-list'
import DiscoverGroupsList from './discover-groups-list'
import { useGroupStore } from '@/lib/hooks/use-app-store'

interface GroupsTabViewProps {
  defaultTab?: 'my-groups' | 'discover'
}

function LoadingFallback() {
  return (
    <div className="p-5 space-y-4 animate-pulse">
      <div className="h-5 bg-gray-100 rounded w-40" />
      <div className="h-10 bg-gray-100 rounded-xl" />
      <div className="h-48 bg-gray-100 rounded-xl" />
    </div>
  )
}

function GroupsTabViewContent({ defaultTab = 'my-groups' }: GroupsTabViewProps) {
  const searchParams = useSearchParams()
  const { myGroups, availableGroups, fetchMyGroups, fetchAvailableGroups, isLoading } = useGroupStore()

  const tabParam = searchParams.get('tab')
  const initialTab = tabParam === 'my-groups' ? 'my-groups' : tabParam === 'discover' ? 'discover' : defaultTab

  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [searchQuery] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tabParam === 'my' || tabParam === 'my-groups') setActiveTab('my-groups')
    else if (tabParam === 'discover') setActiveTab('discover')
  }, [tabParam])

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true)
        await Promise.all([fetchMyGroups(), fetchAvailableGroups()])
      } catch (error) {
        console.error('Error fetching groups:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchGroups()
  }, [fetchMyGroups, fetchAvailableGroups])

  const hasGroups = myGroups && myGroups.length > 0

  return (
    <div className="p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">Saving Groups</h2>
        <p className="text-xs text-gray-500 mt-0.5">Your active groups and ones you can join</p>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
        {[
          { key: 'my-groups', label: 'My Groups' },
          { key: 'discover', label: 'Discover' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

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
  )
}

export default function GroupsTabView({ defaultTab = 'my-groups' }: GroupsTabViewProps) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <GroupsTabViewContent defaultTab={defaultTab} />
    </Suspense>
  )
}