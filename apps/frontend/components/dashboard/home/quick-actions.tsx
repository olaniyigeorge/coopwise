'use client'

import React from 'react'
import Link from 'next/link'
import { Banknote, Plus, Sparkles, Trophy, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

type ActionTile = {
  title: string
  subtitle: string
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>
  background: string
  badge?: string
}

const PRIMARY_TILES: ActionTile[] = [
  {
    title: 'Join a Cooperative',
    subtitle: 'Find a trust circle',
    href: '/dashboard/join-group',
    icon: UserPlus,
    background: 'bg-[#DFF0E4] dark:bg-[#1C3A2C]',
  },
  {
    title: 'Create a Coop',
    subtitle: 'Start a savings group',
    href: '/dashboard/create-cooperative',
    icon: Plus,
    background: 'bg-[#DCE8FB] dark:bg-[#1B2C44]',
  },
  {
    title: 'Payouts',
    subtitle: 'Track when your turn comes',
    href: '/dashboard/payouts',
    icon: Banknote,
    background: 'bg-[#FBE2D6] dark:bg-[#3B2820]',
  },
]

const SECONDARY_TILES: ActionTile[] = [
  {
    title: 'Cooperative Copilot',
    subtitle: 'Ask about liquidity, rhythm and payout risk',
    href: '/dashboard/ai-chat',
    icon: Sparkles,
    background: 'bg-[#E4DCFA] dark:bg-[#2A2140]',
    badge: 'NEW',
  },
  {
    title: 'Leaderboard',
    subtitle: 'See who keeps the best rhythm',
    href: '/dashboard/leaderboard',
    icon: Trophy,
    background: 'bg-[#FBF1D0] dark:bg-[#3A3120]',
  },
]

function ActionTileCard({ tile }: { tile: ActionTile }) {
  return (
    <Link
      href={tile.href}
      className={cn(
        'group relative flex items-center gap-3 rounded-[20px] p-4 transition-transform duration-150 hover:-translate-y-0.5',
        tile.background
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/75 text-content shadow-[0_1px_2px_rgba(11,23,18,0.05)] dark:bg-white/10">
        <tile.icon className="h-5 w-5" strokeWidth={1.9} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-content">
          {tile.title}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-content/55">
          {tile.subtitle}
        </span>
      </span>
      {tile.badge && (
        <span className="absolute -top-1.5 right-4 rounded-full bg-[#E8762B] px-2 py-0.5 text-[9px] font-bold tracking-wide text-white">
          {tile.badge}
        </span>
      )}
    </Link>
  )
}

export default function QuickActions() {
  return (
    <section aria-label="Quick actions" className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PRIMARY_TILES.map((tile) => (
          <ActionTileCard key={tile.title} tile={tile} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SECONDARY_TILES.map((tile) => (
          <ActionTileCard key={tile.title} tile={tile} />
        ))}
      </div>
    </section>
  )
}
