"use client"

import React, { useState, useEffect } from 'react'
import GroupCard from './group-card'
import EmptyGroupState from './empty-group-state'
import { Pagination } from '@/components/ui/pagination'
import { Group } from '@/lib/group-service'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MyGroupsListProps {
  hasGroups: boolean | null
  searchQuery: string
  userGroups?: Group[]
  isLoading?: boolean
}

type TransformedGroup = {
  id: string
  name: string
  memberCount: number
  maxMembers: number
  contributionAmount: string
  frequency: string
  description: string
  badge: 'member' | 'admin'
  nextContribution: { amount: string; dueDate: string; daysLeft: number }
  nextPayout: { amount: string; date: string }
}

function getNextContributionDate(frequency: string): string {
  const next = new Date()
  if (frequency === 'daily') next.setDate(next.getDate() + 1)
  else if (frequency === 'weekly') next.setDate(next.getDate() + 7)
  else next.setMonth(next.getMonth() + 1)
  return next.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}

function getNextContributionDaysLeft(frequency: string): number {
  if (frequency === 'daily') return 1
  if (frequency === 'weekly') return 7
  return 30
}

function getNextPayoutDate(frequency: string): string {
  const next = new Date()
  if (frequency === 'daily') next.setDate(next.getDate() + 10)
  else if (frequency === 'weekly') next.setDate(next.getDate() + 56)
  else next.setMonth(next.getMonth() + 6)
  return next.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
}

function transformMyGroup(group: Group): TransformedGroup {
  const memberCount = group.memberCount || Math.floor(Math.random() * group.max_members) + 1
  return {
    id: group.id,
    name: group.name,
    memberCount,
    maxMembers: group.max_members,
    contributionAmount: `₦${group.contribution_amount.toLocaleString()}`,
    frequency: group.contribution_frequency,
    description: group.description || `A ${group.contribution_frequency} savings group`,
    badge: (group.role as 'member' | 'admin') || 'member',
    nextContribution: {
      amount: `₦${group.contribution_amount.toLocaleString()}`,
      dueDate: getNextContributionDate(group.contribution_frequency),
      daysLeft: getNextContributionDaysLeft(group.contribution_frequency),
    },
    nextPayout: {
      amount: `₦${(group.contribution_amount * 5).toLocaleString()}`,
      date: getNextPayoutDate(group.contribution_frequency),
    },
  }
}

const LIMIT = 4

export default function MyGroupsList({ hasGroups, searchQuery, userGroups = [], isLoading = false }: MyGroupsListProps) {
  const router = useRouter()
  const [groups, setGroups] = useState<TransformedGroup[]>([])
  const [localLoading, setLocalLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setLocalLoading(true)
    try {
      if (Array.isArray(userGroups) && userGroups.length > 0) {
        setGroups(userGroups.map(transformMyGroup))
      } else if (!isLoading) {
        setGroups([])
      }
    } catch (err) {
      console.error('Error processing groups:', err)
      setGroups([])
    } finally {
      setLocalLoading(false)
    }
  }, [userGroups, isLoading])

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const totalPages = Math.ceil(filteredGroups.length / LIMIT)
  const paginatedGroups = filteredGroups.slice((currentPage - 1) * LIMIT, currentPage * LIMIT)

  if (isLoading || localLoading) {
    return (
      <div className="flex justify-center items-center py-12 text-gray-400 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading groups...</span>
      </div>
    )
  }

  if (!hasGroups || groups.length === 0) return <EmptyGroupState />

  if (filteredGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700">No groups found</p>
        <p className="text-xs text-gray-400 mt-1">
          {searchQuery ? `No results for "${searchQuery}"` : "You don't have any groups yet"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            onViewDetails={() => router.push(`/dashboard/group/${group.id}`)}
            onRequestInvite={() => router.push(`/dashboard/group/${group.id}/invite`)}
          />
        ))}
      </div>

      {filteredGroups.length > LIMIT && (
        <div className="flex justify-center pt-2">
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  )
}