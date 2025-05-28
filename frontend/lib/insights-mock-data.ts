import { AIInsight, InsightCategory, ImplementationStatus, DifficultyLevel } from './types'

export const mockInsights: AIInsight[] = [
  {
    id: '1',
    title: 'Switch to LED Bulbs',
    description: 'Replace incandescent bulbs with energy-efficient LED bulbs to save on electricity costs.',
    category: InsightCategory.ENERGY,
    status: ImplementationStatus.NOT_STARTED,
    difficulty: DifficultyLevel.EASY,
    estimatedSavings: 2000,
    timeframe: 'month',
    implementationTime: '1 week',
    createdAt: '2024-05-15T12:00:00Z',
    metadata: {
      successRate: 85,
      usersImplemented: 320,
      averageTimeToComplete: '4 days'
    },
    group: {
      id: 'grp-1',
      name: 'Green Savers Co-op',
      membersCount: 45
    }
  },
  {
    id: '2',
    title: 'Budget Tracker Tool',
    description: 'Use a budget tracking tool to monitor expenses and identify saving opportunities.',
    category: InsightCategory.FINANCIAL,
    status: ImplementationStatus.IN_PROGRESS,
    difficulty: DifficultyLevel.MEDIUM,
    estimatedSavings: 5000,
    timeframe: 'quarter',
    implementationTime: '2 weeks',
    createdAt: '2024-04-10T09:30:00Z',
    metadata: {
      successRate: 72,
      usersImplemented: 150,
      averageTimeToComplete: '1 week'
    }
  },
  {
    id: '3',
    title: 'Automate Data Reports',
    description: 'Set up automated data reporting for faster insights and less manual work.',
    category: InsightCategory.ANALYTICS,
    status: ImplementationStatus.COMPLETED,
    difficulty: DifficultyLevel.HARD,
    estimatedSavings: 12000,
    timeframe: 'year',
    implementationTime: '3 weeks',
    createdAt: '2024-03-20T08:00:00Z'
  }
]



export const getUserInsights = (userId: string): AIInsight[] => {
  const insightsByUser: Record<string, AIInsight[]> = {
    '1': [
      {
        id: '1',
        title: 'Switch to LED Bulbs',
        description: 'Replace incandescent bulbs with energy-efficient LED bulbs to save on electricity costs.',
        category: InsightCategory.ENERGY,
        status: ImplementationStatus.NOT_STARTED,
        difficulty: DifficultyLevel.EASY,
        estimatedSavings: 2000,
        timeframe: 'month',
        implementationTime: '1 week',
        createdAt: '2024-05-15T12:00:00Z',
        metadata: {
          successRate: 85,
          usersImplemented: 320,
          averageTimeToComplete: '4 days',
        },
        group: {
          id: 'grp-1',
          name: 'Green Savers Co-op',
          membersCount: 45,
        },
        tags: ['energy', 'cost-saving', 'lighting'],
      },
    ],
    '2': [
      {
        id: '2',
        title: 'Budget Tracker Tool',
        description: 'Use a budget tracking tool to monitor expenses and identify saving opportunities.',
        category: InsightCategory.FINANCIAL,
        status: ImplementationStatus.IN_PROGRESS,
        difficulty: DifficultyLevel.MEDIUM,
        estimatedSavings: 5000,
        timeframe: 'quarter',
        implementationTime: '2 weeks',
        createdAt: '2024-04-10T09:30:00Z',
        metadata: {
          successRate: 72,
          usersImplemented: 150,
          averageTimeToComplete: '1 week',
        },
        tags: ['finance', 'tracking'],
      }
    ],
    '3': [
      {
        id: '3',
        title: 'Automate Data Reports',
        description: 'Set up automated data reporting for faster insights and less manual work.',
        category: InsightCategory.ANALYTICS,
        status: ImplementationStatus.COMPLETED,
        difficulty: DifficultyLevel.HARD,
        estimatedSavings: 12000,
        timeframe: 'year',
        implementationTime: '3 weeks',
        createdAt: '2024-03-20T08:00:00Z',
        tags: ['automation', 'data', 'productivity'],
      }
    ]
  };

  return insightsByUser[userId] ?? [];
};