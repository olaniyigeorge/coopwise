import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react'
import type { KYCStepStatus } from '@/types/kyc'

const CONFIG: Record<
  KYCStepStatus,
  { label: string; className: string; icon: typeof Circle }
> = {
  pending: {
    label: 'Not started',
    className: 'bg-content/[0.05] text-content/45 ring-content/10',
    icon: Circle,
  },
  submitted: {
    label: 'In review',
    className: 'bg-[#B8892B]/12 text-[#9A7124] ring-[#B8892B]/25 dark:text-[#E8BC63]',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    className:
      'bg-[#DFF0E4] text-[#17603F] ring-[#17603F]/15 dark:bg-[#1C3A2C] dark:text-[#B7E3C3] dark:ring-[#7FBF9C]/25',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    className:
      'bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400',
    icon: XCircle,
  },
}

export default function StageStatusBadge({ status }: { status: KYCStepStatus }) {
  const { label, className, icon: Icon } = CONFIG[status]
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${className}`}
    >
      <Icon className="h-3 w-3" strokeWidth={2.25} />
      {label}
    </span>
  )
}
