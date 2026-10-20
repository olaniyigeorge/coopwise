"use client"

import React, { Suspense } from 'react'
import DashboardLayout from '@/components/dashboard/layout'
import JoinGroupContent from '@/components/dashboard/join-group-content'

export default function JoinGroupPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-5 pb-6">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-content/40">
            Invite only
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-content sm:text-4xl">
            Join a cooperative
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-content/50">
            Enter the short code a member shared with you, review the group, and
            confirm your place.
          </p>
        </header>
        <Suspense fallback={<div className="text-sm text-content/40">Loading…</div>}>
          <JoinGroupContent />
        </Suspense>
      </div>
    </DashboardLayout>
  )
}
