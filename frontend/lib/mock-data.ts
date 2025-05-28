export interface ContributionGroup {
  id: string
  name: string
  description?: string
  contributionAmount: number
  frequency: 'weekly' | 'monthly' | 'yearly'
}

export type ContributionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

export type ContributionType = 'savings' | 'loan' | 'investment' | 'donation'

export type PaymentMethod = 'card' | 'bank_transfer' | 'mobile_money' | 'cash'

export interface Contribution {
  id: string
  amount: number
  date: string // ISO date string
  dueDate?: string
  description?: string
  status: ContributionStatus
  type: ContributionType
  paymentMethod: PaymentMethod
  reference?: string
  group?: ContributionGroup
}

export const mockContributions: Contribution[] = [
  {
    id: 'c1',
    amount: 5000,
    date: '2025-05-15T10:30:00Z',
    dueDate: '2025-05-20T23:59:59Z',
    description: 'Monthly group savings contribution',
    status: 'completed',
    type: 'savings',
    paymentMethod: 'mobile_money',
    reference: 'TXN123456789',
    group: {
      id: 'g1',
      name: 'Alpha Savings Group',
      description: 'A trusted group saving for future investments',
      contributionAmount: 5000,
      frequency: 'monthly'
    }
  },
  {
    id: 'c2',
    amount: 10000,
    date: '2025-05-18T14:45:00Z',
    status: 'failed',
    type: 'loan',
    paymentMethod: 'card',
    reference: 'TXN987654321'
  },
  {
    id: 'c3',
    amount: 2000,
    date: '2025-05-10T08:00:00Z',
    status: 'pending',
    type: 'investment',
    paymentMethod: 'bank_transfer',
  }
]