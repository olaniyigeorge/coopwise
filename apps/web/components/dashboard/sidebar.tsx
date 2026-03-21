"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Home, Users, Plus, UserPlus, MessageSquare, HelpCircle, User, LogOut, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import useAuthStore from '@/lib/stores/auth-store'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const navigationItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: Home
    },
    {
      name: 'AI Assistant',
      href: '/dashboard/ai-chat',
      icon: Sparkles
    },
    { 
      name: 'My Group', 
      href: '/dashboard/my-group', 
      icon: Users
    },
    { 
      name: 'Create Group', 
      href: '/dashboard/create-group', 
      icon: Plus
    },
    { 
      name: 'Join Group', 
      href: '/dashboard/join-group', 
      icon: UserPlus
    },
    { 
      name: 'Messages', 
      href: '/dashboard/messages', 
      icon: MessageSquare,
      badge: 10 
    },

    { 
      name: 'Help & Support', 
      href: '/dashboard/support', 
      icon: HelpCircle
    },
    { 
      name: 'Profile', 
      href: '/dashboard/profile', 
      icon: User
    },
  ]

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname === path || (pathname?.startsWith(`${path}/`) && path !== '/dashboard')
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
     
      logout()

      toast.success('Logged out successfully', {
        description: 'You have been securely logged out.'
      })
      
      router.push('/auth/login')
      
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed', {
        description: 'Please try again.'
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const renderNavItem = (item: typeof navigationItems[0]) => (
            <li key={item.name}>
              <Link 
                href={item.href}
        onClick={handleLinkClick}
        className={`flex items-center px-4 py-3 transition-colors ${
                  isActive(item.href) 
            ? 'bg-white/10 text-white' 
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
              >
        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
          <item.icon className="w-5 h-5" />
                </div>
        <span className="ml-3 text-sm font-medium">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-[208px] bg-[#06413F] h-screen overflow-y-auto fixed left-0 top-0 flex-col ">
        {/* Logo */}
        <div className="p-4 flex items-center justify-center">
          <Link href="/" className="flex gap-6 items-center">
            <Image 
              src="/assets/icons/logo.svg" 
              alt="CoopWise Logo" 
              width={36} 
              height={36}
            />
            <span className="text-white font-semibold -ml-2 text-lg">CoopWise</span>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 mt-4">
          <ul className="space-y-1">
            {navigationItems.map(renderNavItem)}
        </ul>
      </nav>
      
      {/* Logout */}
        <div className="p-4 mt-auto border-t border-white/10">
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center text-white/80 hover:text-white w-full disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
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

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-[#06413F] transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
                <Image 
                  src="/assets/icons/logo.svg" 
                  alt="CoopWise Logo" 
                width={30} 
                height={30}
                />
              <span className="text-white font-semibold ml-2 text-lg">CoopWise</span>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white p-1"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 mt-4 overflow-y-auto">
            <ul className="space-y-1">
              {navigationItems.map(renderNavItem)}
            </ul>
          </nav>
          
          {/* Logout */}
          <div className="p-4 mt-auto border-t border-white/10">
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center text-white/80 hover:text-white w-full disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
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
    </>
  )
} 