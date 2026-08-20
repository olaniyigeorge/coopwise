"use client"

import React, { useState } from 'react'
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

    if (path.startsWith('/dashboard/circle/')) {
      return {
        title: '',
        subtitle: '',
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
      case '/dashboard/create-group':
      case '/dashboard/create-circle':
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

  const handleCloseSidebar = () => {
    if (sidebarOpen) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-paper" onClick={handleCloseSidebar}>
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
      <div className={cn(
        "min-h-screen transition-all duration-300 ease-out",
        "lg:ml-[208px]"
      )}>
        <Header 
          {...headerConfig} 
          onMenuClick={() => setSidebarOpen(true)}
          showMobileMenu={true}
          userName={user?.full_name || "User"}
        />
        
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