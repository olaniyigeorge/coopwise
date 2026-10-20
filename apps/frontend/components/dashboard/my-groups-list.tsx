"use client"

import React, { useEffect, useMemo, useState } from 'react'
import GroupCard from './group-card'
import EmptyGroupState from './empty-group-state'
import { Pagination } from '@/components/ui/pagination'
import type { Cooperative } from '@/types/cooperative'

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
  badge: 'active' | 'pending' | 'draft' | 'paused' | 'archived' | 'completed' | 'deleted'
}

function transformMyGroup(cooperative: Cooperative): TransformedGroup {
  return {
    id: cooperative.id,
    name: cooperative.name,
    description: cooperative.description || '',
    coopModel: cooperative.coop_model,
    badge: cooperative.status,
  }
}

const LIMIT = 6

export default function MyGroupsList({
  hasGroups,
  searchQuery,
  userGroups = [],
  isLoading = false,
}: MyGroupsListProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const groups = useMemo(() => userGroups.map(transformMyGroup), [userGroups])

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return groups
    return groups.filter((group) => group.name.toLowerCase().includes(query))
  }, [groups, searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, userGroups])

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / LIMIT))
  const page = Math.min(currentPage, totalPages)
  const paginatedGroups = filteredGroups.slice((page - 1) * LIMIT, page * LIMIT)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[186px] animate-pulse rounded-[22px] bg-content/[0.04]"
          />
        ))}
      </div>
    )
  }

  if (!hasGroups || groups.length === 0) return <EmptyGroupState />

  if (filteredGroups.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-content/10 px-6 py-12 text-center">
        <p className="font-display text-base font-bold text-content">
          No matches for “{searchQuery}”
        </p>
        <p className="mt-1.5 text-sm text-content/45">
          Try a different cooperative name.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {paginatedGroups.map((group) => (
          <GroupCard
            key={group.id}
            id={group.id}
            name={group.name}
            description={group.description}
            coopModel={group.coopModel}
            badge={group.badge}
            isMyGroup
          />
        ))}
      </div>

      {filteredGroups.length > LIMIT && (
        <div className="flex justify-center pt-2">
          <Pagination
            totalPages={totalPages}
            currentPage={page}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  )
}
