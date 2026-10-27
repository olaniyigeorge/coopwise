'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BarChart3, Plus, SlidersHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ComingSoonButton from '@/components/coming-soon-button'
import { formatCurrency, cn } from '@/lib/utils'
import type { FinancialRule } from '@/types/cooperative'
import RollingNumber from '@/components/dashboard/home/rolling-number'

/**The minimum a landing-table row needs; both the dashboard payload's group
 * shape and `/cooperatives/me` satisfy it. */
export type CooperativeRow = {
  id: string
  name: string
  status?: string | null
  coop_model?: string | null
}

interface CooperativesTableProps {
  groups: CooperativeRow[]
  /** Active financial rule per cooperative id, when it could be fetched. */
  rulesByCoop?: Record<string, FinancialRule | null>
  loading?: boolean
  /** Contribution amount and cycle are still being fetched per cooperative. */
  rulesLoading?: boolean
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]',
  pending: 'bg-[#FBF1D0] text-[#8A6516] dark:bg-[#3A3120] dark:text-[#E8BC63]',
  draft: 'bg-content/5 text-content/55',
  paused: 'bg-[#FBF1D0] text-[#8A6516] dark:bg-[#3A3120] dark:text-[#E8BC63]',
  inactive: 'bg-content/5 text-content/55',
  completed: 'bg-[#DCE8FB] text-[#24508F] dark:bg-[#1B2C44] dark:text-[#A9C5F0]',
  archived: 'bg-content/5 text-content/45',
}

function titleCase(value?: string | null) {
  if (!value) return '—'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default function CooperativesTable({
  groups,
  rulesByCoop = {},
  loading = false,
  rulesLoading = false,
}: CooperativesTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          groups
            .map((group) => group.status)
            .filter((status): status is string => !!status)
        )
      ),
    [groups]
  )

  const filteredGroups = useMemo(
    () =>
      statusFilter === 'all'
        ? groups
        : groups.filter((group) => group.status === statusFilter),
    [groups, statusFilter]
  )

  return (
    <section className="flex h-full flex-col rounded-[24px] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)] lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold tracking-tight text-content">
          Your cooperatives ({groups.length})
        </h2>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-content/10 px-4 py-2 text-xs font-semibold text-content/75 transition-colors hover:bg-content/[0.03]"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs text-content/45">
                Status
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setStatusFilter('all')}
                className={cn('cursor-pointer text-sm', statusFilter === 'all' && 'font-semibold')}
              >
                All
              </DropdownMenuItem>
              {statusOptions.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn('cursor-pointer text-sm capitalize', statusFilter === status && 'font-semibold')}
                >
                  {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <ComingSoonButton
            title="Coop reports coming soon"
            description="Contribution compliance, payout rotation and group-level reporting are being built. This will be your export hub."
            className="h-auto gap-2 rounded-full bg-[#0E3B2E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0A2E24] dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:hover:bg-[#93CBAE]"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Coop Reports
          </ComingSoonButton>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 space-y-1">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 border-t border-content/[0.06] py-3"
            >
              <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-content/10" />
              <span className="h-4 w-32 animate-pulse rounded bg-content/10" />
              <span className="ml-auto h-4 w-16 animate-pulse rounded bg-content/10" />
              <span className="h-4 w-20 animate-pulse rounded bg-content/10" />
              <span className="h-6 w-16 animate-pulse rounded-full bg-content/10" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-content/40">
                  <th className="pb-3 pt-1 font-medium">Cooperative</th>
                  <th className="pb-3 pt-1 font-medium">Cycle</th>
                  <th className="pb-3 pt-1 font-medium">Contribution</th>
                  <th className="pb-3 pt-1 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((group) => {
                  const rule = rulesByCoop[group.id]
                  const statusStyle =
                    STATUS_STYLES[group.status ?? ''] ?? 'bg-content/5 text-content/55'
                  return (
                    <tr
                      key={group.id}
                      className="border-t border-content/[0.06] text-sm transition-colors hover:bg-content/[0.03]"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/dashboard/cooperative/${group.id}`}
                          className="flex items-center gap-3"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DFF0E4] text-xs font-bold text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]">
                            {group.name?.charAt(0)?.toUpperCase() || 'C'}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-content">
                              {group.name}
                            </span>
                            <span className="block truncate text-[11px] capitalize text-content/40">
                              {titleCase(group.coop_model)}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-content/65">
                        {rulesLoading && !rule ? (
                          <span className="inline-block h-4 w-16 animate-pulse rounded bg-content/10" />
                        ) : (
                          titleCase(rule?.contribution_frequency)
                        )}
                      </td>
                      <td className="py-3 pr-4 font-medium text-content/75">
                        {rulesLoading && !rule ? (
                          <span className="inline-block h-4 w-20 animate-pulse rounded bg-content/10" />
                        ) : rule?.contribution_amount != null ? (
                          <RollingNumber
                            value={Number(rule.contribution_amount)}
                            format={(n) => formatCurrency(n, 0)}
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={cn(
                            'inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize',
                            statusStyle
                          )}
                        >
                          {group.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredGroups.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
              <div className="relative mb-5 h-16 w-24" aria-hidden="true">
                <span className="absolute left-0 top-0 h-16 w-16 rounded-full bg-[#DFF0E4] dark:bg-[#1C3A2C]" />
                <span className="absolute right-0 top-0 h-16 w-16 rounded-full bg-[#FBF1D0] dark:bg-[#3A3120]" />
                <span className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-content/10 bg-surface/80">
                  <Plus className="h-3.5 w-3.5 text-content/70" />
                </span>
              </div>
              <p className="font-display text-base font-bold text-content">
                {statusFilter === 'all'
                  ? 'No active cooperatives yet'
                  : `No ${statusFilter} cooperatives`}
              </p>
              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-content/50">
                Join or create a group to start building collective savings and trust
                standing.
              </p>
              <Link
                href="/dashboard/join-group"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0E3B2E] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0A2E24] dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:hover:bg-[#93CBAE]"
              >
                Explore Groups
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  )
}
