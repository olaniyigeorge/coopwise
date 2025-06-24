"use client"

import React, { useEffect } from 'react'
import Link from 'next/link'
import { Bell, ChevronDown, ArrowLeft, Menu, LogOut, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'

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
  userName = "User",
  onMenuClick,
  showMobileMenu = false
}: HeaderProps) {
  const { logout, user } = useAuthStore();
  const { notifications, markAsRead, markAllAsRead, unreadCount, fetchNotifications } = useNotificationStore();
  
  // Listen for notifications
  useNotificationListener();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Helper functions for user display
  const getFirstName = (name: string) => name.split(' ')[0];
  const getFirstNameInitial = (name: string) => {
    const firstName = getFirstName(name);
    return firstName ? firstName[0].toUpperCase() : '';
  };
  
  // Generate avatar color
  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 55%)`;
  };
  
  // User display data
  const actualUserName = user?.full_name || userName;
  const avatarColor = getAvatarColor(actualUserName);
  const firstNameInitial = getFirstNameInitial(actualUserName);
  const firstName = getFirstName(actualUserName);
  
  // Format notification date
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

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between w-full px-3 sm:px-4 py-2 sm:py-3">
        {/* Left section: Menu, Back Button, Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Menu Button */}
          {showMobileMenu && (
            <button 
              onClick={onMenuClick}
              className="p-2 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors lg:hidden touch-manipulation"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          )}
          
          {/* Back Button */}
          {showBackButton && (
            <Link 
              href={backUrl}
              className="p-2 rounded-md hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center gap-1 touch-manipulation"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600 hidden xs:inline">Back</span>
            </Link>
          )}
          
          {/* Page Title */}
          {title && (
            <div className="min-w-0 max-w-full">
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs text-gray-500 truncate hidden xs:block">{subtitle}</p>
              )}
            </div>
          )}
        </div>
        
        {/* Right section: Notifications & Profile */}
        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          {/* Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="relative p-2 hover:bg-gray-50 active:bg-gray-100 rounded-full transition-colors touch-manipulation"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center">
                    {unreadCount > 9 && (
                      <span className="text-[8px] text-white font-bold">9+</span>
                    )}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[90vw] sm:w-80 max-w-md mt-1">
              <DropdownMenuLabel className="flex justify-between items-center">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:bg-primary/5 active:bg-primary/10 py-1 px-2 rounded-md transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification: NotificationDetail) => (
                    <DropdownMenuItem 
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        "cursor-pointer py-3", 
                        notification.is_read ? '' : 'font-medium bg-gray-50'
                      )}
                    >
                      <div className="flex flex-col w-full">
                        <Link href={`/dashboard/notifications#${notification.id}`} className="text-sm font-medium">{notification.title}</Link>
                        <span className="text-xs line-clamp-2 font-normal">
                          {notification.message}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link 
                  href="/dashboard/notifications" 
                  className="cursor-pointer w-full text-center py-3 text-primary hover:text-primary/90 font-medium"
                >
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 active:bg-gray-100 rounded-full sm:rounded-lg px-1 sm:px-2 py-1 transition-colors touch-manipulation">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                  <AvatarFallback style={{ backgroundColor: avatarColor }} className="text-white">
                    {firstNameInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex items-center gap-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[100px]">
                    {firstName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-1">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="cursor-pointer py-2.5">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={logout} 
                className="cursor-pointer py-2.5 text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 