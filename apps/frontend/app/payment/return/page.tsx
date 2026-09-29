"use client"

import React, { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Landing point for the browser after Paystack (via the backend callback).
 *
 * Why this page exists: our auth cookies are SameSite=Strict, and browsers
 * withhold those on any navigation chain that *starts* on another site
 * (Paystack -> backend -> app). Landing straight on /dashboard/* therefore
 * looks logged-out and bounces to /signin even though the user is signed in.
 * This page is public (not behind the dashboard gate) and immediately does a
 * client-side navigation, which is same-site, so the cookies are sent.
 *
 * It never redirects to a caller-supplied URL: the destination is rebuilt from
 * a fixed kind, a validated UUID and a whitelisted status.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function destination(params: URLSearchParams): string {
  const status = params.get('status') === 'success' ? 'success' : 'failed'
  const ref = encodeURIComponent(params.get('ref') ?? '')
  const kind = params.get('kind')
  const group = params.get('group') ?? ''

  if (kind === 'contribution' && UUID_RE.test(group)) {
    return `/dashboard/cooperative/${group}?payment=${status}&ref=${ref}`
  }
  if (kind === 'wallet') {
    return `/dashboard/wallet/fund?status=${status}&ref=${ref}`
  }
  return '/dashboard'
}

function ReturnContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    window.location.replace(destination(searchParams))
  }, [searchParams])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-white">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      <p className="text-sm text-neutral-600">Confirming your payment…</p>
    </main>
  )
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={null}>
      <ReturnContent />
    </Suspense>
  )
}
