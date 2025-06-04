"use client"

import React from 'react'
import Link from 'next/link'
import { Bell, ChevronDown, ArrowLeft, Menu } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

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
  
  // Function to get the first name
  const getFirstName = (name: string) => {
    return name.split(' ')[0];
  }
  
  // Function to get the first letter of the first name
  const getFirstNameInitial = (name: string) => {
    const firstName = getFirstName(name);
    return firstName ? firstName[0].toUpperCase() : '';
  }
  
  // Generate a consistent color based on the user's name
  const getAvatarColor = (name: string) => {
    // Get a simple hash of the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate a hue between 0 and 360
    const hue = Math.abs(hash) % 360;
    
    // Use a consistent saturation and lightness for all avatars
    return `hsl(${hue}, 65%, 55%)`;
  }
  
  const avatarColor = getAvatarColor(userName);
  const firstNameInitial = getFirstNameInitial(userName);
  const firstName = getFirstName(userName);
  
  return (
    <header className="w-full bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        {showMobileMenu && (
          <button 
            onClick={onMenuClick}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        )}
        
        {/* Back Button */}
        {showBackButton && (
          <Link 
            href={backUrl}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">Back</span>
          </Link>
        )}
        
        {/* Page Title */}
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      
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
          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
            <AvatarFallback style={{ backgroundColor: "#06413F", color: 'white' }}>
              {firstNameInitial}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex items-center gap-1 min-w-0">
            <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{firstName}</span>
            <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
          </div>
        </div>
      </div>
    </header>
  )
} 