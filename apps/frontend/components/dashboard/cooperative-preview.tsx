"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, HandCoins, ShieldCheck, Users, Zap } from 'lucide-react'

import { UserAvatar } from '@/components/ui/user-avatar'
import type { CooperativePreview } from '@/types/cooperative'

function formatMoney(amount: number, currency: string | null): string {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency ?? '₦'} ${amount.toLocaleString()}`
  }
}

const FREQUENCY_LABEL: Record<string, string> = {
  daily: 'every day',
  weekly: 'every week',
  biweekly: 'every 2 weeks',
  monthly: 'every month',
  custom: 'on a custom schedule',
}

function Fact({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold text-neutral-900">{value}</p>
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}

/** Body of the "review this group before you join" dialog. */
export default function CooperativePreviewCard({ preview }: { preview: CooperativePreview }) {
  const modelLabel = preview.coop_model
    ? preview.coop_model.charAt(0).toUpperCase() + preview.coop_model.slice(1)
    : null

  const contribution =
    preview.contribution_amount != null
      ? formatMoney(preview.contribution_amount, preview.contribution_currency)
      : 'Not set yet'
  const cadence = preview.contribution_frequency
    ? FREQUENCY_LABEL[preview.contribution_frequency] ?? preview.contribution_frequency
    : undefined

  const members =
    preview.max_members != null
      ? `${preview.member_count} of ${preview.max_members}`
      : `${preview.member_count}`

  return (
    <div className="space-y-4">
      {/* Header: cover + identity */}
      <div className="overflow-hidden rounded-2xl border border-neutral-100">
        <div className="relative h-24 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700">
          {preview.cover_image && (
            <Image src={preview.cover_image} alt="" fill className="object-cover" />
          )}
        </div>
        <div className="px-4 pb-4">
          <div className="relative z-10 -mt-7 flex items-end gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-emerald-100 text-xl font-bold text-emerald-700 shadow-sm">
              {preview.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 pb-0.5">
              <h3 className="truncate text-base font-semibold text-neutral-900">{preview.name}</h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                {modelLabel && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {modelLabel}
                  </span>
                )}
                {preview.status !== 'active' && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium capitalize text-amber-700">
                    {preview.status}
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">
            {preview.description?.trim() || (
              <span className="text-neutral-400">The organiser hasn&apos;t added a description yet.</span>
            )}
          </p>
        </div>
      </div>

      {/* What joining means */}
      <div className="grid grid-cols-2 gap-3">
        <Fact icon={HandCoins} label="Contribution" value={contribution} hint={cadence} />
        <Fact icon={Users} label="Members" value={members} />
        <Fact
          icon={preview.requires_approval ? ShieldCheck : Zap}
          label="How you join"
          value={
            preview.admission === 'member_vote'
              ? 'Member vote'
              : preview.admission === 'admin_approval'
                ? 'Admin approval'
                : 'Instant'
          }
          hint={
            preview.admission === 'member_vote'
              ? 'Members vote on new requests'
              : preview.admission === 'admin_approval'
                ? 'An admin reviews requests'
                : undefined
          }
        />
        <Fact
          icon={CalendarDays}
          label="Started"
          value={new Date(preview.created_at).toLocaleDateString('en-NG', {
            month: 'short',
            year: 'numeric',
          })}
        />
      </div>

      {/* Organiser */}
      {preview.organizer && (
        <div className="flex items-center gap-3 rounded-xl border border-neutral-100 p-3">
          <UserAvatar
            name={preview.organizer.full_name}
            src={preview.organizer.profile_picture_url}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-neutral-500">Organised by</p>
            <Link
              href={`/dashboard/users/${preview.organizer.id}`}
              target="_blank"
              className="block truncate text-sm font-semibold text-neutral-900 hover:text-emerald-700 hover:underline"
            >
              {preview.organizer.full_name}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
