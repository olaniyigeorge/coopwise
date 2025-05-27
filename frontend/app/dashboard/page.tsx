"use client"

import React from 'react'
import DashboardLayout from '@/components/dashboard/layout'
import DashboardOverview from '@/components/dashboard/overview'

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardOverview />
    </DashboardLayout>
  )
} 