"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Users, 
  DollarSign, 
  Sparkles, 
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
      <div className="grid grid-cols-5 h-16">
        {navigationItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-all relative",
              "min-h-[56px] py-1",
              isActive(item.href)
                ? "text-primary"
                : "text-gray-500 hover:text-gray-900 active:bg-gray-100"
            )}
          >
            <div className={cn(
              "relative flex items-center justify-center",
              isActive(item.href) ? "scale-110 transition-transform" : ""
            )}>
              {item.icon}
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-4 h-4 flex items-center justify-center px-1">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium truncate max-w-[80px] px-1">
              {item.name}
            </span>
            {isActive(item.href) && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 rounded-full bg-primary" />
            )}
          </Link>
        ))}
      </div>
      
      {/* Safe area spacing for newer iOS devices */}
      <div className="h-safe-bottom bg-white" />
    </nav>
  )
} 