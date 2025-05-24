"use client"

import React, { useState } from 'react'
import Sidebar from './sidebar'
import Header from './header'
import MobileBottomNav from './mobile-bottom-nav'
import { usePathname } from 'next/navigation'
import { Toaster } from 'sonner'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Get header configuration based on the current pathname
  const getHeaderConfig = () => {
    const path = pathname || '/dashboard'
    
    // Handle group details pages
    if (path.startsWith('/dashboard/my-group/') && path !== '/dashboard/my-group') {
      return {
        title: 'Mygroup/details',
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
      
      case '/dashboard/create-group':
        return {
          title: 'Create Group',
          subtitle: 'Set up a new savings group and invite members',
          showBackButton: true,
          backUrl: '/dashboard'
        }
      
      case '/dashboard/my-group':
        return {
          title: 'Saving Groups',
          subtitle: 'See your active groups or join a new one.',
          showBackButton: false
        }
      
      case '/dashboard/discover-groups':
        return {
          title: 'Saving Groups',
          subtitle: 'See your active groups or join a new one.',
          showBackButton: false
        }
      
      case '/dashboard/join-group':
        return {
          title: 'Join Group',
          subtitle: 'Enter a group code to join an existing savings group',
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
          title: 'All Contributions',
          subtitle: 'Track and manage all your contribution history',
          showBackButton: false
        }
      
      case '/dashboard/ai-insights':
        return {
          title: 'AI Insights',
          subtitle: 'Personalized recommendations for your savings',
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Main Content Area */}
      <div className="min-h-screen lg:ml-[208px]">
        <Header 
          {...headerConfig} 
          onMenuClick={() => setSidebarOpen(true)}
          showMobileMenu={true}
        />
        
        <main className="p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
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
      />
    </div>
  )
} 