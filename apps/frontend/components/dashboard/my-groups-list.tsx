"use client"

import React, { useState, useEffect } from 'react'
import GroupCard from './group-card'
import EmptyGroupState from './empty-group-state'
import { Pagination } from '@/components/ui/pagination'
import type { Cooperative } from '@/types/cooperative'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MyGroupsListProps {
  hasGroups: boolean | null
  searchQuery: string
  userGroups?: Cooperative[]
  isLoading?: boolean
}

type TransformedGroup = {
  id: string
  name: string
  description: string
  coopModel: string
  badge: 'active' | 'pending'
}

function transformMyGroup(cooperative: Cooperative): TransformedGroup {
  return {
    id: cooperative.id,
    name: cooperative.name,
    description: cooperative.description || '',
    coopModel: cooperative.coop_model,
    badge: cooperative.status === 'active' ? 'active' : 'pending',
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
        <span className="text-sm">Loading cooperatives...</span>
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
        <p className="text-sm font-medium text-gray-700">No cooperatives found</p>
        <p className="text-xs text-gray-400 mt-1">
          {searchQuery ? `No results for "${searchQuery}"` : "You don't have any cooperatives yet"}
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
            description={group.description}
            coopModel={group.coopModel}
            badge={group.badge}
            isMyGroup={true}
            onViewDetails={() => router.push(`/dashboard/my-group/${group.id}`)}
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