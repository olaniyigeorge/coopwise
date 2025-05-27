"use client"

import React from 'react'
import DashboardLayout from '@/components/dashboard/layout'
import JoinGroupForm from '@/components/dashboard/join-group-form'

export default function JoinGroupPage() {
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Join a Group</h1>
        <p className="text-gray-600 mb-6">Enter an invite code to join an existing saving group</p>
        <JoinGroupForm />
      </div>
    </DashboardLayout>
  )
} 