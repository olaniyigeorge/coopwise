"use client"

import React from 'react'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/layout'
import GroupDetailsView from '@/components/dashboard/group-details-view'

export default function GroupDetailsPage() {
  const params = useParams()
  const groupId = params.id as string

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <GroupDetailsView groupId={groupId} />
      </div>
    </DashboardLayout>
  )
} 