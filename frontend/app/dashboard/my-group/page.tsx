"use client"

import React from 'react'
import DashboardLayout from '@/components/dashboard/layout'
import GroupsTabView from '@/components/dashboard/groups-tab-view'

export default function MyGroupPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <GroupsTabView defaultTab="my-groups" />
      </div>
    </DashboardLayout>
  )
} 