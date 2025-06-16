"use client"

import React, { useEffect } from 'react'
import Link from 'next/link'
import { Bell, ChevronDown, ArrowLeft, Menu, LogOut, User, Settings } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import useAuthStore from '@/lib/stores/auth-store'
import { useNotificationListener } from '@/lib/hooks/use-notifications-socket'
import useNotificationStore, { NotificationDetail } from '@/lib/stores/notification-store'

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
  const { logout, user } = useAuthStore();
  // const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { notifications, markAsRead, markAllAsRead, unreadCount, fetchNotifications } = useNotificationStore()
  // Listening for notification in dashboard(header) 
  useNotificationListener()

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);


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
  
  // Get the actual user name from auth context if available
  const actualUserName = user?.full_name || userName;
  const avatarColor = getAvatarColor(actualUserName);
  const firstNameInitial = getFirstNameInitial(actualUserName);
  const firstName = getFirstName(actualUserName);
  
  // Format date for notifications
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };


  console.log(` Notifications ${notifications.length}`)
  





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
        {/* Notification Bell with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex justify-between items-center">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.slice(0, 5).map((notification: NotificationDetail) => (
                <DropdownMenuItem 
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={`cursor-pointer ${notification.is_read ? '' : 'font-medium bg-gray-50'}`}
                >
                  <div className="flex flex-col w-full">
                    <span>{notification.message}</span>
                    <span className="text-xs text-gray-500 mt-1">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/notifications" className="cursor-pointer w-full text-center">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* User Profile with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-gray-50 rounded-lg px-1 sm:px-2 py-1 transition-colors">
              <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-white">
                  {firstNameInitial}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex items-center gap-1 min-w-0">
                <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{firstName}</span>
                <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
         
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
} 