"use client"

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Plus, Users } from 'lucide-react'

export default function EmptyGroupState() {
  return (
    <div className="rounded-[24px] border border-dashed border-content/12 px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]">
        <Users className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-content">
        No cooperatives yet
      </h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-content/45">
        Join a cooperative with an invite code, or start your own and invite the
        people you save with.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        <Link
          href="/dashboard/join-group"
          className="inline-flex items-center gap-2 rounded-full bg-[#0E3B2E] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0A2E24] dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:hover:bg-[#93CBAE]"
        >
          Join a cooperative
        </Link>
        <Link
          href="/dashboard/create-cooperative"
          className="inline-flex items-center gap-2 rounded-full border border-content/15 px-5 py-2.5 text-sm font-semibold text-content transition-colors hover:border-content/30 hover:bg-content/[0.03]"
        >
          <Plus className="h-4 w-4" />
          Create one
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
