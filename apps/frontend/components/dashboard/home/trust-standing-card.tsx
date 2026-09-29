'use client'

import React from 'react'
import { TrustStanding } from '@/services/trust-service'
import { ShieldCheck } from 'lucide-react'

interface TrustStandingCardProps {
  standing: TrustStanding
}

export default function TrustStandingCard({ standing }: TrustStandingCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-ink text-white px-5 py-4 shadow-md border border-brand-ink/20">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <ShieldCheck className="w-28 h-28 text-brand-gold" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Tally Motif & Standing */}
        <div>
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
              <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight text-white">
                {standing.tierLabel}
              </h2>
              <p
                className="text-xs text-white/60"
                title={
                  standing.onTimeTracked
                    ? 'Your derived trust standing'
                    : 'On-time tracking starts once your first round completes'
                }
              >
                Trust score: <span className="font-bold text-brand-gold">{standing.score}/100</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Core Attributable Signals */}
        <div className="grid grid-cols-3 gap-3 bg-white/5 px-3.5 py-2.5 rounded-xl border border-white/10 max-w-xl w-full">
          {standing.signals.map((sig) => (
            <div key={sig.id} title={sig.detail}>
              <span className="text-[10px] font-medium uppercase tracking-wider text-white/50 block truncate">
                {sig.label}
              </span>
              <p className="text-sm font-bold text-white truncate">{sig.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}