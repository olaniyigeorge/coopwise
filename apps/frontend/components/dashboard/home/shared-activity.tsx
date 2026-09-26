'use client'

import React from 'react'
import Image from 'next/image'
import { ActivityDetail } from '@/services/dashboard-service'
import { getActivityDescription } from '@/lib/utils'

interface SharedActivityProps {
  activities: ActivityDetail[]
  currentUserId?: string
}

export default function SharedActivity({ activities, currentUserId }: SharedActivityProps) {
  return (
    <div className="bg-white rounded-2xl border border-brand-ink/10 p-5 shadow-sm space-y-4">
      <h2 className="text-sm font-semibold text-brand-ink uppercase tracking-wider">
        Cross-Cooperative Ledger
      </h2>

      {activities.length > 0 ? (
        <div className="divide-y divide-brand-ink/5">
          {activities.map((activity) => {
            const isOwnActivity = activity.user_id === currentUserId
            return (
              <div key={activity.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="w-8 h-8 rounded-full bg-brand-paper flex items-center justify-center shrink-0">
                  <Image
                    src="/assets/icons/fluent_people-community-48-regular (1).svg"
                    alt="Activity"
                    width={16}
                    height={16}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-brand-ink/80">{getActivityDescription(activity, isOwnActivity)}</p>
                  <p className="text-xs text-brand-ink/40 mt-0.5">
                    {new Date(activity.created_at).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-xs text-brand-ink/50">No cross-cooperative ledger events recorded yet.</p>
        </div>
      )}
    </div>
  )
}