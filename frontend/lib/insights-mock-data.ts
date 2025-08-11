import { 
  AIInsight, 
  InsightCategory, 
  InsightType,
  DifficultyLevel, 
  ImplementationStatus
} from './types'
import { mockGroups } from './mock-data'

// Re-export mockGroups for use in AI insights pages
export { mockGroups }

export const mockInsights: AIInsight[] = [
  {
    id: 'insight-1',
    title: 'Save energy',
    description: 'Reduce your electricity bill by 10% by turning off the light and unplug devices when not in use',
    category: InsightCategory.ENERGY_SAVING,
    type: InsightType.PERSONAL,
    difficulty: DifficultyLevel.EASY,
    estimatedSavings: 10000,
    timeframe: 'Month',
    implementationTime: '1 week',
    status: ImplementationStatus.NOT_STARTED,
    tags: ['electricity', 'energy', 'simple'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      successRate: 85,
      usersImplemented: 1250,
      averageTimeToComplete: '3 days',
      source: 'AI Analysis'
    }
  },
  {
    id: 'insight-2',
    title: 'Optimize group contributions',
    description: 'Increase your group contribution by 15% to maximize returns and reach goals faster',
    category: InsightCategory.CONTRIBUTION_STRATEGY,
    type: InsightType.GROUP_SPECIFIC,
    difficulty: DifficultyLevel.MEDIUM,
    estimatedSavings: 25000,
    timeframe: 'Month',
    implementationTime: '2 weeks',
    status: ImplementationStatus.IN_PROGRESS,
    tags: ['contributions', 'optimization', 'group'],
    groupId: 'group-1',
    group: mockGroups[0],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      successRate: 78,
      usersImplemented: 890,
      averageTimeToComplete: '1 week',
      source: 'Group Performance Analysis'
    }
  },
  {
    id: 'insight-3',
    title: 'Smart budgeting strategy',
    description: 'Implement the 50/30/20 rule: 50% needs, 30% wants, 20% savings to improve financial health',
    category: InsightCategory.BUDGETING,
    type: InsightType.GENERAL,
    difficulty: DifficultyLevel.MEDIUM,
    estimatedSavings: 35000,
    timeframe: 'Month',
    implementationTime: '1 month',
    status: ImplementationStatus.NOT_STARTED,
    tags: ['budgeting', 'planning', 'financial health'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      successRate: 92,
      usersImplemented: 2150,
      averageTimeToComplete: '2 weeks',
      prerequisites: ['Track current spending'],
      source: 'Financial Planning AI'
    }
  },
  {
    id: 'insight-4',
    title: 'Reduce transportation costs',
    description: 'Use public transport or carpool 3 times a week to cut transportation expenses by 40%',
    category: InsightCategory.SPENDING_ANALYSIS,
    type: InsightType.PERSONAL,
    difficulty: DifficultyLevel.EASY,
    estimatedSavings: 15000,
    timeframe: 'Month',
    implementationTime: '1 week',
    status: ImplementationStatus.COMPLETED,
    tags: ['transportation', 'public transport', 'carpool'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      successRate: 75,
      usersImplemented: 980,
      averageTimeToComplete: '4 days',
      source: 'Spending Pattern Analysis'
    }
  },
  {
    id: 'insight-5',
    title: 'Investment diversification',
    description: 'Diversify your investment portfolio across 3-4 different asset classes to reduce risk by 25%',
    category: InsightCategory.INVESTMENT_TIPS,
    type: InsightType.GENERAL,
    difficulty: DifficultyLevel.HARD,
    estimatedSavings: 50000,
    timeframe: 'Month',
    implementationTime: '3 months',
    status: ImplementationStatus.NOT_STARTED,
    tags: ['investment', 'diversification', 'risk management'],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      successRate: 65,
      usersImplemented: 520,
      averageTimeToComplete: '6 weeks',
      prerequisites: ['Basic investment knowledge', 'Emergency fund'],
      source: 'Investment AI Advisor'
    }
  },
  {
    id: 'insight-6',
    title: 'Meal planning savings',
    description: 'Plan your meals weekly and cook at home 5 days a week to reduce food expenses by 30%',
    category: InsightCategory.SPENDING_ANALYSIS,
    type: InsightType.PERSONAL,
    difficulty: DifficultyLevel.MEDIUM,
    estimatedSavings: 20000,
    timeframe: 'Month',
    implementationTime: '2 weeks',
    status: ImplementationStatus.IN_PROGRESS,
    tags: ['food', 'meal planning', 'cooking'],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      successRate: 82,
      usersImplemented: 1680,
      averageTimeToComplete: '10 days',
      source: 'Lifestyle Analysis'
    }
  },
  {
    id: 'insight-7',
    title: 'Subscription audit',
    description: 'Review and cancel unused subscriptions to save up to ₦8,000 monthly on recurring charges',
    category: InsightCategory.FINANCIAL_OPTIMIZATION,
    type: InsightType.PERSONAL,
    difficulty: DifficultyLevel.EASY,
    estimatedSavings: 8000,
    timeframe: 'Month',
    implementationTime: '2 hours',
    status: ImplementationStatus.NOT_STARTED,
    tags: ['subscriptions', 'recurring charges', 'audit'],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      successRate: 95,
      usersImplemented: 3200,
      averageTimeToComplete: '1 day',
      source: 'Spending Pattern AI'
    }
  },
  {
    id: 'insight-8',
    title: 'Emergency fund goal',
    description: 'Build an emergency fund covering 6 months of expenses to improve financial security',
    category: InsightCategory.GOAL_SETTING,
    type: InsightType.PERSONAL,
    difficulty: DifficultyLevel.HARD,
    estimatedSavings: 0, // This is more about security than direct savings
    timeframe: 'Year',
    implementationTime: '12 months',
    status: ImplementationStatus.IN_PROGRESS,
    tags: ['emergency fund', 'financial security', 'long-term'],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      successRate: 58,
      usersImplemented: 750,
      averageTimeToComplete: '8 months',
      prerequisites: ['Stable income', 'Basic budgeting'],
      source: 'Financial Security AI'
    }
  },
  {
    id: 'insight-9',
    title: 'Automate savings',
    description: 'Set up automatic transfers to savings account right after salary to save 20% consistently',
    category: InsightCategory.FINANCIAL_OPTIMIZATION,
    type: InsightType.TRENDING,
    difficulty: DifficultyLevel.EASY,
    estimatedSavings: 40000,
    timeframe: 'Month',
    implementationTime: '1 hour',
    status: ImplementationStatus.NOT_STARTED,
    tags: ['automation', 'savings', 'consistency'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      successRate: 90,
      usersImplemented: 4500,
      averageTimeToComplete: '2 days',
      source: 'Behavioral Finance AI'
    }
  },
  {
    id: 'insight-10',
    title: 'Join Community Challenge',
    description: 'Participate in the monthly savings challenge with your group to earn bonus rewards',
    category: InsightCategory.FINANCIAL_OPTIMIZATION,
    type: InsightType.TRENDING,
    difficulty: DifficultyLevel.EASY,
    estimatedSavings: 12000,
    timeframe: 'Month',
    implementationTime: '5 minutes',
    status: ImplementationStatus.NOT_STARTED,
    tags: ['community', 'challenge', 'rewards'],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      successRate: 88,
      usersImplemented: 2800,
      averageTimeToComplete: '1 day',
      source: 'Community Engagement AI'
    }
  }
]

// Helper functions to get insights
export function getUserInsights(): AIInsight[] {
  // In a real app, this would filter insights by user ID
  return mockInsights
}

export function getGroupInsights(groupId: string): AIInsight[] {
  return mockInsights.filter(insight => insight.groupId === groupId)
}

export function getRecentInsights(limit: number = 5): AIInsight[] {
  return mockInsights
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}

export function getTrendingInsights(limit: number = 3): AIInsight[] {
  return mockInsights
    .filter(insight => insight.type === InsightType.TRENDING)
    .slice(0, limit)
}

export function getInsightsByCategory(category: InsightCategory): AIInsight[] {
  return mockInsights.filter(insight => insight.category === category)
}

export function getActionableInsights(limit: number = 5): AIInsight[] {
  return mockInsights
    .filter(insight => 
      insight.status === ImplementationStatus.NOT_STARTED || 
      insight.status === ImplementationStatus.IN_PROGRESS
    )
    .slice(0, limit)
}
