import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react'
import type { KYCStepStatus } from '@/types/kyc'

const CONFIG: Record<KYCStepStatus, { label: string; className: string; icon: typeof Circle }> = {
  pending: {
    label: 'Not started',
    className: 'bg-brand-ink/5 text-brand-ink/50',
    icon: Circle,
  },
  submitted: {
    label: 'Submitted',
    className: 'bg-brand-gold/10 text-brand-gold',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    className: 'bg-primary/10 text-primary',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-600',
    icon: XCircle,
  },
}

export default function StageStatusBadge({ status }: { status: KYCStepStatus }) {
  const { label, className, icon: Icon } = CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  )
}