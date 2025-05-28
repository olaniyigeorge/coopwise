import { ContributionStatus, ContributionType, PaymentMethod } from './mock-data'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function getStatusColor(status: ContributionStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    case 'cancelled':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getStatusLabel(status: ContributionStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'completed':
      return 'Completed'
    case 'failed':
      return 'Failed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return 'Unknown'
  }
}

export function getTypeLabel(type: ContributionType): string {
  switch (type) {
    case 'savings':
      return 'Savings'
    case 'loan':
      return 'Loan'
    case 'investment':
      return 'Investment'
    case 'donation':
      return 'Donation'
    default:
      return 'Unknown'
  }
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'card':
      return 'Credit/Debit Card'
    case 'bank_transfer':
      return 'Bank Transfer'
    case 'mobile_money':
      return 'Mobile Money'
    case 'cash':
      return 'Cash'
    default:
      return 'Unknown'
  }
}
