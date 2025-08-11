import { 
  Contribution, 
  ContributionStatus, 
  ContributionType, 
  PaymentMethod,
  ContributionSummary
} from './types'

export function formatCurrency(amount: number, currency: string = '₦'): string {
  return `${currency}${amount.toLocaleString()}`
}

export function formatDate(date: string): string {
  const d = new Date(date)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - d.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return `Today ${d.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })}`
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
}

export function getStatusColor(status: ContributionStatus): string {
  switch (status) {
    case ContributionStatus.COMPLETED:
      return 'bg-green-100 text-green-800'
    case ContributionStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800'
    case ContributionStatus.PROCESSING:
      return 'bg-blue-100 text-blue-800'
    case ContributionStatus.FAILED:
      return 'bg-red-100 text-red-800'
    case ContributionStatus.OVERDUE:
      return 'bg-red-100 text-red-800'
    case ContributionStatus.PARTIAL:
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getStatusLabel(status: ContributionStatus): string {
  switch (status) {
    case ContributionStatus.COMPLETED:
      return 'Completed'
    case ContributionStatus.PENDING:
      return 'Pending'
    case ContributionStatus.PROCESSING:
      return 'Processing'
    case ContributionStatus.FAILED:
      return 'Failed'
    case ContributionStatus.OVERDUE:
      return 'Overdue'
    case ContributionStatus.PARTIAL:
      return 'Partial'
    default:
      return 'Unknown'
  }
}

export function getTypeLabel(type: ContributionType): string {
  switch (type) {
    case ContributionType.REGULAR:
      return 'Regular Contribution'
    case ContributionType.LATE_PAYMENT:
      return 'Late Payment'
    case ContributionType.ADVANCE_PAYMENT:
      return 'Advance Payment'
    case ContributionType.PENALTY:
      return 'Penalty'
    case ContributionType.BONUS:
      return 'Bonus'
    default:
      return 'Contribution'
  }
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case PaymentMethod.BANK_TRANSFER:
      return 'Bank Transfer'
    case PaymentMethod.CARD:
      return 'Card Payment'
    case PaymentMethod.USSD:
      return 'USSD'
    case PaymentMethod.MOBILE_MONEY:
      return 'Mobile Money'
    case PaymentMethod.CASH:
      return 'Cash'
    default:
      return 'Unknown'
  }
}

export function calculateContributionSummary(contributions: Contribution[]): ContributionSummary {
  const summary: ContributionSummary = {
    totalContributions: contributions.length,
    totalAmount: 0,
    pendingContributions: 0,
    pendingAmount: 0,
    completedContributions: 0,
    completedAmount: 0,
    overdueContributions: 0,
    overdueAmount: 0
  }

  contributions.forEach(contribution => {
    summary.totalAmount += contribution.amount

    switch (contribution.status) {
      case ContributionStatus.PENDING:
      case ContributionStatus.PROCESSING:
        summary.pendingContributions++
        summary.pendingAmount += contribution.amount
        break
      case ContributionStatus.COMPLETED:
        summary.completedContributions++
        summary.completedAmount += contribution.amount
        break
      case ContributionStatus.OVERDUE:
        summary.overdueContributions++
        summary.overdueAmount += contribution.amount
        break
    }
  })

  return summary
}

export function isContributionOverdue(contribution: Contribution): boolean {
  if (!contribution.dueDate) return false
  return new Date(contribution.dueDate) < new Date() && 
         contribution.status !== ContributionStatus.COMPLETED
}

export function sortContributionsByDate(contributions: Contribution[], order: 'asc' | 'desc' = 'desc'): Contribution[] {
  return [...contributions].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return order === 'desc' ? dateB - dateA : dateA - dateB
  })
}

export function filterContributions(
  contributions: Contribution[], 
  filters: {
    status?: ContributionStatus[]
    type?: ContributionType[]
    groupId?: string
    dateFrom?: string
    dateTo?: string
  }
): Contribution[] {
  return contributions.filter(contribution => {
    if (filters.status && !filters.status.includes(contribution.status)) {
      return false
    }
    
    if (filters.type && !filters.type.includes(contribution.type)) {
      return false
    }
    
    if (filters.groupId && contribution.groupId !== filters.groupId) {
      return false
    }
    
    if (filters.dateFrom && new Date(contribution.date) < new Date(filters.dateFrom)) {
      return false
    }
    
    if (filters.dateTo && new Date(contribution.date) > new Date(filters.dateTo)) {
      return false
    }
    
    return true
  })
} 