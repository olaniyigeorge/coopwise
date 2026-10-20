"use client"

import React, { Suspense } from 'react'
import DashboardLayout from '@/components/dashboard/layout'
import ProfileContent from './profile-content'

export default function AccountPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="animate-pulse">
            <div className="mb-4 h-8 w-1/3 rounded-lg bg-content/[0.06]"></div>
            <div className="space-y-4">
              <div className="h-4 w-full rounded bg-content/[0.05]"></div>
              <div className="h-4 w-3/4 rounded bg-content/[0.05]"></div>
              <div className="h-4 w-1/2 rounded bg-content/[0.05]"></div>
            </div>
          </div>
        </div>
      }>
        <ProfileContent />
      </Suspense>
    </DashboardLayout>
  )
}
