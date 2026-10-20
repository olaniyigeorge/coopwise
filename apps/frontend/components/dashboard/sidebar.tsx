"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Home,
  Users,
  MessageSquare,
  HelpCircle,
  Settings,
  Sparkles,
  Trophy,
  Wallet,
  Banknote,
  X,
} from 'lucide-react'
import useNotificationStore from '@/stores/notification-store'
import { useDashboardChromeStore } from '@/stores/dashboard-chrome-store'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>
  badge?: number
}

function TrustScoreCard() {
  const { trustScore } = useDashboardChromeStore()
  const stars = Math.min(5, Math.max(1, Math.ceil(trustScore / 20)))

  return (
    <div className="mx-3 mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/70">Trust score</span>
        <span className="text-sm font-semibold text-[#E8BC63]">
          {trustScore}/100
        </span>
      </div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#D9A648] to-[#F0CD82] transition-all duration-700"
          style={{ width: `${Math.min(100, Math.max(0, trustScore))}%` }}
        />
      </div>
      <div className="mt-2.5 flex items-center gap-1" aria-label={`${stars} of 5 trust stars`}>
        {Array.from({ length: 5 }).map((_, idx) => (
          <svg
            key={idx}
            viewBox="0 0 20 20"
            className={cn(
              'h-4 w-4',
              idx < stars ? 'text-[#E8BC63]' : 'text-white/20'
            )}
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10 1.6l2.6 5.28 5.83.85-4.22 4.11 1 5.8L10 14.9l-5.21 2.74 1-5.8L1.57 7.73l5.83-.85L10 1.6z" />
          </svg>
        ))}
      </div>
    </div>
  )
}

function BrandMark({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0E3B2E]">
          <Image
            src="/assets/icons/logo.svg"
            alt=""
            width={18}
            height={24}
            className="h-5 w-auto"
          />
        </span>
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-white">
        CoopWise
      </span>
    </Link>
  )
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { unreadCount } = useNotificationStore()

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Group', href: '/dashboard/my-group', icon: Users },
    { name: 'Wallet', href: '/dashboard/wallet/fund', icon: Wallet },
    { name: 'Payouts', href: '/dashboard/payouts', icon: Banknote },
    { name: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
    { name: 'AI Assistant', href: '/dashboard/ai-chat', icon: Sparkles },
    {
      name: 'Messages',
      href: '/dashboard/messages',
      icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ]

  const utilityItems: NavItem[] = [
    { name: 'Help & Support', href: '/dashboard/support', icon: HelpCircle },
    { name: 'Account', href: '/dashboard/account', icon: Settings },
  ]

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    if (path === '/dashboard/my-group') {
      return (
        pathname === '/dashboard/my-group' ||
        pathname?.startsWith('/dashboard/my-group/')
      )
    }
    if (path === '/dashboard/wallet/fund') {
      return pathname?.startsWith('/dashboard/wallet')
    }
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  const handleLinkClick = () => {
    if (onClose) {
      onClose()
    }
  }

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.href)
    return (
      <li key={item.name}>
        <Link
          href={item.href}
          onClick={handleLinkClick}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex items-center rounded-full px-4 py-2.5 text-sm font-medium transition-colors',
            active
              ? 'bg-white/10 text-white'
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          )}
        >
          <item.icon
            className="h-5 w-5 shrink-0"
            strokeWidth={active ? 2.1 : 1.8}
          />
          <span className="ml-3">{item.name}</span>
          {!!item.badge && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E8762B] px-1.5 text-[10px] font-semibold text-white">
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          )}
        </Link>
      </li>
    )
  }

  const navContent = (
    <>
      <nav className="mt-5 flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">{navItems.map(renderNavItem)}</ul>
      </nav>

      <div className="mt-2 border-t border-white/10 px-3 pb-4 pt-3">
        <ul className="space-y-1">{utilityItems.map(renderNavItem)}</ul>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed bottom-3 left-3 top-3 z-30 hidden w-[228px] flex-col overflow-hidden rounded-[28px] bg-[#173A2F] text-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.55)] lg:flex">
        <div className="px-5 pb-1 pt-6">
          <BrandMark />
        </div>        <TrustScoreCard />
        {navContent}
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[264px] transform flex-col overflow-hidden rounded-r-[28px] bg-[#173A2F] text-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between px-5 pb-1 pt-5">
          <BrandMark onNavigate={handleLinkClick} />
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <TrustScoreCard />
        {navContent}
      </aside>
    </>
  )
}
