"use client"

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Info,
  Loader2,
  LogOut,
  Menu,
  User,
} from 'lucide-react'
import { UserAvatar } from '@/components/ui/user-avatar'
import ThemeToggle from '@/components/theme-toggle'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils'

import useAuthStore from '@/stores/auth-store'
import { useNotificationListener } from '@/lib/hooks/use-notifications-socket'
import useNotificationStore, { NotificationDetail } from '@/stores/notification-store'


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
  const router = useRouter()
  const { logout, user } = useAuthStore();

  const { notifications, markAsRead, markAllAsRead, unreadCount, isLoading, fetchNotifications } = useNotificationStore();
  
  // Listen for notifications
  useNotificationListener();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Helper functions for user display
  const getFirstName = (name: string) => name.split(' ')[0];
  
  // User display data
  const actualUserName = user?.full_name || userName;
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

  // The row icon depends on the notification type so a warning doesn't read
  // like a payout.
  const notificationVisual = (type: NotificationDetail['type']) => {
    switch (type) {
      case 'success':
        return {
          Icon: CheckCircle2,
          className:
            'bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]',
        }
      case 'warning':
        return {
          Icon: AlertTriangle,
          className:
            'bg-[#FBF1D0] text-[#8A6516] dark:bg-[#3A3120] dark:text-[#E8BC63]',
        }
      case 'danger':
        return {
          Icon: AlertTriangle,
          className:
            'bg-[#FBE4E4] text-[#9B2C2C] dark:bg-[#3A2020] dark:text-[#F0A9A9]',
        }
      default:
        return {
          Icon: Info,
          className: 'bg-content/[0.05] text-content/55',
        }
    }
  }

  // Store actions reject on network failure; swallow here so a failed mark
  // doesn't surface as an unhandled promise rejection in the header.
  const handleMarkAsRead = (id: string) => {
    void markAsRead(id).catch(() => {})
  }
  const handleMarkAllAsRead = () => {
    void markAllAsRead().catch(() => {})
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-content/10 bg-surface shadow-sm lg:rounded-t-[28px]">
      <div className="flex items-center justify-between w-full px-3 sm:px-4 py-2 sm:py-3">
        {/* Left section: Menu, Back Button, Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Menu Button */}
          {showMobileMenu && (
            <button 
              onClick={onMenuClick}
              className="p-2 rounded-md hover:bg-content/5 active:bg-content/10 transition-colors lg:hidden touch-manipulation"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-content/70" />
            </button>
          )}
          
          {/* Back Button */}
          {showBackButton && (
            <Link 
              href={backUrl}
              className="p-2 rounded-md hover:bg-content/5 active:bg-content/10 transition-colors flex items-center gap-1 touch-manipulation"
            >
              <ArrowLeft className="w-4 h-4 text-content/70" />
              <span className="text-sm text-content/70 hidden xs:inline">Back</span>
            </Link>
          )}
          
          {/* Page Title */}
          {title && (
            <div className="min-w-0 max-w-full">
              <h1 className="font-display text-base sm:text-lg font-semibold text-content truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs text-content/50 truncate hidden xs:block">{subtitle}</p>
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
                type="button"
                className="relative flex h-9 w-9 min-h-0 min-w-0 items-center justify-center rounded-full text-content/65 transition-colors hover:bg-content/[0.06] hover:text-content focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E3B2E]/30 dark:focus-visible:ring-[#B7E3C3]/40"
                aria-label="Notifications"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#0E3B2E] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-surface dark:bg-[#7FBF9C] dark:text-[#0B1712]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-[calc(100vw-1.5rem)] overflow-hidden p-0 sm:w-[380px]"
            >
              {/* Header row */}
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <h2 className="font-display text-sm font-bold tracking-tight text-content">
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#DFF0E4] px-2 py-0.5 text-[10px] font-bold text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    disabled={isLoading}
                    className="inline-flex h-7 min-h-0 min-w-0 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold text-content/55 transition-colors hover:bg-content/[0.06] hover:text-content disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCheck className="h-3.5 w-3.5" />
                    )}
                    Mark all read
                  </button>
                )}
              </div>

              <div className="h-px bg-content/[0.07]" />

              {/* Notification rows */}
              <div className="max-h-[min(60vh,360px)] overflow-y-auto p-2">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center px-4 py-10 text-center">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-content/[0.05] text-content/40">
                      <Bell className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-content">
                      You&apos;re all caught up
                    </p>
                    <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-content/45">
                      New contributions, payouts and membership updates will show
                      up here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.slice(0, 6).map((notification) => {
                      const { Icon, className: iconClassName } =
                        notificationVisual(notification.type)
                      return (
                        <DropdownMenuItem
                          key={notification.id}
                          asChild
                          className="p-0 focus:bg-transparent"
                        >
                          <Link
                            href={`/dashboard/notifications#${notification.id}`}
                            onClick={() =>
                              !notification.is_read &&
                              handleMarkAsRead(notification.id)
                            }
                            className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-content/[0.05] focus:bg-content/[0.05] focus:outline-none"
                          >
                            <span
                              className={cn(
                                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                iconClassName
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    'truncate text-sm',
                                    notification.is_read
                                      ? 'font-medium text-content/65'
                                      : 'font-semibold text-content'
                                  )}
                                >
                                  {notification.title}
                                </span>
                                {!notification.is_read && (
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0E3B2E] dark:bg-[#7FBF9C]" />
                                )}
                                <span className="ml-auto shrink-0 text-[10px] text-content/35">
                                  {formatDate(notification.created_at)}
                                </span>
                              </span>
                              <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-content/50">
                                {notification.message}
                              </span>
                            </span>
                          </Link>
                        </DropdownMenuItem>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="h-px bg-content/[0.07]" />

              <div className="p-2">
                <Link
                  href="/dashboard/notifications"
                  className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-[#0E3B2E] transition-colors hover:bg-content/[0.04] dark:text-[#7FBF9C]"
                >
                  View all notifications
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme toggle */}
          <ThemeToggle className="h-9 w-9" />

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer hover:bg-content/5 active:bg-content/10 rounded-full sm:rounded-lg px-1 sm:px-2 py-1 transition-colors touch-manipulation">
                <UserAvatar
                  name={actualUserName}
                  src={user?.profile_picture_url}
                  size="sm"
                  className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
                />
                <div className="hidden sm:flex items-center gap-1 min-w-0">
                  <span className="text-sm font-medium text-content truncate max-w-[100px]">
                    {firstName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-content/50 flex-shrink-0" />
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-1">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/account" className="cursor-pointer py-2.5">
                  <User className="mr-2 h-4 w-4" />
                  <span>Account</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={async () => {
                  await logout()
                  router.replace('/signin')
                }} 
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