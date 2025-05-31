"use client"

import React from 'react'
import DashboardLayout from '@/components/dashboard/layout'
import DiscoverGroupsTabView from '@/components/dashboard/discover-groups-tab-view'

export default function DiscoverGroupsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <DiscoverGroupsTabView />
      </div>
    </DashboardLayout>
  )
} 