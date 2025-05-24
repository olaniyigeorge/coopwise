"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bell, ChevronDown, ArrowLeft, Menu } from 'lucide-react'

interface HeaderProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  backUrl?: string
  userName?: string
  onMenuClick?: () => void
  showMobileMenu?: boolean
}

export default function Header({ 
  title = "Dashboard", 
  subtitle,
  showBackButton = false,
  backUrl = "/dashboard",
  userName = "Mercy Oyelenmu",
  onMenuClick,
  showMobileMenu = false
}: HeaderProps) {
  return (
    <header className="flex justify-between items-center py-3 px-3 sm:py-4 sm:px-4 lg:px-6 bg-white border-b border-gray-100">
      {/* Left section */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        {/* Mobile menu button */}
        {showMobileMenu && onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-50 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        )}
        
        {/* Back button */}
        {showBackButton && (
          <Link 
            href={backUrl}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Back</span>
          </Link>
        )}
        
        {/* Title section */}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      
      {/* Right section */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Notification Bell */}
        <button 
          className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        {/* User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-gray-50 rounded-lg px-1 sm:px-2 py-1 transition-colors">
          <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full overflow-hidden bg-gray-200 relative flex-shrink-0">
            <Image 
              src="/images/test-dp.png"
              alt={userName}
              width={32}
              height={32}
              className="object-cover"
              onError={(e) => {
                // Hide broken image and show fallback
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            {/* Fallback initials */}
            <div className="absolute inset-0 flex items-center justify-center text-xs sm:text-sm font-medium text-gray-700 bg-gray-200" style={{ display: 'none' }}>
              {userName.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{userName}</span>
            <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
          </div>
        </div>
      </div>
    </header>
  )
} 