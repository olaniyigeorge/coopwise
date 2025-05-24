"use client"

import React from 'react'
import DashboardLayout from '@/components/dashboard/layout'
import CreateGroupForm from '@/components/dashboard/create-group-form'

export default function CreateGroupPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <CreateGroupForm />
      </div>
    </DashboardLayout>
  )
} 