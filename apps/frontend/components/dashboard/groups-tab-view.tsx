"use client"

import React, { useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, UserPlus } from 'lucide-react'

import MyGroupsList from './my-groups-list'
import DiscoverGroupsList from './discover-groups-list'
import { cn } from '@/lib/utils'
import { useGroupStore } from '@/lib/hooks/use-app-store'

interface GroupsTabViewProps {
  defaultTab?: 'my-groups' | 'discover'
}

function LoadingFallback() {
  return (
    <div className="space-y-5 p-1">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-content/[0.05]" />
      <div className="h-11 w-full animate-pulse rounded-full bg-content/[0.04]" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="h-[186px] animate-pulse rounded-[22px] bg-content/[0.04]" />
        <div className="h-[186px] animate-pulse rounded-[22px] bg-content/[0.04]" />
      </div>
    </div>
  )
}

function GroupsTabViewContent({ defaultTab = 'my-groups' }: GroupsTabViewProps) {
  const searchParams = useSearchParams()
  const {
    myGroups,
    availableGroups,
    error,
    fetchMyGroups,
    fetchAvailableGroups,
  } = useGroupStore()

  const tabParam = searchParams.get('tab')
  const initialTab: 'my-groups' | 'discover' =
    tabParam === 'my-groups' || tabParam === 'my'
      ? 'my-groups'
      : tabParam === 'discover'
        ? 'discover'
        : defaultTab

  const [activeTab, setActiveTab] = useState<'my-groups' | 'discover'>(initialTab)
  const [searchQuery, setSearchQuery] = useState('')
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
      } catch (err) {
        console.error('Error fetching groups:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchGroups()
  }, [fetchMyGroups, fetchAvailableGroups])

  const myGroupIds = useMemo(
    () => myGroups.map((group) => group.id),
    [myGroups]
  )

  // Discovery is for cooperatives you are *not* already part of — including
  // ones you created, which land in `myGroups` via /cooperatives/me.
  const discoverGroups = useMemo(() => {
    const mine = new Set(myGroupIds)
    return availableGroups.filter((group) => !mine.has(group.id))
  }, [availableGroups, myGroupIds])

  const tabs = [
    { key: 'my-groups' as const, label: 'My groups', count: myGroups.length },
    {
      key: 'discover' as const,
      label: 'Discover',
      count: discoverGroups.length,
    },
  ]

  return (
    <div className="space-y-5 pb-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-content/40">
            Your network
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-content sm:text-4xl">
            Cooperatives
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-content/50">
            The groups you save with, and the ones you could join next.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/join-group"
            className="inline-flex items-center gap-2 rounded-full border border-content/15 px-4 py-2.5 text-sm font-semibold text-content transition-colors hover:border-content/30 hover:bg-content/[0.03]"
          >
            <UserPlus className="h-4 w-4" />
            Join with code
          </Link>
          <Link
            href="/dashboard/create-cooperative"
            className="inline-flex items-center gap-2 rounded-full bg-[#0E3B2E] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0A2E24] dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:hover:bg-[#93CBAE]"
          >
            <Plus className="h-4 w-4" />
            Create
          </Link>
        </div>
      </header>

      <div className="rounded-[24px] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-full rounded-full border border-content/10 bg-content/[0.02] p-1 sm:w-auto">
            {tabs.map((tab) => {
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:flex-none',
                    active
                      ? 'bg-[#0E3B2E] text-white shadow-sm dark:bg-[#7FBF9C] dark:text-[#0B1712]'
                      : 'text-content/55 hover:text-content'
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                      active
                        ? 'bg-white/15 text-white dark:bg-[#0B1712]/10 dark:text-[#0B1712]'
                        : 'bg-content/[0.06] text-content/45'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-content/35" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search cooperatives"
              aria-label="Search cooperatives"
              className="h-11 w-full rounded-full border border-content/10 bg-content/[0.02] pl-11 pr-4 text-sm text-content placeholder:text-content/35 focus:border-[#0E3B2E]/40 focus:outline-none focus:ring-2 focus:ring-[#0E3B2E]/15 dark:focus:border-[#7FBF9C]/40 dark:focus:ring-[#7FBF9C]/20"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-[#5A4A22] dark:bg-[#2E2818] dark:text-[#E8BC63]">
            {error}
          </p>
        )}

        <div className="mt-5">
          {activeTab === 'my-groups' ? (
            <MyGroupsList
              hasGroups={myGroups.length > 0}
              searchQuery={searchQuery}
              userGroups={myGroups}
              isLoading={loading}
            />
          ) : (
            <DiscoverGroupsList
              searchQuery={searchQuery}
              suggestedGroups={discoverGroups}
              excludeIds={myGroupIds}
              isLoading={loading}
            />
          )}
        </div>
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
