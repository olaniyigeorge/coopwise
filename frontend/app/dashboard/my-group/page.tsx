"use client"

import React from 'react'
import DashboardLayout from '@/components/dashboard/layout'
import DiscoverGroupsTabView from '@/components/dashboard/discover-groups-tab-view'

export default function MyGroupPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <DiscoverGroupsTabView defaultTab="my-groups" />
      </div>
    </DashboardLayout>
  )
} 