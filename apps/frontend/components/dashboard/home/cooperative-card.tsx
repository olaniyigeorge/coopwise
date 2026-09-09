'use client'

import React from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { ArrowUpRight, Calendar, Users, ShieldAlert } from 'lucide-react'

interface CooperativeCardProps {
  cooperative: {
    id: string
    name: string
    coop_model?: string
    target_amount?: number
    current_amount?: number
    next_payout_date?: string
    current_round?: number
    your_position_in_queue?: number
    member_count?: number
  }
  onTimeStreak?: { onTimeCount: number; totalCount: number } | null
}

export default function CooperativeCard({ cooperative, onTimeStreak }: CooperativeCardProps) {
  const modelLabel = cooperative.coop_model ? cooperative.coop_model.replace('_', ' ') : 'ROSCA / Savings'
  const target = cooperative.target_amount || 0
  const current = cooperative.current_amount || 0
  const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0

  return (
    <div className="bg-white rounded-2xl border border-brand-ink/10 p-5 shadow-sm hover:border-primary/30 transition-all flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-primary/10 text-primary mb-1">
              {modelLabel}
            </span>
            <h3 className="font-display text-lg font-bold text-brand-ink line-clamp-1">{cooperative.name}</h3>
          </div>
          <Link
            href={`/dashboard/cooperative/${cooperative.id}`}
            className="w-8 h-8 rounded-full bg-brand-paper hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors shrink-0"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Goal Progress */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs text-brand-ink/60">
            <span>Collective Goal Progress</span>
            <span className="font-semibold text-brand-ink">{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full h-1.5 bg-brand-ink/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-brand-ink/40">
            <span>{formatCurrency(current)}</span>
            <span>{formatCurrency(target)}</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-brand-ink/5 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-brand-ink/70">
          <Calendar className="w-3.5 h-3.5 text-brand-ink/40" />
          <span>Payout: {cooperative.next_payout_date || 'Scheduled'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-brand-ink/70">
          <Users className="w-3.5 h-3.5 text-brand-ink/40" />
          <span>Position: #{cooperative.your_position_in_queue || '1'}</span>
        </div>
      </div>

      {/* On-Time Streak or TODO Flag */}
      <div className="text-[11px] bg-brand-paper px-3 py-1.5 rounded-lg text-brand-ink/60 flex items-center justify-between">
        <span>On-time Streak:</span>
        {onTimeStreak ? (
          <span className="font-semibold text-primary">
            {onTimeStreak.onTimeCount}/{onTimeStreak.totalCount} rounds
          </span>
        ) : (
          <span className="text-brand-ink/40 italic flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            Flagged // TODO(backend)
          </span>
        )}
      </div>
    </div>
  )
}