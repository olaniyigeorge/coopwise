"use client"

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/user-avatar'
import MembershipService, { Application } from '@/services/membership-service'
import { getApiErrorDetail } from '@/lib/api-error'

const HOW: Record<Application['mode'], string> = {
  automatic: 'Automatic',
  admin_approval: 'An admin decides',
  member_vote: 'Members vote',
}

function progress(app: Application): string {
  if (app.mode === 'member_vote') {
    const cast = app.approvals + app.rejections
    return `${app.approvals} approve · ${app.rejections} decline · ${cast} of ${app.eligible_voters} voted (needs ${app.quorum_pct}% to vote)`
  }
  return app.can_decide ? 'Waiting for your decision' : 'Waiting for an admin to decide'
}

/**
 * People who asked to join and are waiting on this cooperative's admission
 * rule. Renders nothing when there are none. The backend says who may act
 * (`can_decide`), so this doesn't need to know the current user.
 */
export default function ApplicationsPanel({
  groupId,
  onAdmitted,
}: {
  groupId: string
  onAdmitted?: () => void
}) {
  const [apps, setApps] = useState<Application[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setApps(await MembershipService.getApplications(groupId))
    } catch {
      setApps([]) // not a member / no access: nothing to show
    }
  }, [groupId])

  useEffect(() => {
    load()
  }, [load])

  const decide = async (app: Application, approve: boolean) => {
    setBusy(app.membership_id)
    try {
      const result = await MembershipService.decide(app.membership_id, approve)
      const name = app.applicant.full_name
      if (result.status === 'active') {
        toast.success(`${name} is now a member.`)
        onAdmitted?.()
      } else if (result.status === 'rejected') {
        toast(`${name}'s request was declined.`)
      } else {
        toast.success(approve ? 'Your approval is recorded.' : 'Your decline is recorded.')
      }
      await load()
    } catch (err: any) {
      const detail = getApiErrorDetail(err)
      toast.error((typeof detail === 'string' ? detail : detail?.message) || err?.message || 'Could not record your decision.')
    } finally {
      setBusy(null)
    }
  }

  if (apps.length === 0) return null

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
      <div>
        <h4 className="text-sm font-semibold text-neutral-900">
          Join requests <span className="text-amber-700">({apps.length})</span>
        </h4>
        <p className="text-xs text-neutral-500">{HOW[apps[0].mode]}</p>
      </div>

      <div className="space-y-2">
        {apps.map((app) => (
          <div key={app.membership_id} className="flex items-center gap-3 rounded-lg bg-white border border-neutral-100 p-3">
            <UserAvatar name={app.applicant.full_name} src={app.applicant.profile_picture_url} size="md" />
            <div className="min-w-0 flex-1">
              <Link
                href={`/dashboard/users/${app.applicant.id}`}
                className="block truncate text-sm font-medium text-neutral-900 hover:text-emerald-700 hover:underline"
              >
                {app.applicant.full_name}
              </Link>
              <p className="text-xs text-neutral-500">{progress(app)}</p>
            </div>
            {app.can_decide && (
              <div className="flex items-center gap-1.5 shrink-0">
                {busy === app.membership_id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decide(app, false)}
                      aria-label={`Decline ${app.applicant.full_name}`}
                      className={
                        app.my_vote === false
                          ? 'border-red-600 bg-red-600 text-white hover:bg-red-700 hover:text-white'
                          : 'border-red-300 bg-white text-red-700 hover:bg-red-50 hover:text-red-800'
                      }
                    >
                      <X className="mr-1 h-3.5 w-3.5" />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => decide(app, true)}
                      aria-label={`Approve ${app.applicant.full_name}`}
                      className={
                        app.my_vote === true
                          ? 'bg-emerald-800 text-white hover:bg-emerald-900 hover:text-white ring-2 ring-emerald-300'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white'
                      }
                    >
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Approve
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
