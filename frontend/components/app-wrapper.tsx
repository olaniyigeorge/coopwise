"use client"

import React from 'react'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from '@/components/ui/toaster'

interface AppWrapperProps {
  children: React.ReactNode
}

export function AppWrapper({ children }: AppWrapperProps) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  )
}