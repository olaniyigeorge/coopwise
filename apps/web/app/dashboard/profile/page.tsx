"use client"

import React, { Suspense } from 'react'
import DashboardLayout from '@/components/dashboard/layout'
import ProfileContent from './profile-content'

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      }>
        <ProfileContent />
      </Suspense>
    </DashboardLayout>
  )
} 