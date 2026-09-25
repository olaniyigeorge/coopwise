'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

interface CooperativeCardProps {
  cooperative: {
    id: string
    name: string
    description?: string | null
    coop_model?: string
    status?: string
  }
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  draft: 'bg-gray-100 text-gray-600',
  paused: 'bg-amber-100 text-amber-800',
  archived: 'bg-gray-100 text-gray-500',
}

export default function CooperativeCard({ cooperative }: CooperativeCardProps) {
  const modelLabel = cooperative.coop_model ? cooperative.coop_model.replace('_', ' ') : 'Cooperative'
  const statusStyle = STATUS_STYLES[cooperative.status ?? ''] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className="bg-white rounded-2xl border border-brand-ink/10 p-5 shadow-sm hover:border-primary/30 transition-all flex flex-col justify-between space-y-4">
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

      {cooperative.description && (
        <p className="text-xs text-brand-ink/60 line-clamp-2">{cooperative.description}</p>
      )}

      {cooperative.status && (
        <div className="pt-3 border-t border-brand-ink/5">
          <span className={`text-[11px] px-2 py-0.5 rounded capitalize ${statusStyle}`}>
            {cooperative.status}
          </span>
        </div>
      )}
    </div>
  )
}
