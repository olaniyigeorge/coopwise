import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B8892B]">Admin console</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-content">Operations overview</h1>
        <p className="mt-1.5 text-sm text-content/50">Manage compliance workflows and member verification.</p>
      </div>
      <Link
        href="/dashboard/admin/kyc"
        className="group flex max-w-xl items-center justify-between rounded-[24px] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)] transition-shadow hover:shadow-md sm:p-6"
      >
        <span className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]"><ShieldCheck className="h-5 w-5" /></span>
          <span>
            <span className="block font-display text-lg font-bold text-content">KYC review</span>
            <span className="mt-1 block text-sm text-content/50">Review and approve member submissions.</span>
          </span>
        </span>
        <ArrowRight className="h-5 w-5 text-content/35 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  )
}
