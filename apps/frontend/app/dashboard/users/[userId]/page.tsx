"use client"

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BadgeCheck, CalendarDays, HandCoins, Users } from 'lucide-react'
import DashboardLayout from '@/components/dashboard/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import UserService, { PublicProfile } from '@/services/user-service'
import { UserAvatar } from '@/components/ui/user-avatar'

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params?.userId as string

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [isSelf, setIsSelf] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    async function load() {
      try {
        const data = await UserService.getPublicProfile(userId)
        if (cancelled) return
        setProfile(data)
        // Best effort only — used to offer "Edit profile" on your own page.
        UserService.getProfile()
          .then((me) => !cancelled && setIsSelf(me.id === data.id))
          .catch(() => {})
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const back = (
    <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2 mb-4">
      <ArrowLeft className="w-4 h-4" />
      Back
    </Button>
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-56 bg-gray-200 rounded-2xl" />
        </div>
      </DashboardLayout>
    )
  }

  if (notFound || !profile) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto">
          {back}
          <Card>
            <CardContent className="py-12 text-center">
              <h1 className="text-lg font-semibold text-neutral-900">Member not found</h1>
              <p className="text-sm text-neutral-500 mt-1">This profile doesn&apos;t exist or isn&apos;t available.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto">
        {back}
        <Card className="rounded-2xl border-neutral-100 shadow-sm">
          <CardContent className="pt-8 pb-6 space-y-6">
            <div className="flex flex-col items-center text-center gap-3">
              <UserAvatar name={profile.full_name} src={profile.profile_picture_url} size="xl" />
              <div>
                <h1 className="text-xl font-semibold text-neutral-900 flex items-center justify-center gap-1.5">
                  {profile.full_name}
                  {profile.is_kyc_verified && (
                    <BadgeCheck className="w-5 h-5 text-emerald-600" aria-label="Identity verified" />
                  )}
                </h1>
                <p className="text-sm text-neutral-500">@{profile.username}</p>
              </div>
              {isSelf && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/account">Edit profile</Link>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-3">
                <Users className="w-4 h-4 mx-auto text-neutral-400 mb-1" />
                <p className="text-lg font-semibold text-neutral-900">{profile.active_groups_count}</p>
                <p className="text-xs text-neutral-500">Active groups</p>
              </div>
              <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-3">
                <HandCoins className="w-4 h-4 mx-auto text-neutral-400 mb-1" />
                <p className="text-lg font-semibold text-neutral-900">{profile.completed_contributions_count}</p>
                <p className="text-xs text-neutral-500">Contributions made</p>
              </div>
              <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-3">
                <CalendarDays className="w-4 h-4 mx-auto text-neutral-400 mb-1" />
                <p className="text-lg font-semibold text-neutral-900">
                  {new Date(profile.member_since).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}
                </p>
                <p className="text-xs text-neutral-500">Member since</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
