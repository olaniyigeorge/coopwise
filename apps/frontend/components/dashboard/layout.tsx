"use client"

import React, { useEffect, useRef, useState } from 'react'
import Sidebar from './sidebar'
import Header from './header'
import MobileBottomNav from './mobile-bottom-nav'
import { usePathname } from 'next/navigation'
import { Toaster } from 'sonner'
import useAuthStore from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, Variants} from 'framer-motion'

interface DashboardLayoutProps {
  children: React.ReactNode
  fullWidth?: boolean
  noPadding?: boolean
  className?: string
}

// Level 2: Component / Page Entrance Motion Variant
const pageFadeUp: Variants = {
  initial: {
    opacity: 0,
    y: 6,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.16, 1, 0.3, 1], // Custom smooth ease-out curve
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
}

// Mobile Overlay Backdrop Motion Variant
const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export default function DashboardLayout({ 
  children, 
  fullWidth = false,
  noPadding = false,
  className 
}: DashboardLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuthStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // The app shell scrolls inside the rounded card, not the window, so the
  // browser can't restore this scroll position for us on navigation.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [pathname])
  
  // Get header configuration based on current route
  const getHeaderConfig = () => {
    const path = pathname || '/dashboard'
    
    // Handle group details pages
    if (path.startsWith('/dashboard/my-group/') && path !== '/dashboard/my-group') {
      return {
        title: 'Cooperative Groups',
        showBackButton: true,
        backUrl: '/dashboard/my-group'
      }
    }

    // The cooperative detail page draws its own hero and back control, so
    // the shared header only carries the account/notification chrome.
    if (path.startsWith('/dashboard/cooperative/')) {
      return {
        title: '',
        showBackButton: false
      }
    }

    switch (path) {
      case '/dashboard':
        return {
          title: 'Dashboard',
          showBackButton: false
        }
      case '/dashboard/ai-chat':
        return {
          title: '',
          subtitle: '',
          showBackButton: true,
          backUrl: '/dashboard'
        }
      case '/dashboard/create-cooperative':
        return {
          title: '',
          showBackButton: true,
          backUrl: '/dashboard'
        }

      case '/dashboard/leaderboard':
      case '/dashboard/payouts':
        return {
          title: '',
          subtitle: '',
          showBackButton: true,
          backUrl: '/dashboard'
        }
      
      case '/dashboard/my-group':
      case '/dashboard/discover-groups':
      case '/dashboard/contributions':
      case '/dashboard/notifications':
        return {
          title: '',
          subtitle: '',
          showBackButton: false
        }
      
      case '/dashboard/join-group':
        return {
          title: '',
          subtitle: '',
          showBackButton: true,
          backUrl: '/dashboard'
        }
      
      case '/dashboard/messages':
        return {
          title: 'Messages',
          showBackButton: false
        }
      
      case '/dashboard/support':
        return {
          title: 'Help & Support',
          showBackButton: false
        }

      case '/dashboard/account':
      case '/dashboard/account/profile':
        return {
          title: 'My Profile',
          subtitle: 'Manage your details and account settings',
          showBackButton: false
        }

      case '/dashboard/account/notifications':
        return {
          title: 'Notification Preferences',
          subtitle: 'Manage your details and account settings',
          showBackButton: false
        }

      case '/dashboard/account/settings':
        return {
          title: 'Settings',
          subtitle: 'Manage your details and account settings',
          showBackButton: false
        }
      
      default:
        return {
          title: 'Dashboard',
          showBackButton: false
        }
    }
  }

  const headerConfig = getHeaderConfig()
  const isLandingPage = pathname === '/dashboard'

  const handleCloseSidebar = () => {
    if (sidebarOpen) {
      setSidebarOpen(false)
    }
  }

  return (
    <div
      className="h-[100dvh] overflow-hidden bg-[#1A1A1A] transition-colors dark:bg-[#070B09] lg:p-3"
      onClick={handleCloseSidebar}
    >
      {/* Mobile Backdrop Fade */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Container */}
      <div
        ref={scrollRef}
        className={cn(
          "dashboard-shell h-full overflow-y-auto overflow-x-hidden overscroll-contain bg-canvas text-content transition-all duration-300 ease-out",
          "lg:ml-[240px] lg:rounded-[28px]"
        )}
      >
        {/* The landing page draws its own hero header; elsewhere the shared
            header is used. On mobile the landing keeps the shared header for
            menu/notifications, hiding it only where the desktop sidebar and
            inline actions take over. */}
        {isLandingPage ? (
          <div className="lg:hidden">
            <Header
              {...headerConfig}
              onMenuClick={() => setSidebarOpen(true)}
              showMobileMenu={true}
              userName={user?.full_name || "User"}
            />
          </div>
        ) : (
          <Header
            {...headerConfig}
            onMenuClick={() => setSidebarOpen(true)}
            showMobileMenu={true}
            userName={user?.full_name || "User"}
          />
        )}

        {/* Animated Page Route Content */}
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            variants={pageFadeUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              !noPadding && "p-3 sm:p-4 lg:p-6",
              "pb-20 lg:pb-6", // Spacer for fixed mobile bottom nav
              fullWidth ? "w-full" : "mx-auto",
              className
            )}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Global Toast Notifications */}
      <Toaster
        position="top-right"
        expand={false}
        richColors
        closeButton
        toastOptions={{
          style: {
            fontSize: '14px',
          },
          className: 'toast-responsive'
        }}
      />
    </div>
  )
}