"use client"

import React from 'react'
import Link from 'next/link'
import { ArrowRight, KeyRound, Users } from 'lucide-react'

import { cn } from '@/lib/utils'

type BadgeType =
  | 'member'
  | 'admin'
  | 'active'
  | 'pending'
  | 'draft'
  | 'paused'
  | 'archived'
  | 'completed'
  | 'deleted'

interface GroupCardProps {
  id?: string
  name: string
  description: string
  coopModel: string
  badge?: BadgeType
  isMyGroup?: boolean
  // Actions
  onRequestInvite?: () => void
  onViewDetails?: () => void
}

const BADGE_STYLES: Record<BadgeType, string> = {
  active:
    'bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]',
  member:
    'bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]',
  admin:
    'bg-[#FBF1D0] text-[#8A6516] dark:bg-[#3A3120] dark:text-[#E8BC63]',
  pending:
    'bg-[#FBF1D0] text-[#8A6516] dark:bg-[#3A3120] dark:text-[#E8BC63]',
  paused:
    'bg-[#FBF1D0] text-[#8A6516] dark:bg-[#3A3120] dark:text-[#E8BC63]',
  draft: 'bg-content/5 text-content/55',
  archived: 'bg-content/5 text-content/45',
  deleted: 'bg-content/5 text-content/40',
  completed:
    'bg-[#DCE8FB] text-[#24508F] dark:bg-[#1B2C44] dark:text-[#A9C5F0]',
}

const BADGE_LABEL: Record<BadgeType, string> = {
  active: 'Active',
  member: 'Member',
  admin: 'Admin',
  pending: 'Pending',
  paused: 'Paused',
  draft: 'Draft',
  archived: 'Archived',
  completed: 'Completed',
  deleted: 'Deleted',
}

function Badge({ badge }: { badge?: BadgeType }) {
  if (!badge) return null
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
        BADGE_STYLES[badge]
      )}
    >
      {BADGE_LABEL[badge]}
    </span>
  )
}

export default function GroupCard({
  id,
  name,
  description,
  coopModel,
  badge,
  isMyGroup = false,
  onRequestInvite
}: GroupCardProps) {
  const initials = name?.trim()?.charAt(0)?.toUpperCase() || 'C'

  const body = (
    <div className="flex h-full flex-col rounded-[22px] border border-content/[0.07] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)] transition-all duration-200 hover:border-content/15 hover:shadow-[0_12px_28px_-22px_rgba(11,23,18,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#DFF0E4] font-display text-base font-bold text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]">
            {initials}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-bold tracking-tight text-content">
              {name}
            </h3>
            <p className="mt-0.5 truncate text-[11px] capitalize text-content/45">
              {coopModel} cooperative
            </p>
          </div>
        </div>
        <Badge badge={badge} />
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-content/55">
        {description || `A ${coopModel} savings cooperative.`}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-content/[0.06] pt-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-content/40">
          <Users className="h-3.5 w-3.5" />
          {isMyGroup ? 'You’re a member' : 'Open to new members'}
        </span>

        {isMyGroup ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#17603F] dark:text-[#7FBF9C]">
            Open
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onRequestInvite?.()
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-content/15 px-3 py-1.5 text-xs font-semibold text-content/75 transition-colors hover:border-content/30 hover:bg-content/[0.03] hover:text-content"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Get invite code
          </button>
        )}
      </div>
    </div>
  )

  if (isMyGroup && id) {
    return (
      <Link href={`/dashboard/cooperative/${id}`} className="group block h-full">
        {body}
      </Link>
    )
  }

  return body
}
