"use client"

import React from 'react'
import { AuthProvider } from '@/lib/auth-context'
import { NotificationProvider } from '@/lib/notification-context'
import { Toaster } from '@/components/ui/toaster'

interface AppWrapperProps {
  children: React.ReactNode
}

export function AppWrapper({ children }: AppWrapperProps) {
  return (
    <AuthProvider>
      <NotificationProvider>
        {children}
        <Toaster />
      </NotificationProvider>
    </AuthProvider>
  )
}