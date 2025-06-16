"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Users, 
  DollarSign, 
  Sparkles, 
  User,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  badge?: number
}

const navigationItems: NavItem[] = [
  {
    name: 'Home',
    href: '/dashboard',
    icon: <Home className="w-5 h-5" />
  },
  {
    name: 'Groups',
    href: '/dashboard/my-group',
    icon: <Users className="w-5 h-5" />
  },
  {
    name: 'Contributions',
    href: '/dashboard/contributions',
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    name: 'AI Chat',
    href: '/dashboard/ai-chat',
    icon: <Sparkles className="w-5 h-5" />
  },
  {
    name: 'Messages',
    href: '/dashboard/messages',
    icon: <MessageSquare className="w-5 h-5" />,
    badge: 10
  }
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="grid grid-cols-5 h-16">
        {navigationItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors relative",
              isActive(item.href)
                ? "text-primary bg-primary/5"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <div className="relative">
              {item.icon}
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-xs font-medium truncate max-w-full px-1">
              {item.name}
            </span>
            {isActive(item.href) && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
} 