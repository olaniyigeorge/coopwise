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
    <div className="mb-5 rounded-2xl border border-[#EAD9AC] bg-[#FBF3DE] p-4 dark:border-[#5A4A22] dark:bg-[#2E2818]">
      <div>
        <h4 className="font-display text-sm font-bold tracking-tight text-content">
          Join requests{' '}
          <span className="text-[#8A6516] dark:text-[#E8BC63]">({apps.length})</span>
        </h4>
        <p className="mt-0.5 text-xs text-content/50">{HOW[apps[0].mode]}</p>
      </div>

      <div className="mt-3 space-y-2">
        {apps.map((app) => (
          <div
            key={app.membership_id}
            className="flex items-center gap-3 rounded-xl border border-content/[0.06] bg-surface p-3 dark:bg-white/[0.04]"
          >
            <UserAvatar name={app.applicant.full_name} src={app.applicant.profile_picture_url} size="md" />
            <div className="min-w-0 flex-1">
              <Link
                href={`/dashboard/users/${app.applicant.id}`}
                className="block truncate text-sm font-semibold text-content transition-colors hover:text-[#1F7A54] hover:underline dark:hover:text-[#7FBF9C]"
              >
                {app.applicant.full_name}
              </Link>
              <p className="text-xs text-content/50">{progress(app)}</p>
            </div>
            {app.can_decide && (
              <div className="flex shrink-0 items-center gap-1.5">
                {busy === app.membership_id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-content/40" />
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decide(app, false)}
                      aria-label={`Decline ${app.applicant.full_name}`}
                      className={
                        app.my_vote === false
                          ? 'border-[#B4451F] bg-[#B4451F] text-white hover:bg-[#9A3A1A] hover:text-white'
                          : 'border-[#E4B4B4] bg-surface text-[#A24A4A] hover:bg-[#FDEDED] hover:text-[#8F2D2D] dark:border-[#5A2A2A] dark:bg-transparent dark:text-[#F0A9A9] dark:hover:bg-[#2E1717]'
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
                          ? 'bg-[#0E3B2E] text-white ring-2 ring-[#7FBF9C] hover:bg-[#0A2E24] hover:text-white dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:hover:bg-[#93CBAE]'
                          : 'bg-[#1F7A54] text-white hover:bg-[#196546] hover:text-white'
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
