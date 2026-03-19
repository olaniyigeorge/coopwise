"use client"

import React, { useState } from 'react'
import Sidebar from './sidebar'
import Header from './header'
import MobileBottomNav from './mobile-bottom-nav'
import { usePathname } from 'next/navigation'
import { Toaster } from 'sonner'
import useAuthStore from '@/lib/stores/auth-store'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
  fullWidth?: boolean
  noPadding?: boolean
  className?: string
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
  
  // Get header configuration based on the current pathname
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
        return {
          // Empty title since it's already in the page content
          title: '',
          showBackButton: true,
          backUrl: '/dashboard'
        }
      
      case '/dashboard/my-group':
        return {
          title: '',
          subtitle: '',
          showBackButton: false
        }
      
      case '/dashboard/discover-groups':
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
      
      case '/dashboard/profile':
        return {
          title: 'My Profile',
          subtitle: 'Manage your details and account settings',
          showBackButton: false
        }
      
      case '/dashboard/contributions':
        return {
          title: '',
          subtitle: '',
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
    <div className="min-h-screen bg-gray-50" onClick={handleCloseSidebar}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Main Content Area */}
      <div className={cn(
        "min-h-screen transition-all duration-200 ease-in-out",
        "lg:ml-[208px]"
      )}>
        <Header 
          {...headerConfig} 
          onMenuClick={() => setSidebarOpen(true)}
          showMobileMenu={true}
          userName={user?.full_name || "User"}
        />
        
        <main className={cn(
          !noPadding && "p-3 sm:p-4 lg:p-6",
          "pb-20 lg:pb-6", // Bottom padding to account for mobile navigation
          fullWidth ? "w-full" : "mx-auto",
          className
        )}>
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Toast Notifications */}
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