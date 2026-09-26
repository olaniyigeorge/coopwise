'use client'

import React from 'react'
import { TrustStanding } from '@/services/trust-service'
import { ShieldCheck, Info } from 'lucide-react'

interface TrustStandingCardProps {
  standing: TrustStanding
}

export default function TrustStandingCard({ standing }: TrustStandingCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-ink text-white p-6 shadow-md border border-brand-ink/20">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <ShieldCheck className="w-48 h-48 text-brand-gold" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Tally Motif & Standing */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-gold text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Derived Trust Standing
          </div>

          <div className="flex items-center gap-4">
            {/* Tally Mark Motif */}
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl">
              {Array.from({ length: 4 }).map((_, idx) => (
                <span
                  key={idx}
                  className={`h-7 w-1.5 rounded-full transition-all duration-500 ${
                    idx < standing.tallyMarks ? 'bg-brand-gold shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'bg-white/15'
                  }`}
                />
              ))}
            </div>

            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white">
                {standing.tierLabel}
              </h2>
              <p className="text-xs text-white/60">
                Score: <span className="font-bold text-brand-gold">{standing.score}/100</span>
                {!standing.onTimeTracked && (
                  <span className="ml-2 text-white/40 italic">
                    (on-time tracking starts once your first round completes)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Core Attributable Signals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/5 p-3.5 rounded-xl border border-white/10 max-w-xl w-full">
          {standing.signals.map((sig) => (
            <div key={sig.id} className="space-y-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-white/50 block">
                {sig.label}
              </span>
              <p className="text-sm font-bold text-white">{sig.value}</p>
              <p className="text-[11px] text-white/60 line-clamp-1">{sig.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}