'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function CopilotPanel() {
  const router = useRouter()
  const [question, setQuestion] = useState('')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = question.trim()
    router.push(
      trimmed
        ? `/dashboard/ai-chat?q=${encodeURIComponent(trimmed)}`
        : '/dashboard/ai-chat'
    )
  }

  return (
    <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1C3F3B] via-[#173C4A] to-[#123A55] p-5 text-white shadow-[0_18px_40px_-24px_rgba(14,59,46,0.65)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#7FBF9C]/10 blur-2xl"
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#E8BC63]" />
          <h2 className="font-display text-base font-bold tracking-tight">
            Cooperative Copilot
          </h2>
        </div>

        <p className="mt-3 max-w-sm text-xs leading-relaxed text-white/70">
          An AI advisor that analyzes circle liquidity, contribution dynamics
          and payout risks.
        </p>

        <form onSubmit={handleSubmit} className="mt-5">
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] py-1.5 pl-4 pr-1.5 focus-within:border-white/30">
            <label htmlFor="copilot-question" className="sr-only">
              Ask the Cooperative Copilot
            </label>
            <input
              id="copilot-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about your groups..."
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-xs text-white placeholder:text-white/45 focus:outline-none focus:ring-0"
            />
            <button
              type="submit"
              aria-label="Ask Copilot"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8BC63] text-[#243014] transition-colors hover:bg-[#DFB150]"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
