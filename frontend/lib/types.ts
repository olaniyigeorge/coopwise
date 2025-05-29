export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface Group {
  id: string
  name: string
  description?: string
  totalMembers: number
  contributionAmount: number
  frequency: 'weekly' | 'monthly'
  startDate: string
  endDate?: string
  status: 'active' | 'completed' | 'paused'
}

export interface Contribution {
  id: string
  groupId: string
  userId: string
  amount: number
  date: string
  dueDate?: string
  type: ContributionType
  status: ContributionStatus
  paymentMethod: PaymentMethod
  reference?: string
  description?: string
  user?: User
  group?: Group
}

export enum ContributionType {
  REGULAR = 'regular',
  LATE_PAYMENT = 'late_payment',
  ADVANCE_PAYMENT = 'advance_payment',
  PENALTY = 'penalty',
  BONUS = 'bonus'
}

export enum ContributionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  OVERDUE = 'overdue',
  PARTIAL = 'partial'
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
  USSD = 'ussd',
  MOBILE_MONEY = 'mobile_money',
  CASH = 'cash'
}

export interface ContributionSummary {
  totalContributions: number
  totalAmount: number
  pendingContributions: number
  pendingAmount: number
  completedContributions: number
  completedAmount: number
  overdueContributions: number
  overdueAmount: number
}

export interface ContributionFilters {
  groupId?: string
  status?: ContributionStatus[]
  type?: ContributionType[]
  dateFrom?: string
  dateTo?: string
  paymentMethod?: PaymentMethod[]
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ContributionStats {
  thisMonth: {
    total: number
    amount: number
    completed: number
    pending: number
  }
  lastMonth: {
    total: number
    amount: number
    completed: number
    pending: number
  }
  growth: {
    totalPercentage: number
    amountPercentage: number
  }
}

// AI Insights Types
export interface AIInsight {
  id: string
  title: string
  description: string
  category: InsightCategory
  type: InsightType
  difficulty: DifficultyLevel
  estimatedSavings: number
  timeframe: string
  implementationTime: string
  status: ImplementationStatus
  tags: string[]
  groupId?: string
  group?: Group
  createdAt: string
  updatedAt: string
  metadata?: InsightMetadata
}

export enum InsightCategory {
  ENERGY_SAVING = 'energy_saving',
  FINANCIAL_OPTIMIZATION = 'financial_optimization',
  CONTRIBUTION_STRATEGY = 'contribution_strategy',
  SPENDING_ANALYSIS = 'spending_analysis',
  INVESTMENT_TIPS = 'investment_tips',
  BUDGETING = 'budgeting',
  GOAL_SETTING = 'goal_setting'
}

export enum InsightType {
  PERSONAL = 'personal',
  GROUP_SPECIFIC = 'group_specific',
  GENERAL = 'general',
  TRENDING = 'trending'
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export enum ImplementationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DISMISSED = 'dismissed'
}

export interface InsightMetadata {
  successRate?: number
  usersImplemented?: number
  averageTimeToComplete?: string
  prerequisites?: string[]
  relatedInsights?: string[]
  source?: string
}

export interface InsightFilters {
  category?: InsightCategory[]
  type?: InsightType[]
  difficulty?: DifficultyLevel[]
  status?: ImplementationStatus[]
  groupId?: string
  minSavings?: number
  maxSavings?: number
}

export interface InsightSummary {
  totalInsights: number
  completedInsights: number
  inProgressInsights: number
  notStartedInsights: number
  totalPotentialSavings: number
  actualSavingsAchieved: number
  averageDifficulty: string
}

export interface InsightProgress {
  insightId: string
  userId: string
  startedAt: string
  completedAt?: string
  progress: number // 0-100
  notes?: string
  actualSavings?: number
} 