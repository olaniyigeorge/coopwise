import { 
  Contribution, 
  ContributionStatus, 
  ContributionType, 
  PaymentMethod,
  User,
  Group 
} from './types'
import { ActivityDetail } from './dashboard-service'

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: '/avatars/john.jpg'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatar: '/avatars/jane.jpg'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    avatar: '/avatars/mike.jpg'
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    avatar: '/avatars/sarah.jpg'
  }
]

export const mockGroups: Group[] = [
  {
    id: 'group-1',
    name: 'Family Savings',
    description: 'Monthly family contribution for emergency fund',
    totalMembers: 5,
    contributionAmount: 50000,
    frequency: 'monthly',
    startDate: '2024-01-01',
    status: 'active'
  },
  {
    id: 'group-2',
    name: 'Friends Investment Club',
    description: 'Weekly investment contributions',
    totalMembers: 8,
    contributionAmount: 25000,
    frequency: 'weekly',
    startDate: '2024-03-01',
    status: 'active'
  },
  {
    id: 'group-3',
    name: 'Office Team Savings',
    description: 'Monthly office team savings plan',
    totalMembers: 12,
    contributionAmount: 30000,
    frequency: 'monthly',
    startDate: '2024-02-01',
    endDate: '2024-12-31',
    status: 'active'
  },
  {
    id: 'group-4',
    name: 'Vacation Fund',
    description: 'Saving for group vacation',
    totalMembers: 6,
    contributionAmount: 75000,
    frequency: 'monthly',
    startDate: '2023-06-01',
    endDate: '2024-05-31',
    status: 'completed'
  }
]

export const mockContributions: Contribution[] = [
  {
    id: 'contrib-1',
    groupId: 'group-1',
    userId: '1',
    amount: 50000,
    date: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    type: ContributionType.REGULAR,
    status: ContributionStatus.COMPLETED,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    reference: 'TXN-2024-001',
    description: 'Monthly contribution for December 2024',
    user: mockUsers[0],
    group: mockGroups[0]
  },
  {
    id: 'contrib-2',
    groupId: 'group-2',
    userId: '1',
    amount: 25000,
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    type: ContributionType.REGULAR,
    status: ContributionStatus.PROCESSING,
    paymentMethod: PaymentMethod.CARD,
    reference: 'TXN-2024-002',
    description: 'Weekly contribution for week 50',
    user: mockUsers[0],
    group: mockGroups[1]
  },
  {
    id: 'contrib-3',
    groupId: 'group-1',
    userId: '1',
    amount: 50000,
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString(),
    type: ContributionType.REGULAR,
    status: ContributionStatus.COMPLETED,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    reference: 'TXN-2024-003',
    description: 'Monthly contribution for November 2024',
    user: mockUsers[0],
    group: mockGroups[0]
  },
  {
    id: 'contrib-4',
    groupId: 'group-3',
    userId: '1',
    amount: 30000,
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    type: ContributionType.LATE_PAYMENT,
    status: ContributionStatus.COMPLETED,
    paymentMethod: PaymentMethod.USSD,
    reference: 'TXN-2024-004',
    description: 'Late payment for October 2024',
    user: mockUsers[0],
    group: mockGroups[2]
  },
  {
    id: 'contrib-5',
    groupId: 'group-2',
    userId: '1',
    amount: 25000,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date().toISOString(),
    type: ContributionType.REGULAR,
    status: ContributionStatus.PENDING,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    reference: 'TXN-2024-005',
    description: 'Weekly contribution for week 49',
    user: mockUsers[0],
    group: mockGroups[1]
  },
  {
    id: 'contrib-6',
    groupId: 'group-4',
    userId: '1',
    amount: 75000,
    date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 53 * 24 * 60 * 60 * 1000).toISOString(),
    type: ContributionType.REGULAR,
    status: ContributionStatus.COMPLETED,
    paymentMethod: PaymentMethod.MOBILE_MONEY,
    reference: 'TXN-2024-006',
    description: 'Final vacation fund contribution',
    user: mockUsers[0],
    group: mockGroups[3]
  },
  {
    id: 'contrib-7',
    groupId: 'group-1',
    userId: '1',
    amount: 25000,
    date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString(),
    type: ContributionType.ADVANCE_PAYMENT,
    status: ContributionStatus.COMPLETED,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    reference: 'TXN-2024-007',
    description: 'Advance payment for next month',
    user: mockUsers[0],
    group: mockGroups[0]
  },
  {
    id: 'contrib-8',
    groupId: 'group-3',
    userId: '1',
    amount: 5000,
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    type: ContributionType.PENALTY,
    status: ContributionStatus.COMPLETED,
    paymentMethod: PaymentMethod.CARD,
    reference: 'TXN-2024-008',
    description: 'Late payment penalty',
    user: mockUsers[0],
    group: mockGroups[2]
  },
  {
    id: 'contrib-9',
    groupId: 'group-2',
    userId: '1',
    amount: 25000,
    date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 83 * 24 * 60 * 60 * 1000).toISOString(),
    type: ContributionType.REGULAR,
    status: ContributionStatus.FAILED,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    reference: 'TXN-2024-009',
    description: 'Failed payment - insufficient funds',
    user: mockUsers[0],
    group: mockGroups[1]
  },
  {
    id: 'contrib-10',
    groupId: 'group-1',
    userId: '1',
    amount: 25000,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    type: ContributionType.REGULAR,
    status: ContributionStatus.OVERDUE,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    reference: 'TXN-2024-010',
    description: 'Overdue monthly contribution',
    user: mockUsers[0],
    group: mockGroups[0]
  }
]

// Helper function to get user's contributions
export function getUserContributions(userId: string): Contribution[] {
  return mockContributions.filter(contribution => contribution.userId === userId)
}

// Helper function to get group contributions
export function getGroupContributions(groupId: string): Contribution[] {
  return mockContributions.filter(contribution => contribution.groupId === groupId)
}

// Helper function to get recent contributions
export function getRecentContributions(limit: number = 5): Contribution[] {
  return mockContributions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
}

// Mock activities for testing
export const mockActivities: ActivityDetail[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    group_id: '123e4567-e89b-12d3-a456-426614174002',
    type: 'made_contribution',
    description: 'Made a contribution of NGN50,000 to the savings group',
    entity_id: 'contrib-1',
    amount: 50000,
    created_at: new Date().toISOString()
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174003',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    group_id: '123e4567-e89b-12d3-a456-426614174004',
    type: 'joined_group',
    description: 'Joined the savings group',
    entity_id: 'group-2',
    amount: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174005',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    group_id: '123e4567-e89b-12d3-a456-426614174002',
    type: 'created_group',
    description: 'Created a new savings group called Family Savings',
    entity_id: 'group-1',
    amount: null,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174006',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    group_id: null,
    type: 'updated_profile',
    description: 'Updated profile information',
    entity_id: '1',
    amount: null,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174007',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    group_id: '123e4567-e89b-12d3-a456-426614174008',
    type: 'made_contribution',
    description: 'Made a contribution of NGN30,000 to the savings group',
    entity_id: 'contrib-8',
    amount: 30000,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  }
]

// Helper function to get user's recent activities
export function getUserActivities(userId: string, limit: number = 10): ActivityDetail[] {
  return mockActivities
    .filter(activity => activity.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
} 