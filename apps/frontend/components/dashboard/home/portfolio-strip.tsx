'use client'

import React from 'react'
import { formatCurrency } from '@/lib/utils'
import { Users, Target, Lock, Wallet } from 'lucide-react'

interface PortfolioStripProps {
  coopCount: number
  totalCoordinated: number
  activeGoalsCount: number
  walletBalance: number
}

export default function PortfolioStrip({
  coopCount,
  totalCoordinated,
  activeGoalsCount,
  walletBalance,
}: PortfolioStripProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Cooperatives */}
      <div className="bg-white rounded-2xl border border-brand-ink/10 p-5 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-brand-ink/50 uppercase tracking-wide">Active Groups</span>
          <p className="font-display text-2xl font-bold text-brand-ink mt-1">{coopCount}</p>
          <p className="text-xs text-brand-ink/40 mt-0.5">Trust circles joined</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Coordinated Capital */}
      <div className="bg-white rounded-2xl border border-brand-ink/10 p-5 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-brand-ink/50 uppercase tracking-wide">Coordinated Capital</span>
          <p className="font-display text-2xl font-bold text-brand-ink mt-1">{formatCurrency(totalCoordinated)}</p>
          <p className="text-xs text-brand-ink/40 mt-0.5">Across all cooperatives</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-brand-gold/15 flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5 text-brand-gold" />
        </div>
      </div>

      {/* Collective Goals */}
      <div className="bg-white rounded-2xl border border-brand-ink/10 p-5 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-brand-ink/50 uppercase tracking-wide">Collective Goals</span>
          <p className="font-display text-2xl font-bold text-brand-ink mt-1">{activeGoalsCount}</p>
          <p className="text-xs text-brand-ink/40 mt-0.5">Shared targets active</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
          <Target className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      {/* Wallet Chip (Demoted) */}
      <div className="bg-brand-paper/80 rounded-2xl border border-brand-ink/10 p-5 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-brand-ink/50 uppercase tracking-wide">Wallet Balance</span>
            <span className="text-[10px] font-bold bg-brand-ink/10 text-brand-ink/70 px-1.5 py-0.5 rounded">
              USDC
            </span>
          </div>
          <p className="font-display text-lg font-bold text-brand-ink mt-1">
            {Number(walletBalance || 0).toFixed(2)}
          </p>
          <p className="text-[11px] text-brand-ink/40">≈ {formatCurrency((walletBalance || 0) * 1600)}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-white border border-brand-ink/10 flex items-center justify-center shrink-0">
          <Wallet className="w-4 h-4 text-brand-ink/70" />
        </div>
      </div>
    </div>
  )
}