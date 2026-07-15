"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Home, Users, MessageSquare, HelpCircle, Settings, LogOut, Sparkles, Trophy, Wallet, X } from 'lucide-react'
import { toast } from 'sonner'
import useAuthStore from '@/stores/auth-store'
import useNotificationStore from '@/stores/notification-store'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Flat list — no section headers, no nested dropdown.
  // Create Circle / Join Group live on the Dashboard and My Group
  // pages as primary actions, so they're intentionally not duplicated here.
  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Group', href: '/dashboard/my-group', icon: Users },
    { name: 'Payouts', href: '/dashboard/payouts', icon: Wallet },
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
        pathname?.startsWith('/dashboard/my-group/') ||
        pathname?.startsWith('/dashboard/circle/')
      )
    }
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  const handleLinkClick = () => {
    if (onClose) {
      onClose()
    }
  }

  const handleLogout = async () => {
    if (isLoggingOut) return

    try {
      setIsLoggingOut(true)
      toast.info('Logging out...', {
        description: 'Please wait while we securely log you out.'
      })

      await new Promise(resolve => setTimeout(resolve, 1500))

      if (onClose) {
        onClose()
      }

      await logout()

      toast.success('Logged out successfully', {
        description: 'You have been securely logged out.'
      })

      router.replace('/signin')

    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed', {
        description: 'Please try again.'
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const renderNavItem = (item: NavItem) => (
    <li key={item.name}>
      <Link
        href={item.href}
        onClick={handleLinkClick}
        className={`flex items-center px-4 py-3 transition-colors ${
          isActive(item.href)
            ? 'bg-white/10 text-white'
            : 'text-white/75 hover:bg-white/5 hover:text-white'
        }`}
      >
        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
          <item.icon className="w-5 h-5" />
        </div>
        <span className="ml-3 text-sm font-medium">{item.name}</span>
        {!!item.badge && (
          <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        )}
      </Link>
    </li>
  )

  const renderNav = () => (
    <ul className="space-y-1">
      {navItems.map(renderNavItem)}
    </ul>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-[208px] bg-brand-ink h-screen flex-col overflow-hidden fixed left-0 top-0">
        <div className="p-4 flex items-center justify-center">
          <Link href="/" className="flex gap-6 items-center">
            <Image
              src="/assets/icons/logo.svg"
              alt="CoopWise Logo"
              width={36}
              height={36}
            />
            <span className="text-white font-display font-semibold -ml-2 text-lg">CoopWise</span>
          </Link>
        </div>

        <nav className="flex-1 mt-2">
          {renderNav()}
        </nav>

        {/* Utility + Logout, pinned to bottom */}
        <div className="border-t border-white/10">
          <ul className="space-y-1 py-2">
            {utilityItems.map(renderNavItem)}
          </ul>
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center text-white/75 hover:text-white w-full disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="ml-3 text-sm font-medium">
                Logout
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-brand-ink transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/assets/icons/logo.svg"
                alt="CoopWise Logo"
                width={30}
                height={30}
              />
              <span className="text-white font-display font-semibold ml-2 text-lg">CoopWise</span>
            </div>
            <button
              onClick={onClose}
              className="text-white/75 hover:text-white p-1"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* overflow-y-auto stays here only as a safety net for very short
              viewport heights on mobile; with 6 nav items it won't engage
              on any real device. */}
          <nav className="flex-1 mt-2 overflow-y-auto">
            {renderNav()}
          </nav>

          <div className="border-t border-white/10">
            <ul className="space-y-1 py-2">
              {utilityItems.map(renderNavItem)}
            </ul>
            <div className="p-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center text-white/75 hover:text-white w-full disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="ml-3 text-sm font-medium">
                  Logout
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}