import type { ReactNode } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/layout'

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <nav className="mb-4 flex items-center gap-2 overflow-x-auto rounded-2xl border border-content/10 bg-surface p-1.5" aria-label="Admin navigation">
          <Link
            href="/dashboard/admin"
            className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-content/55 transition-colors hover:bg-content/[0.05] hover:text-content"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/admin/kyc"
            className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold text-content/55 transition-colors hover:bg-content/[0.05] hover:text-content"
          >
            KYC review
          </Link>
        </nav>
        {children}
      </div>
    </DashboardLayout>
  )
}
