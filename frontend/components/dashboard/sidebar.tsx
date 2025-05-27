"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Home, Users, Plus, UserPlus, MessageSquare, HelpCircle, User, LogOut, DollarSign, Brain, X } from 'lucide-react'
import { toast } from 'sonner'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const navigationItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: <Home className="w-5 h-5" /> 
    },
    { 
      name: 'AI Insights', 
      href: '/dashboard/ai-insights', 
      icon: <Brain className="w-5 h-5" /> 
    },
    { 
      name: 'Contributions', 
      href: '/dashboard/contributions', 
      icon: <DollarSign className="w-5 h-5" /> 
    },
    { 
      name: 'My Group', 
      href: '/dashboard/my-group', 
      icon: <Users className="w-5 h-5" /> 
    },
    { 
      name: 'Create Group', 
      href: '/dashboard/create-group', 
      icon: <Plus className="w-5 h-5" /> 
    },
    { 
      name: 'Join Group', 
      href: '/dashboard/join-group', 
      icon: <UserPlus className="w-5 h-5" /> 
    },
    { 
      name: 'Messages', 
      href: '/dashboard/messages', 
      icon: <MessageSquare className="w-5 h-5" />, 
      badge: 10 
    },
    { 
      name: 'Help & Support', 
      href: '/dashboard/support', 
      icon: <HelpCircle className="w-5 h-5" /> 
    },
    { 
      name: 'Profile', 
      href: '/dashboard/profile', 
      icon: <User className="w-5 h-5" /> 
    },
  ]

  const isActive = (path: string) => {
    // Handle exact match for dashboard root
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    // For other paths, check exact match or if it's a sub-path
    return pathname === path || (pathname?.startsWith(`${path}/`) && path !== '/dashboard')
  }

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (onClose) {
      onClose()
    }
  }

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    try {
      setIsLoggingOut(true)
      
      // Show confirmation toast
      toast.info('Logging out...', {
        description: 'Please wait while we securely log you out.'
      })
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Clear any stored authentication data
      // In a real app, you would call your logout API here
      // localStorage.removeItem('authToken')
      // sessionStorage.clear()
      
      // Close mobile sidebar if open
      if (onClose) {
        onClose()
      }
      
      // Show success message
      toast.success('Logged out successfully', {
        description: 'You have been securely logged out.'
      })
      
      // Redirect to login page
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

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-[208px] bg-primary h-screen overflow-y-auto fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-4 flex items-center">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-2">
          <Image 
            src="/images/coopwise-logo.svg" 
            alt="CoopWise Logo" 
            width={24} 
            height={24}
            className="w-6 h-6"
          />
        </div>
        <span className="text-white font-semibold ml-2 text-lg">CoopWise</span>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 mt-6">
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <Link 
                href={item.href}
                className={`flex items-center px-4 py-3 mx-3 rounded-lg transition-colors ${
                  isActive(item.href) 
                    ? 'bg-white text-primary' 
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Logout */}
      <div className="p-6 mt-auto">
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center text-white/80 hover:text-white w-full disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
          <div className="w-6 h-6 flex items-center justify-center">
              <LogOut className={`w-5 h-5 ${isLoggingOut ? 'animate-spin' : ''}`} />
            </div>
            <span className="ml-3 text-sm font-medium">
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-primary transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-2">
                <Image 
                  src="/images/coopwise-logo.svg" 
                  alt="CoopWise Logo" 
                  width={24} 
                  height={24}
                  className="w-6 h-6"
                />
              </div>
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
          <nav className="flex-1 mt-6 overflow-y-auto">
            <ul className="space-y-1">
              {navigationItems.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`flex items-center px-4 py-3 mx-3 rounded-lg transition-colors ${
                      isActive(item.href) 
                        ? 'bg-white text-primary' 
                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <span className="ml-3 text-sm font-medium">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Logout */}
          <div className="p-6 mt-auto">
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center text-white/80 hover:text-white w-full disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <LogOut className={`w-5 h-5 ${isLoggingOut ? 'animate-spin' : ''}`} />
              </div>
              <span className="ml-3 text-sm font-medium">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </span>
        </button>
      </div>
    </div>
      </div>
    </>
  )
} 