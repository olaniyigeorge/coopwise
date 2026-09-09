'use client'

import React from 'react'
import Link from 'next/link'
import { Sparkles, Bot, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AIInsightCard from '@/components/dashboard/ai-insight-card'
import { AIInsightDetail } from '@/services/dashboard-service'

interface CoopCopilotProps {
  insights?: AIInsightDetail[]
}

export default function CoopCopilot({ insights = [] }: CoopCopilotProps) {
  return (
    <div className="bg-white rounded-2xl border border-brand-ink/10 p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-brand-ink uppercase tracking-wider">Cooperative Copilot</h2>
      </div>

      <div className="rounded-xl bg-brand-paper border border-brand-gold/15 p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xs text-brand-ink/75 leading-relaxed">
            AI-driven cooperative advisor — analyze circle liquidity, contribution dynamics, and payout risks.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-brand-ink/40 mb-1">Inquire about your groups:</p>
        {[
          'How can my group maintain 100% on-time payouts?',
          'What is the optimal payout rotation for our savings target?',
          'Explain collective trust score factors.',
        ].map((q) => (
          <div
            key={q}
            className="bg-brand-paper hover:bg-primary/5 rounded-lg px-3 py-2 text-xs text-brand-ink/65 cursor-pointer transition-colors border border-transparent hover:border-primary/15"
          >
            &ldquo;{q}&rdquo;
          </div>
        ))}
      </div>

      {insights.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-brand-ink/5">
          <p className="text-[11px] font-semibold text-brand-ink/50 uppercase">Active Insights</p>
          {insights.slice(0, 2).map((insight) => (
            <AIInsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      <Link href="/dashboard/ai-chat" className="block pt-2">
        <Button size="sm" className="w-full gap-2 text-xs">
          <MessageSquare className="h-3.5 w-3.5" />
          Consult Copilot
        </Button>
      </Link>
    </div>
  )
}