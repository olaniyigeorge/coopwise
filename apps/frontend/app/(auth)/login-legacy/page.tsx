import React from 'react'

/**
 * Legacy login page — preserved but disconnected from the main flow.
 * Main login is now at /auth/login (Crossmint-based).
 * Accessible at /auth/login-legacy for reference / fallback.
 */
import LoginForm from '@/components/auth/login-form'
import Link from 'next/link'

export default function LegacyLoginPage() {
  return (
    <div className="min-h-screen auth_bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 text-center">
          You are using the legacy login. <Link href="/auth/login" className="underline font-medium">Switch to the new experience →</Link>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
